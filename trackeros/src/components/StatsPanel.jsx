import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { fmtDateKey, getISOWeekStr } from '../utils/time';
import GoalManager from './GoalManager';

function getWeekDays() {
  const today = new Date();
  const todayKey = fmtDateKey(today);
  const dayNames = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
  const sunday = new Date(today);
  const dow = today.getDay();
  sunday.setDate(today.getDate() - dow);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    const key = fmtDateKey(d);
    return { key, name: dayNames[d.getDay()], isToday: key === todayKey, isFuture: d > today && key !== todayKey };
  });
}

export default function StatsPanel() {
  const [activeTab, setActiveTab] = useState('today');
  const [todayTasks, setTodayTasks] = useState([]);
  const [logs, setLogs] = useState({});
  const [weekActivity, setWeekActivity] = useState([]);
  const [monthActivity, setMonthActivity] = useState({});
  const [goals, setGoals] = useState([]);
  const [templates, setTemplates] = useState({});
  const [showNudge, setShowNudge] = useState(false);
  const weekDays = getWeekDays();
  const todayKey = fmtDateKey(new Date());

  const load = React.useCallback(async () => {
    try {
      const [tasks, logData, goalsData, templatesData] = await Promise.all([
        window.tracker.getTasks(todayKey),
        window.tracker.getLogs(),
        window.tracker.getGoals(),
        window.tracker.getTemplates(),
      ]);
      setTodayTasks(tasks || []);
      setLogs(logData || {});
      setGoals(goalsData || []);
      setTemplates(templatesData || {});

      // Load last 28 days of activity for heatmap and donut chart
      const activityPromises = [];
      const dates = [];
      for (let i = 27; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = fmtDateKey(d);
        dates.push(key);
        activityPromises.push(window.tracker.getActivity(key));
      }
      const activityResults = await Promise.all(activityPromises);
      
      const activityMap = {};
      dates.forEach((key, idx) => {
        activityMap[key] = activityResults[idx] || [];
      });
      setMonthActivity(activityMap);

      // Extract last 7 days for donut chart
      const weekActs = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = fmtDateKey(d);
        weekActs.push(...(activityMap[key] || []));
      }
      setWeekActivity(weekActs);
    } catch (e) { console.error('StatsPanel:', e); }
  }, [todayKey]);

  useEffect(() => {
    load();
    const id = setInterval(load, 30000);
    // Re-fetch immediately every time the stats window is opened
    const unsubscribe = window.tracker?.onStatsRefresh?.(() => load());
    const unsubNudge = window.tracker?.onShowReviewNudge?.(() => setShowNudge(true));
    const unsubComplete = window.tracker?.onReviewCompleted?.(() => setShowNudge(false));
    return () => {
      clearInterval(id);
      if (unsubscribe) unsubscribe();
      if (unsubNudge) unsubNudge();
      if (unsubComplete) unsubComplete();
    };
  }, [load]);

  const done  = todayTasks.filter(t => t.done && !t.linkedOutcomeId).length;
  const total = todayTasks.filter(t => !t.linkedOutcomeId).length;
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0;

  const toggleTask = async (taskId) => {
    const updated = todayTasks.map(t => t.id === taskId ? { ...t, done: !t.done, completedAt: !t.done ? new Date().toISOString() : null } : t);
    setTodayTasks(updated);
    await window.tracker?.saveTasks?.(todayKey, updated);
  };

  return (
    <div className="acrylic-root" style={{
      width: '100%', height: '100%',
      background: 'var(--acrylic-base)',
      borderRadius: '12px',
      border: '0.5px solid var(--border-medium)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.55), 0 0 0 0.5px rgba(255,255,255,0.04) inset',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Luminous top edge */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
        background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 30%, rgba(255,255,255,0.18) 70%, transparent 100%)',
        zIndex: 10, pointerEvents: 'none', borderRadius: '12px 12px 0 0',
      }} />

      {/* Review Nudge Banner */}
      {/* {showNudge && (
        <motion.div
          initial={{ y: -40 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-3 py-2"
          style={{
            background: 'rgba(77,142,255,0.08)',
            borderBottom: '0.5px solid rgba(77,142,255,0.2)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <span className="font-mono text-[10px] text-white">📋 Your weekly review is ready</span>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setShowNudge(false);
                window.tracker?.openWeeklyReview?.();
              }}
              className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-[#4d8eff] text-black font-bold transition-all hover:brightness-110 active:scale-95"
            >
              Start →
            </button>
            <button
              onClick={() => setShowNudge(false)}
              className="font-mono text-[9px] px-1.5 py-0.5 rounded text-[#888] hover:text-[#bbb] transition-colors"
            >
              Later
            </button>
          </div>
        </motion.div>
      )} */}

      {/* Title bar */}
      <div className="flex items-center justify-between px-[14px]" style={{
        height: '36px', borderBottom: '0.5px solid var(--divider)',
        WebkitAppRegion: 'drag', flexShrink: 0,
        background: 'rgba(255,255,255,0.02)',
      }}>
        <span className="font-mono uppercase" style={{
          fontSize: '9px', color: 'var(--text-disabled)', letterSpacing: '0.20em',
        }}>
          Tracker · Stats
        </span>
        <button
          id="btn-stats-close"
          onClick={() => window.tracker.closeStats()}
          className="text-[#666] hover:text-[#ff4a4a] transition-colors flex items-center justify-center p-1 rounded-md hover:bg-[rgba(255,74,74,0.1)]"
          style={{ WebkitAppRegion: 'no-drag' }}
          title="Close"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex" style={{
        borderBottom: '0.5px solid var(--divider)',
        padding: '0 14px', flexShrink: 0,
        background: 'rgba(255,255,255,0.01)',
      }}>
        {['today', 'week', 'goals'].map(tab => (
          <button key={tab} id={`tab-${tab}`} onClick={() => setActiveTab(tab)}
            className="font-mono uppercase"
            style={{
              fontSize: '9px', letterSpacing: '0.16em',
              padding: '9px 0', marginRight: '18px',
              background: 'transparent', border: 'none',
              borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
              color: activeTab === tab ? 'var(--accent)' : 'var(--text-disabled)',
              cursor: 'pointer', transition: 'color 0.15s, border-color 0.15s',
            }}
            onMouseEnter={e => { if (activeTab !== tab) e.currentTarget.style.color = 'var(--text-tertiary)'; }}
            onMouseLeave={e => { if (activeTab !== tab) e.currentTarget.style.color = 'var(--text-disabled)'; }}
          >
            {tab}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        {/* <button onClick={() => window.tracker?.openWeeklyReview?.()}
          className="font-mono uppercase text-[#3a3a3a] hover:text-[#4d8eff] transition-colors"
          style={{ fontSize: '9px', letterSpacing: '0.1em', padding: '9px 0', background: 'transparent', border: 'none', cursor: 'pointer' }}
        >
          Weekly Review →
        </button> */}
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px' }}>
        {activeTab === 'today' && <TodayTab done={done} total={total} pct={pct} tasks={todayTasks} weekDays={weekDays} monthActivity={monthActivity} todayKey={todayKey} />}
        {activeTab === 'week'  && <WeekTab weekDays={weekDays} logs={logs} todayKey={todayKey} todayDone={done} todayTotal={total} weekActivity={weekActivity} monthActivity={monthActivity} />}
        {activeTab === 'goals' && <GoalManager goals={goals} setGoals={(g) => { setGoals(g); window.tracker?.saveGoals?.(g); }} tasks={todayTasks.filter(t => !!t.linkedOutcomeId)} onToggleTask={toggleTask} onAddTask={async (text, linkedOutcomeId) => { const newTask = { id: `t_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, text, done: false, linkedOutcomeId, createdAt: new Date().toISOString(), completedAt: null }; const updated = [...todayTasks, newTask]; setTodayTasks(updated); await window.tracker?.saveTasks?.(todayKey, updated); }} />}
      </div>
    </div>
  );
}

function TodayTab({ done, total, pct, tasks, weekDays, monthActivity, todayKey }) {
  return (
    <div>
      {/* Week Pulse Strip */}
      <div className="flex justify-between gap-1 mb-4 bg-[rgba(255,255,255,0.02)] p-2 rounded-lg border border-[rgba(255,255,255,0.05)]">
        {weekDays?.map(day => {
          const acts = monthActivity?.[day.key] || [];
          const actDone = acts.filter(a => a.status === 'done').length;
          const actTotal = acts.length;
          let color = '#333';
          
          if (day.isFuture) {
            color = 'rgba(255,255,255,0.03)';
          } else if (actTotal > 0) {
            const ratio = actDone / actTotal;
            if (ratio === 1) color = '#22c55e';
            else if (ratio >= 0.5) color = '#f59e0b';
            else color = '#ef4444';
          } else if (day.isToday) {
            color = 'var(--accent)';
          } else {
            color = 'rgba(255,255,255,0.05)';
          }

          return (
            <div key={day.key} className="flex flex-col items-center flex-1" title={`${day.name} - ${actDone}/${actTotal} blocks`}>
              <span className="text-[8px] font-mono text-[#888] mb-1.5" style={{ color: day.isToday ? 'var(--text-primary)' : '#888', fontWeight: day.isToday ? 'bold' : 'normal' }}>
                {day.name[0]}
              </span>
              <div 
                className="w-full h-[6px] rounded-full transition-colors" 
                style={{ 
                  background: color, 
                  opacity: day.isFuture ? 0.5 : 1,
                  boxShadow: day.isToday ? `0 0 6px ${color}66` : 'none',
                  border: day.isToday ? `1px solid ${color}` : '1px solid transparent'
                }}
              />
            </div>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
        <AcrylicStatCard value={`${done}/${total}`} label="TASKS DONE" color="var(--green)" />
        <AcrylicStatCard value={`${pct}%`}          label="COMPLETION"  color="var(--accent)" />
      </div>

      {/* Day progress bar */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
          <motion.div
            style={{ height: '100%', background: 'var(--green)', borderRadius: '2px', boxShadow: '0 0 8px var(--green-dim)' }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>

      <div className="font-mono uppercase" style={{
        fontSize: '9px', color: 'var(--text-disabled)',
        letterSpacing: '0.22em', marginBottom: '6px',
      }}>
        Tasks
      </div>
      {tasks.length === 0 ? (
        <div className="font-sans" style={{ fontSize: '11px', color: 'var(--text-disabled)', textAlign: 'center', padding: '12px' }}>
          No tasks for today
        </div>
      ) : tasks.map(task => (
        <div key={task.id} className="flex items-center" style={{ gap: '9px', padding: '4px 0' }}>
          <span style={{ fontSize: '11px', color: task.done ? 'var(--green)' : 'var(--border-strong)' }}>
            {task.done ? '✓' : '○'}
          </span>
          <span className="font-sans" style={{
            fontSize: '11px',
            color: task.done ? 'var(--text-tertiary)' : 'var(--text-secondary)',
            textDecoration: task.done ? 'line-through' : 'none',
          }}>
            {task.text}
          </span>
        </div>
      ))}
    </div>
  );
}

function AcrylicStatCard({ value, label, color }) {
  return (
    <div style={{
      background: 'var(--acrylic-surface)',
      border: '0.5px solid var(--border-subtle)',
      borderRadius: '8px', padding: '12px',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* top highlight */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
        background: 'linear-gradient(90deg, transparent 0%, var(--border-medium) 50%, transparent 100%)',
      }} />
      <div className="font-mono font-semibold" style={{
        fontSize: '20px', color, lineHeight: 1.2, marginBottom: '4px',
        textShadow: `0 0 12px ${color}44`,
      }}>
        {value}
      </div>
      <div className="font-mono uppercase" style={{
        fontSize: '9px', color: 'var(--text-disabled)', letterSpacing: '0.15em',
      }}>
        {label}
      </div>
    </div>
  );
}

function WeekTab({ weekDays, logs, todayKey, todayDone, todayTotal, weekActivity, monthActivity }) {
  const [colors, setColors] = useState({});
  useEffect(() => {
    window.tracker?.getColors?.().then(c => setColors(c || {}));
  }, []);

  const now = new Date();

  // Heatmap: last 28 days
  const heatmapDays = [];
  for (let i = 27; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = fmtDateKey(d);
    
    const dayActs = monthActivity[key] || [];
    const doneCount = dayActs.filter(a => a.status === 'done').length;
    const pct = doneCount > 0 ? Math.min(doneCount * 20, 100) : 0;
    
    heatmapDays.push({ key, pct, isToday: key === todayKey, doneCount });
  }

  // Categories Donut Data — prefer activity log, fall back to logs.categoryTime
  const catTime = {};
  if (weekActivity && weekActivity.length > 0) {
    weekActivity.filter(a => a.status === 'done').forEach(a => {
      catTime[a.category] = (catTime[a.category] || 0) + (a.duration_min || 0);
    });
  } else {
    // Fallback: aggregate from logs for last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = fmtDateKey(d);
      if (logs[key] && logs[key].categoryTime) {
        Object.entries(logs[key].categoryTime).forEach(([cat, mins]) => {
          catTime[cat] = (catTime[cat] || 0) + mins;
        });
      }
    }
  }

  const totalMins = Object.values(catTime).reduce((a,b) => a+b, 0);
  const catArray = Object.entries(catTime).sort((a,b) => b[1] - a[1]);
  const topCat = catArray.length > 0 ? catArray[0][0] : null;

  const heatmapHasData = heatmapDays.some(d => d.pct > 0);
  let summary = "Not enough block data for a weekly summary. Keep logging!";
  if (topCat) {
    const hrs = (catArray[0][1] / 60).toFixed(1);
    summary = `You crushed your ${topCat.toUpperCase()} blocks this week (${hrs}h logged). Keep up the great work!`;
  }

  let cumulativePct = 0;

  return (
    <div className="flex flex-col gap-5">
      {/* Heatmap */}
      <div>
        <div className="font-mono uppercase mb-2" style={{ fontSize: '9px', color: 'var(--text-disabled)', letterSpacing: '0.15em' }}>
          Activity (Last 28 Days)
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
          {heatmapDays.map(day => {
            let color = 'rgba(255,255,255,0.05)';
            if (day.pct > 0) color = `rgba(34, 197, 94, ${0.2 + (day.pct/100)*0.8})`;
            return (
              <div 
                key={day.key} 
                title={`${day.key}: ${day.doneCount || 0} block(s) completed`}
                style={{ 
                  aspectRatio: '1/1', background: color, borderRadius: '3px',
                  border: day.isToday ? '1px solid var(--accent)' : '1px solid transparent'
                }} 
              />
            );
          })}
        </div>
        {!heatmapHasData && (
          <div style={{ fontSize: '10px', color: 'var(--text-disabled)', textAlign: 'center', marginTop: '8px', fontStyle: 'italic' }}>
            Start logging blocks to see your activity here
          </div>
        )}
      </div>

      {/* Donut Chart */}
      <div>
        <div className="font-mono uppercase mb-2" style={{ fontSize: '9px', color: 'var(--text-disabled)', letterSpacing: '0.15em' }}>
          Time Distribution (7d)
        </div>
        {totalMins === 0 ? (
          <div className="text-[11px] text-[var(--text-disabled)] italic py-2">No time logged yet.</div>
        ) : (
          <div className="flex items-center gap-5">
            <svg width="64" height="64" viewBox="0 0 36 36" className="transform -rotate-90 drop-shadow-md">
              {catArray.map(([cat, mins]) => {
                const pct = (mins / totalMins) * 100;
                const strokeDasharray = `${pct} ${100 - pct}`;
                const strokeDashoffset = -cumulativePct;
                cumulativePct += pct;
                const color = colors[cat] || '#888';
                return (
                  <circle
                    key={cat}
                    cx="18" cy="18" r="15.91549430918954"
                    fill="transparent" stroke={color} strokeWidth="4"
                    strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset}
                  />
                );
              })}
            </svg>
            <div className="flex flex-col flex-1 gap-1">
              {catArray.slice(0, 3).map(([cat, mins]) => (
                <div key={cat} className="flex items-center gap-2 text-[10px] font-mono">
                  <span className="w-2 h-2 rounded-full" style={{ background: colors[cat] || '#888' }} />
                  <span className="flex-1 text-[var(--text-secondary)] uppercase truncate">{cat}</span>
                  <span className="text-[var(--text-primary)]">{(mins/60).toFixed(1)}h</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="p-3 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-[8px]">
        <div className="font-mono uppercase mb-1.5" style={{ fontSize: '9px', color: 'var(--text-disabled)', letterSpacing: '0.15em' }}>
          Weekly Summary
        </div>
        <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
          {summary}
        </p>
      </div>

      {/* Recent Journals */}
      {weekActivity && weekActivity.some(a => a.note || a.rating) && (
        <div>
          <div className="font-mono uppercase mb-2" style={{ fontSize: '9px', color: 'var(--text-disabled)', letterSpacing: '0.15em' }}>
            Recent Journals
          </div>
          <div className="flex flex-col gap-2">
            {weekActivity.filter(a => a.note || a.rating).reverse().slice(0, 3).map((a, i) => (
              <div key={i} className="p-2.5 bg-black/20 border border-[rgba(255,255,255,0.05)] rounded-lg">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-mono text-[var(--accent)]">{a.label || a.category}</span>
                  <span className="text-[12px]">
                    {a.rating ? ['😴', '😐', '🙂', '😊', '🚀'][a.rating - 1] : ''}
                  </span>
                </div>
                {a.note && <p className="text-[11px] text-[#ccc] italic">"{a.note}"</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
