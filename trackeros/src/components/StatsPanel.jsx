import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { fmtDateKey } from '../utils/time';

function getWeekDays() {
  const today = new Date();
  const todayKey = fmtDateKey(today);
  const dayNames = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
  const monday = new Date(today);
  const dow = today.getDay();
  monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
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
  const weekDays = getWeekDays();
  const todayKey = fmtDateKey(new Date());

  const load = React.useCallback(async () => {
    try {
      const [tasks, logData] = await Promise.all([
        window.tracker.getTasks(todayKey),
        window.tracker.getLogs(),
      ]);
      setTodayTasks(tasks || []);
      setLogs(logData || {});

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
    return () => {
      clearInterval(id);
      if (unsubscribe) unsubscribe();
    };
  }, [load]);

  const done  = todayTasks.filter(t => t.done).length;
  const total = todayTasks.length;
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0;

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

      {/* Title bar */}
      <div className="flex items-center justify-between px-[14px]" style={{
        height: '36px', borderBottom: '0.5px solid var(--divider)',
        WebkitAppRegion: 'drag', flexShrink: 0,
        background: 'rgba(255,255,255,0.02)',
      }}>
        <span className="font-mono uppercase" style={{
          fontSize: '9px', color: 'var(--text-disabled)', letterSpacing: '0.20em',
        }}>
          TrackerOS · Stats
        </span>
        <button
          id="btn-stats-close"
          onClick={() => window.tracker.closeStats()}
          style={{
            WebkitAppRegion: 'no-drag',
            width: '11px', height: '11px', borderRadius: '50%',
            background: '#ff5f57', border: 'none', cursor: 'pointer', padding: 0,
            boxShadow: '0 0 6px #ff5f5755',
          }}
        />
      </div>

      {/* Tab bar */}
      <div className="flex" style={{
        borderBottom: '0.5px solid var(--divider)',
        padding: '0 14px', flexShrink: 0,
        background: 'rgba(255,255,255,0.01)',
      }}>
        {['today', 'week'].map(tab => (
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
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px' }}>
        {activeTab === 'today'
          ? <TodayTab done={done} total={total} pct={pct} tasks={todayTasks} />
          : <WeekTab weekDays={weekDays} logs={logs} todayKey={todayKey} todayDone={done} todayTotal={total} weekActivity={weekActivity} monthActivity={monthActivity} />
        }
      </div>
    </div>
  );
}

function TodayTab({ done, total, pct, tasks }) {
  return (
    <div>
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
    </div>
  );
}
