import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useClock } from './hooks/useClock';
import { useTaskStore } from './hooks/useTaskStore';
import { getCurrentBlock, getUpcoming, toMin, fmtDateKey, getISOWeekStr, getDueStatus } from './utils/time';
import { getDayKey } from './utils/schedule';

import TitleBar from './components/TitleBar';

import LiveClock from './components/LiveClock';
import CurrentBlock from './components/CurrentBlock';
import UpcomingList from './components/UpcomingList';
import TaskList from './components/TaskList';
import DayProgress from './components/DayProgress';
import StatsPanel from './components/StatsPanel';
import MiniWidget from './components/MiniWidget';
import DailySetup from './components/DailySetup';
import Timetable from './components/Timetable';
import SettingsPanel from './components/SettingsPanel';
import WeeklyReview from './components/WeeklyReview';
import Onboarding from './components/Onboarding';

const widgetVariants = {
  hidden:  { opacity: 0, y: 10, scale: 0.98 },
  visible: { opacity: 1, y: 0,  scale: 1,
    transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] } },
};

const statsVariants = {
  hidden:  { opacity: 0, x: 14, scale: 0.97 },
  visible: { opacity: 1, x: 0,  scale: 1,
    transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] } },
};

const isStatsWindow =
  window.location.hash === '#/stats' || window.location.hash === '#stats';

const isReviewWindow =
  window.location.hash === '#/weekly-review' || window.location.hash === '#weekly-review';

function StatsRoot() {
  return (
    <motion.div variants={statsVariants} initial="hidden" animate="visible"
      style={{ width: '100vw', height: '100vh' }}>
      <StatsPanel />
    </motion.div>
  );
}

function ReviewRoot() {
  const [logs, setLogs] = useState({});
  const [templates, setTemplates] = useState({});
  const [weekActivity, setWeekActivity] = useState([]);
  const [goals, setGoals] = useState([]);
  const [scheduleConfig, setScheduleConfig] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      window.tracker?.getLogs?.() || Promise.resolve({}),
      window.tracker?.getTemplates?.() || Promise.resolve({}),
      window.tracker?.getWeekActivity?.() || Promise.resolve([]),
      window.tracker?.getGoals?.() || Promise.resolve([]),
      window.tracker?.getScheduleConfig?.() || Promise.resolve({})
    ]).then(([l, t, wa, g, sc]) => {
      setLogs(l);
      setTemplates(t);
      setWeekActivity(wa);
      setGoals(g);
      setScheduleConfig(sc);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="flex h-screen items-center justify-center font-mono text-[11px] text-[#555] bg-[#0d0d0d]">Loading Review...</div>;
  }

  const handleComplete = async (weekStr, reviewData) => {
    if (reviewData.intention) {
      await window.tracker?.saveWeeklyIntention?.(reviewData.intention);
    }
    
    // Task Generation from Focuses
    if (reviewData.activeFocuses && reviewData.activeFocuses.length > 0) {
      const todayKey = new Date().toISOString().split('T')[0]; // basic fmtDateKey equivalent
      const currentTasks = await window.tracker?.getTasks?.(todayKey) || [];
      const newTasks = [];
      
      reviewData.activeFocuses.forEach(foc => {
        // Only generate if a task for this focus doesn't already exist and is pending
        const exists = currentTasks.some(t => t.text === foc.text && t.linkedOutcomeId === foc.parentId && !t.done);
        if (!exists) {
          newTasks.push({
            id: `t_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            text: foc.text,
            linkedOutcomeId: foc.parentId,
            done: false,
            createdAt: new Date().toISOString()
          });
        }
      });
      
      if (newTasks.length > 0) {
        const updatedTasks = [...currentTasks, ...newTasks];
        await window.tracker?.saveTasks?.(todayKey, updatedTasks);
      }
    }
    
    // Schedule Commitment
    if (reviewData.scheduleConfig) {
      await window.tracker?.saveScheduleConfig?.(reviewData.scheduleConfig);
    }

    // Save Reflections (we can save this to logs for the current week)
    if (reviewData.reflection && (reviewData.reflection.wentWell || reviewData.reflection.toImprove)) {
       // A proper implementation could store it, for now we let the tracker know.
       // storeSet(`reflections.${weekStr}`, reviewData.reflection);
    }
    
    window.tracker?.completeWeeklyReview?.(weekStr);
  };

  return (
    <motion.div variants={statsVariants} initial="hidden" animate="visible"
      style={{ width: '100vw', height: '100vh' }}>
      <WeeklyReview
        logs={logs}
        templates={templates}
        weekActivity={weekActivity}
        goals={goals}
        initialScheduleConfig={scheduleConfig}
        onSaveGoals={(g) => {
          window.tracker?.saveGoals?.(g);
          setGoals(g);
        }}
        onComplete={handleComplete}
        onSkip={() => {
          window.tracker?.closeWeeklyReview?.(); // Close only the review window
        }}
      />
    </motion.div>
  );
}

function MorningBriefing({ streak, nextBlocks, dueTasks, intention, onDismiss }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 50, scale: 0.95 }} 
      animate={{ opacity: 1, y: 0, scale: 1 }} 
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="absolute inset-x-3 bottom-3 bg-[var(--acrylic-surface)] rounded-xl border border-[var(--border-strong)] p-4 shadow-2xl z-50 backdrop-blur-xl"
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-mono text-[13px] text-white font-bold flex items-center gap-2"><span>☀️</span> Morning Briefing</h3>
        <span className="text-[10px] text-[var(--accent)] font-bold bg-[rgba(255,255,255,0.05)] px-2 py-1 rounded-md">🔥 {streak} Day Streak</span>
      </div>
      {intention && (
        <div className="mb-4 p-2.5 bg-[rgba(77,142,255,0.08)] border border-[rgba(77,142,255,0.2)] rounded-lg">
          <div className="text-[9px] text-[var(--accent)] uppercase tracking-widest mb-1 font-bold">This week's intention</div>
          <p className="text-[11px] text-[#ccc] italic">"{intention}"</p>
        </div>
      )}
      
      <div className="mb-4">
        <div className="text-[9px] text-[var(--accent)] uppercase tracking-widest mb-1.5 font-bold">Coming up today</div>
        <div className="flex flex-col gap-1.5">
          {nextBlocks.length > 0 ? nextBlocks.map((b, i) => (
            <div key={b.id} className="text-[11px] text-[#e0e0e0] flex items-center gap-2">
              <span className="text-[9px] font-mono text-[#888] w-[32px]">{b.start}</span> {b.label}
            </div>
          )) : <div className="text-[11px] text-[#888]">No blocks scheduled.</div>}
        </div>
      </div>

      {dueTasks.length > 0 && (
        <div className="mb-4">
          <div className="text-[9px] text-[#ff5f57] uppercase tracking-widest mb-1.5 font-bold flex items-center gap-1">⚠️ Due Today</div>
          <div className="flex flex-col gap-1.5">
            {dueTasks.map(t => (
              <div key={t.id} title={t.dueDate ? `Due: ${t.dueDate}` : 'Due'} className="text-[11px] text-[#e0e0e0] flex items-center gap-2">
                <span className="w-[4px] h-[4px] rounded-full bg-[#ff5f57]"></span> {t.label}
              </div>
            ))}
          </div>
        </div>
      )}

      <button onClick={onDismiss} className="w-full py-2.5 bg-[var(--accent)] text-black rounded-lg text-[11px] font-bold hover:brightness-110 active:scale-[0.98] transition-all">
        Let's Go 🚀
      </button>
    </motion.div>
  );
}

function MicroJournal({ block, onSave, onSkip }) {
  const [note, setNote] = useState('');
  const [rating, setRating] = useState(0);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      className="absolute inset-x-3 bottom-3 bg-[var(--acrylic-surface)] rounded-xl border border-[var(--border-strong)] p-4 shadow-2xl z-50 backdrop-blur-xl"
    >
      <div className="mb-3 flex justify-between items-center">
        <h3 className="font-mono text-[12px] text-white">Micro-Journal</h3>
        <span className="text-[10px] text-[#888] truncate ml-2 max-w-[120px]">{block?.label}</span>
      </div>

      <div className="flex justify-between px-2 mb-4">
        {['😴', '😐', '🙂', '😊', '🚀'].map((emoji, idx) => (
          <button 
            key={idx}
            onClick={() => setRating(idx + 1)}
            className={`text-[18px] transition-transform hover:scale-125 ${rating === idx + 1 ? 'scale-125 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] grayscale-0' : 'grayscale opacity-50'}`}
          >
            {emoji}
          </button>
        ))}
      </div>

      <input 
        type="text" 
        value={note}
        onChange={e => setNote(e.target.value)}
        placeholder="1-line summary... (optional)"
        className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-md px-3 py-2 text-[11px] text-white outline-none focus:border-[var(--accent)] mb-4 transition-colors"
        onKeyDown={e => { if(e.key === 'Enter') onSave(note, rating); }}
      />

      <div className="flex gap-2">
        <button onClick={onSkip} className="flex-1 py-2 text-[10px] text-[#888] hover:text-white transition-colors">Skip</button>
        <button onClick={() => onSave(note, rating)} className="flex-1 py-2 bg-[var(--accent)] text-black rounded-lg text-[11px] font-bold hover:brightness-110 transition-all">Save</button>
      </div>
    </motion.div>
  );
}

function WidgetRoot() {
  const now = useClock();
  const { tasks, addTask, toggleTask } = useTaskStore();
  const [routine, setRoutine] = useState([]);
  const [colors, setColors] = useState({});
  const [viewState, setViewState] = useState('loading'); // loading, setup, full, mini
  const [autoTemplate, setAutoTemplate] = useState(null);
  const [showBriefing, setShowBriefing] = useState(false);
  const [streak, setStreak] = useState(0);
  const [journalingBlock, setJournalingBlock] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [weekActivity, setWeekActivity] = useState([]);
  const [weeklyIntention, setWeeklyIntention] = useState('');

  // Global Pomodoro Timer State
  const [pomoActive, setPomoActive] = useState(false);
  const [pomoMode, setPomoMode] = useState('focus'); // focus | break
  const [pomoTimeLeft, setPomoTimeLeft] = useState(25 * 60);
  const [ambientTrack, setAmbientTrack] = useState('none');
  const [updateReady, setUpdateReady] = useState(false);

  // Legacy Review State (removed inline modal, kept goals/cats for widget)
  const [goals, setGoals] = useState([]);
  const [categories, setCategories] = useState([]);

  const [currentDateKey, setCurrentDateKey] = useState(() => {
    return fmtDateKey(new Date());
  });

  const init = async () => {
      const today = new Date();
      const dateKey = fmtDateKey(today);
      const dayKey = getDayKey(today);

      const r = await window.tracker?.getDailyRoutine?.(dateKey);
      if (r && r.length) {
        setRoutine(r);
      }
      
      const c = await window.tracker?.getColors?.();
      if (c) setColors(c);

      const [g, cats] = await Promise.all([
        window.tracker?.getGoals?.(),
        window.tracker?.getCategories?.()
      ]);
      if (g) setGoals(g);
      if (cats) setCategories(cats);

      // Load weekly intention for Morning Briefing
      const intention = await window.tracker?.getWeeklyIntention?.();
      if (intention) setWeeklyIntention(intention);

      const isMini = await window.tracker?.isMiniMode?.();
      if (isMini) {
        setViewState('mini');
        return;
      }

      // Check onboarding — show only if never done
      const onboardingDone = await window.tracker?.getOnboardingDone?.();
      if (!onboardingDone) {
        setShowOnboarding(true);
        setViewState('full'); // set a default so onboarding can dismiss to setup
        return;
      }

      // Legacy Weekly Review trigger removed from here; handled by main.js via nudge now

      const lastSetup = await window.tracker?.getSetupState?.();
      
      if (lastSetup === dateKey) {
        // Already set up today, start in mini mode
        window.tracker?.minimize?.();
        return;
      }

      // Not set up today — check auto-schedule
      const scheduleConfig = await window.tracker?.getScheduleConfig?.();
      const autoTpl = scheduleConfig?.[dayKey];
      
      if (autoTpl) {
        setAutoTemplate(autoTpl);
      }

      // Show the Daily Setup wizard (it will act as a Start Day confirmation if auto-scheduled)
      setViewState('setup');
  };

  // Initial load
  useEffect(() => {
    init();

    const goalPollId = setInterval(async () => {
      const g = await window.tracker?.getGoals?.();
      if (g) setGoals(g);
    }, 5000);

    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    window.tracker?.onViewStateChange?.((state) => {
      setViewState(prev => prev === 'setup' ? 'setup' : state);
    });

    window.tracker?.onUpdateReady?.(() => {
      setUpdateReady(true);
    });

    window.tracker?.onSkipCurrentBlock?.(() => {
      setRoutine(prevRoutine => {
        const n = new Date();
        const nm = n.getHours() * 60 + n.getMinutes();
        const cBlock = prevRoutine.find(b => {
          const [hs, ms] = b.start.split(':').map(Number);
          const [he, me] = b.end.split(':').map(Number);
          return (hs * 60 + ms) <= nm && nm < (he * 60 + me);
        });
        if (cBlock) {
          const updated = prevRoutine.map(b => b.id === cBlock.id ? { ...b, status: 'skipped' } : b);
          const dateKey = fmtDateKey(n);
          window.tracker?.saveDailyRoutine?.(dateKey, updated).catch(console.error);
          return updated;
        }
        return prevRoutine;
      });
    });

    return () => clearInterval(goalPollId);
  }, []);

  // Midnight rollover: detect when the date changes while app is running
  useEffect(() => {
    const checkMidnight = () => {
      const newKey = fmtDateKey(new Date());
      if (newKey !== currentDateKey) {
        setCurrentDateKey(newKey);
        setViewState('loading');
        init();
      }
    };
    const midnightTimer = setInterval(checkMidnight, 60000);
    return () => clearInterval(midnightTimer);
  }, [currentDateKey]);

  const currentBlock = getCurrentBlock(routine, now);

  // Reset Pomodoro when block changes
  useEffect(() => {
    setPomoActive(false);
    setPomoMode('focus');
    setPomoTimeLeft(25 * 60);
  }, [currentBlock?.id]);

  // Pomodoro Countdown Logic
  useEffect(() => {
    let interval = null;
    if (pomoActive && pomoTimeLeft > 0) {
      interval = setInterval(() => {
        setPomoTimeLeft(t => t - 1);
      }, 1000);
    } else if (pomoActive && pomoTimeLeft === 0) {
      // Ring!
      const audio = new Audio();
      audio.play().catch(() => {});
      
      if (pomoMode === 'focus') {
        setPomoMode('break');
        setPomoTimeLeft(5 * 60);
      } else {
        setPomoMode('focus');
        setPomoTimeLeft(25 * 60);
        setPomoActive(false); // auto-stop after break
      }
    }
    return () => clearInterval(interval);
  }, [pomoActive, pomoTimeLeft, pomoMode]);

  const audioRef = useRef(null);
  const prevBlockIdRef = useRef(null);

  // Play transition chime when block changes
  useEffect(() => {
    if (currentBlock && prevBlockIdRef.current && prevBlockIdRef.current !== currentBlock.id) {
      window.tracker?.getSoundAlertsStatus?.().then(enabled => {
        if (enabled !== false) {
          const chime = new Audio();
          chime.volume = 0.45;
          chime.play().catch(() => {});
        }
      });
    }
    prevBlockIdRef.current = currentBlock ? currentBlock.id : null;
  }, [currentBlock?.id]);

  // Ambient soundscape player loop
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const TRACKS = {
      none: null,
      lofi: '/audio/lofi.mp3',
      rain: '/audio/rain.mp3',
      noise: '/audio/noise.mp3'
    };

    const trackUrl = TRACKS[ambientTrack];
    if (pomoActive && pomoMode === 'focus' && trackUrl) {
      const audio = new Audio(trackUrl);
      audio.loop = true;
      audio.volume = 0.35;
      audioRef.current = audio;
      audio.play().catch(err => console.log('Ambient audio play failed', err));
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [ambientTrack, pomoActive, pomoMode]);

  const pomoState = {
    active: pomoActive,
    mode: pomoMode,
    timeLeft: pomoTimeLeft,
    ambientTrack,
    setAmbientTrack,
    toggle: () => setPomoActive(!pomoActive),
    reset: () => {
      setPomoActive(false);
      setPomoMode('focus');
      setPomoTimeLeft(25 * 60);
    }
  };
  const upcoming     = getUpcoming(routine, now, 4);
  const done  = (tasks || []).filter(t => t.done).length;
  const total = (tasks || []).length;

  const currentBlockColor = (currentBlock && colors && colors[currentBlock.category]) ? colors[currentBlock.category] : '#4cc2ff';

  const updateBlockStatus = async (id, status) => {
    const updated = routine.map(b => b.id === id ? { ...b, status } : b);
    setRoutine(updated);
    const today = new Date();
    const dateKey = fmtDateKey(today);
    await window.tracker?.saveDailyRoutine?.(dateKey, updated);

    const block = routine.find(b => b.id === id);

    if (status === 'done' && block) {
      if (viewState === 'mini') {
        window.tracker?.expandWidget?.();
        setViewState('full');
      }
      setJournalingBlock(block);

      if (block?.linkedOutcomeId) {
        const goalsData = await window.tracker?.getGoals?.() || [];
        let modified = false;
        const newGoals = goalsData.map(g => {
          if (g.id === block.linkedOutcomeId && g.autoIncrementOnDone) {
            modified = true;
            const current = Number(g.currentValue) || 0;
            return {
              ...g,
              currentValue: current + 1,
              history: [...(g.history || []), { date: dateKey, value: current + 1 }]
            };
          }
          return g;
        });
        if (modified) {
          setGoals(newGoals);
          await window.tracker?.saveGoals?.(newGoals);
        }
      }
    } else if (block) {
      window.tracker?.logActivity?.(block, status);
    }
  };

  const handleEarlyComplete = async (id, remainingMins, action) => {
    const updated = [...routine];
    const blockIdx = updated.findIndex(b => b.id === id);
    if (blockIdx === -1) return;
    
    const block = updated[blockIdx];
    const nowTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const originalEnd = block.end;
    
    // Mark current block as done, and adjust its end time to now
    updated[blockIdx] = { ...block, status: 'done', end: nowTimeStr };

    if (action === 'next') {
      // Find the next upcoming block and shift its start time
      for (let i = blockIdx + 1; i < updated.length; i++) {
        if (updated[i].status === 'pending') {
          updated[i] = { ...updated[i], start: nowTimeStr };
          break;
        }
      }
    } else if (action === 'rest') {
      const restBlock = {
        id: `b_${Date.now()}_rest`,
        label: 'Early Finish Rest',
        category: 'health',
        isMaintenance: true,
        start: nowTimeStr,
        end: originalEnd,
        status: 'pending'
      };
      updated.splice(blockIdx + 1, 0, restBlock);
    } else if (action === 'pending') {
      const pendingBlock = {
        id: `b_${Date.now()}_pending`,
        label: 'Pending Tasks',
        category: 'dev',
        isMaintenance: false,
        start: nowTimeStr,
        end: originalEnd,
        status: 'pending'
      };
      updated.splice(blockIdx + 1, 0, pendingBlock);
    }

    setRoutine(updated);
    const today = new Date();
    const dateKey = fmtDateKey(today);
    await window.tracker?.saveDailyRoutine?.(dateKey, updated);

    // Trigger completion side effects
    if (viewState === 'mini') {
      window.tracker?.expandWidget?.();
      setViewState('full');
    }
    setJournalingBlock(updated[blockIdx]);

    if (block.linkedOutcomeId) {
      const goalsData = await window.tracker?.getGoals?.() || [];
      let modified = false;
      const newGoals = goalsData.map(g => {
        if (g.id === block.linkedOutcomeId && g.autoIncrementOnDone) {
          modified = true;
          const current = Number(g.currentValue) || 0;
          return {
            ...g,
            currentValue: current + 1,
            history: [...(g.history || []), { date: dateKey, value: current + 1 }]
          };
        }
        return g;
      });
      if (modified) {
        setGoals(newGoals);
        await window.tracker?.saveGoals?.(newGoals);
      }
    }
  };

  const handleSaveJournal = (note, rating) => {
    if (journalingBlock) {
      const loggedBlock = { ...journalingBlock, note, rating };
      window.tracker?.logActivity?.(loggedBlock, 'done');
      setJournalingBlock(null);
    }
  };

  const handleSkipJournal = () => {
    if (journalingBlock) {
      window.tracker?.logActivity?.(journalingBlock, 'done');
      setJournalingBlock(null);
    }
  };



  if (viewState === 'loading') {
    return <div className="flex h-full items-center justify-center text-[var(--text-disabled)] font-mono text-[10px]">Loading Tracker...</div>;
  }

  if (showOnboarding) {
    return (
      <Onboarding onComplete={() => {
        window.tracker?.setOnboardingDone?.();
        setShowOnboarding(false);
        setViewState('setup');
      }} />
    );
  }



  if (viewState === 'setup') {
    return (
      <motion.div variants={widgetVariants} initial="hidden" animate="visible" exit="hidden" className="flex flex-col h-full rounded-[12px] overflow-hidden" style={{ background: 'var(--acrylic-base)', '--accent': currentBlockColor }}>
        <DailySetup 
          autoTemplate={autoTemplate}
          onComplete={async (r, tasksToAdd) => { 
            setRoutine(r); 
            if (tasksToAdd && tasksToAdd.length > 0) {
              tasksToAdd.forEach(t => addTask(t));
            }
            const s = await window.tracker?.getStreak?.();
            setStreak(s || 0);
            setViewState('full'); 
            setShowBriefing(true);
          }} 
        />
      </motion.div>
    );
  }

  const handleUpdateDailyRoutine = async (updatedBlocks) => {
    setRoutine(updatedBlocks);
    await window.tracker?.saveDailyRoutine?.(fmtDateKey(new Date()), updatedBlocks);
  };

  if (viewState === 'timetable') {
    return <Timetable routine={routine} onUpdateRoutine={handleUpdateDailyRoutine} categories={categories} goals={goals} onBack={() => setViewState('full')} onRestartSetup={() => setViewState('setup')} />;
  }

  if (viewState === 'mini') {
    return (
      <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', '--accent': currentBlockColor }}>
        <MiniWidget block={currentBlock} now={now} onExpand={() => window.tracker?.expandWidget?.()} onUpdateStatus={updateBlockStatus} pomoState={pomoState} colors={colors} />
      </div>
    );
  }

  if (viewState === 'settings') {
    return (
      <motion.div variants={widgetVariants} initial="hidden" animate="visible" exit="hidden" className="acrylic-root flex flex-col h-full rounded-[12px] overflow-hidden" style={{ background: 'var(--acrylic-base)', width: '268px', height: '580px', '--accent': currentBlockColor }}>
        <SettingsPanel onClose={() => {
          setViewState('full');
          window.tracker.getColors().then(c => c && setColors(c)); // refresh colors
        }} onViewOnboarding={() => setShowOnboarding(true)} />
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={widgetVariants}
      initial="hidden" animate="visible" exit="hidden"
      className="flex flex-col h-full rounded-[12px] overflow-hidden"
      style={{
        background: 'var(--acrylic-base)',
        border: '0.5px solid var(--border-medium)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.55), 0 0 0 0.5px rgba(255,255,255,0.04) inset',
        position: 'relative',
        '--accent': currentBlockColor,
      }}
    >
      {/* Luminous top edge */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
        background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 30%, rgba(255,255,255,0.18) 70%, transparent 100%)',
        zIndex: 10, pointerEvents: 'none', borderRadius: '12px 12px 0 0',
      }} />

      <TitleBar onStats={() => window.tracker?.openStats()} onTimetable={() => setViewState('timetable')} onSettings={() => setViewState('settings')} />
      
      {updateReady && (
        <div className="bg-[var(--accent)] text-black text-[10px] py-1 px-2 flex justify-between items-center font-medium">
          <span>Update ready!</span>
          <button onClick={() => window.tracker?.restartAndUpdate()} className="bg-black/20 hover:bg-black/30 px-2 py-0.5 rounded transition-colors">
            Restart
          </button>
        </div>
      )}

      <LiveClock />

      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Now section */}
        <div style={{ paddingTop: '8px' }}>
          <SectionLabel>Now</SectionLabel>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentBlock ? currentBlock.id : 'empty'}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
            >
              <CurrentBlock 
                block={currentBlock} 
                now={now} 
                onUpdateStatus={updateBlockStatus} 
                onEarlyComplete={handleEarlyComplete}
                pomoState={pomoState} 
                tasks={tasks.filter(t => currentBlock?.linkedOutcomeId && t.linkedOutcomeId === currentBlock.linkedOutcomeId)}
                onToggleTask={toggleTask}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        <AcrylicDivider />

        {/* Upcoming */}
        <div style={{ padding: '6px 4px 2px' }}>
          <UpcomingList upcoming={upcoming} />
        </div>

        <AcrylicDivider />

        {/* Tasks — only show non-goal-linked tasks here */}
        <div style={{ padding: '6px 4px 8px' }}>
          <TaskList 
            tasks={tasks.filter(t => !t.linkedOutcomeId)} 
            onToggle={toggleTask} 
            onAdd={addTask} 
          />
        </div>
      </div>

      <AnimatePresence>
        {showBriefing && (
          <MorningBriefing 
            streak={streak} 
            nextBlocks={routine.filter(b => {
              if (b.status && b.status !== 'pending') return false;
              const [he, me] = b.end.split(':').map(Number);
              const nowMins = new Date().getHours() * 60 + new Date().getMinutes();
              return (he * 60 + me) > nowMins;
            }).slice(0, 3)}
            dueTasks={goals.filter(g => g.type === 'focus' && !g.done && getDueStatus(g.dueDate)?.text?.includes('today'))}
            intention={weeklyIntention || goals.find(g => g.type === 'focus' && !g.done)?.label}
            onDismiss={() => setShowBriefing(false)} 
          />
        )}
        {journalingBlock && (
          <MicroJournal 
            block={journalingBlock} 
            onSave={handleSaveJournal} 
            onSkip={handleSkipJournal} 
          />
        )}
      </AnimatePresence>

      <div style={{ padding: '4px' }}>
        <DayProgress 
          done={routine.filter(b => !b.isMaintenance && b.status === 'done').length} 
          total={routine.filter(b => !b.isMaintenance).length} 
        />
      </div>
    </motion.div>
  );
}

function SectionLabel({ children }) {
  return (
    <div className="font-mono uppercase" style={{
      fontSize: '9px', color: 'var(--text-disabled)',
      letterSpacing: '0.22em', padding: '0 14px', marginBottom: '4px',
    }}>
      {children}
    </div>
  );
}

function AcrylicDivider() {
  return (
    <div style={{
      height: '0.5px',
      background: 'var(--divider)',
      margin: '6px 0',
    }} />
  );
}

export default function App() {
  React.useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        document.body.classList.add('animations-paused');
      } else {
        document.body.classList.remove('animations-paused');
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    handleVisibility();
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  if (isReviewWindow) return <ReviewRoot />;
  if (isStatsWindow) return <StatsRoot />;
  return <WidgetRoot />;
}
