import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useClock } from './hooks/useClock';
import { useTaskStore } from './hooks/useTaskStore';
import { DEFAULT_ROUTINE } from './data/routine';
import { getCurrentBlock, getUpcoming, toMin, fmtDateKey } from './utils/time';
import { getDayKey, sortBlocks } from './utils/schedule';

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

function StatsRoot() {
  return (
    <motion.div variants={statsVariants} initial="hidden" animate="visible"
      style={{ width: '100vw', height: '100vh' }}>
      <StatsPanel />
    </motion.div>
  );
}

function useSlowerClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function WidgetRoot() {
  const now = useSlowerClock();
  const { tasks, addTask, toggleTask } = useTaskStore();
  const [routine, setRoutine] = useState(DEFAULT_ROUTINE);
  const [colors, setColors] = useState({});
  const [viewState, setViewState] = useState('loading'); // loading, setup, full, mini
  const [autoTemplate, setAutoTemplate] = useState(null);

  // Global Pomodoro Timer State
  const [pomoActive, setPomoActive] = useState(false);
  const [pomoMode, setPomoMode] = useState('focus'); // focus | break
  const [pomoTimeLeft, setPomoTimeLeft] = useState(25 * 60);
  const [ambientTrack, setAmbientTrack] = useState('none');

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

      const isMini = await window.tracker?.isMiniMode?.();
      if (isMini) {
        setViewState('mini');
        return;
      }

      const lastSetup = await window.tracker?.getSetupState?.();
      
      if (lastSetup === dateKey) {
        // Already set up today
        setViewState('full');
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

    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    window.tracker?.onViewStateChange?.((state) => {
      setViewState(prev => prev === 'setup' ? 'setup' : state);
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
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.play().catch(e => console.log('Audio play failed', e));
      
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
          const chime = new Audio('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
          chime.volume = 0.45;
          chime.play().catch(e => console.log('Transition chime play failed', e));
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
      lofi: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      rain: 'https://assets.mixkit.co/active_storage/sfx/2448/2448-preview.mp3',
      noise: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'
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
  };

  if (viewState === 'loading') {
    return <div className="flex h-full items-center justify-center text-[var(--text-disabled)] font-mono text-[10px]">Loading TrackerOS...</div>;
  }

  if (viewState === 'setup') {
    return (
      <motion.div variants={widgetVariants} initial="hidden" animate="visible" exit="hidden" className="flex flex-col h-full rounded-[12px] overflow-hidden" style={{ background: 'var(--acrylic-base)', '--accent': currentBlockColor }}>
        <DailySetup 
          autoTemplate={autoTemplate}
          onComplete={(r, tasksToAdd) => { 
            setRoutine(r); 
            if (tasksToAdd && tasksToAdd.length > 0) {
              tasksToAdd.forEach(t => addTask(t));
            }
            setViewState('full'); 
          }} 
        />
      </motion.div>
    );
  }

  if (viewState === 'timetable') {
    return <Timetable routine={routine} onBack={() => setViewState('full')} />;
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
        }} />
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
              <CurrentBlock block={currentBlock} now={now} onUpdateStatus={updateBlockStatus} pomoState={pomoState} />
            </motion.div>
          </AnimatePresence>
        </div>

        <AcrylicDivider />

        {/* Upcoming */}
        <div style={{ padding: '6px 4px 2px' }}>
          <UpcomingList upcoming={upcoming} />
        </div>

        <AcrylicDivider />

        {/* Tasks */}
        <div style={{ padding: '6px 4px 8px' }}>
          <TaskList tasks={tasks} onToggle={toggleTask} onAdd={addTask} />
        </div>
      </div>

      <DayProgress done={done} total={total} />
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
  return isStatsWindow ? <StatsRoot /> : <WidgetRoot />;
}
