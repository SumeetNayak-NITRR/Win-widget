import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Slide-level animations ─────────────────────────────────────────────────
const slideVariants = {
  enter: (dir) => ({ opacity: 0, x: dir > 0 ? 36 : -36 }),
  center: { opacity: 1, x: 0 },
  exit:  (dir) => ({ opacity: 0, x: dir > 0 ? -36 : 36 }),
};
const ease = [0.16, 1, 0.3, 1];

// ─── Shared sub-components ───────────────────────────────────────────────────
function SlideIcon({ children, color }) {
  return (
    <div
      className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-5 flex-shrink-0"
      style={{
        background: `linear-gradient(135deg, ${color}22, ${color}0a)`,
        border: `1px solid ${color}44`,
        boxShadow: `0 0 28px ${color}1a`,
      }}
    >
      {children}
    </div>
  );
}

function Heading({ children }) {
  return (
    <h2 className="font-mono text-[15px] font-bold text-white mb-2 leading-snug">
      {children}
    </h2>
  );
}

function Body({ children }) {
  return (
    <p className="text-[11.5px] text-[#888] leading-[1.6] text-center">
      {children}
    </p>
  );
}

// ─── Visuals ─────────────────────────────────────────────────────────────────

// Screen 2: Mini timeline mockup
const DEMO_BLOCKS = [
  { label: 'DSA Practice',   time: '09:00–11:00', cat: '#4d8eff', active: true },
  { label: 'Lunch & Break',  time: '13:00–14:00', cat: '#22c55e', active: false },
  { label: 'Project Work',   time: '14:00–16:30', cat: '#a78bfa', active: false },
];
function BlockTimeline() {
  return (
    <div className="w-full flex flex-col gap-1.5 mt-4">
      {DEMO_BLOCKS.map((b, i) => (
        <div
          key={i}
          className="flex items-center gap-2 px-2.5 py-2 rounded-lg"
          style={{
            background: b.active ? 'rgba(77,142,255,0.08)' : 'rgba(255,255,255,0.03)',
            border: b.active ? '0.5px solid rgba(77,142,255,0.3)' : '0.5px solid rgba(255,255,255,0.06)',
            borderLeft: `2px solid ${b.cat}`,
          }}
        >
          <div className="flex-1 min-w-0">
            <div className="text-[11px] text-[#ddd] font-medium leading-none mb-0.5">{b.label}</div>
            <div className="font-mono text-[9px] text-[#555]">{b.time}</div>
          </div>
          {b.active && (
            <span className="text-[8px] font-mono text-[#4d8eff] uppercase tracking-wider">Now</span>
          )}
        </div>
      ))}
    </div>
  );
}

// Screen 3: Sample tasks
const DEMO_TASKS = [
  { text: 'Submit assignment draft', done: true },
  { text: 'Call the bank before 4 PM', done: false },
  { text: 'Buy groceries', done: false },
];
function TaskRows() {
  return (
    <div className="w-full flex flex-col gap-1.5 mt-4">
      {DEMO_TASKS.map((t, i) => (
        <div
          key={i}
          className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)]"
        >
          <div
            className="w-3.5 h-3.5 rounded-[3px] flex-shrink-0 flex items-center justify-center"
            style={{
              background: t.done ? '#22c55e' : 'rgba(255,255,255,0.05)',
              border: t.done ? 'none' : '1.5px solid rgba(255,255,255,0.2)',
              boxShadow: t.done ? '0 0 8px rgba(34,197,94,0.3)' : 'none',
            }}
          >
            {t.done && <span className="text-[9px] text-black font-bold">✓</span>}
          </div>
          <span
            className="text-[11.5px]"
            style={{ color: t.done ? '#555' : '#ccc', textDecoration: t.done ? 'line-through' : 'none' }}
          >
            {t.text}
          </span>
        </div>
      ))}
    </div>
  );
}

// Screen 4: Goal breadcrumb strip
function GoalBreadcrumb() {
  const items = [
    { icon: '🔥', label: 'Fat Loss', color: '#f59e0b' },
    { icon: '📉', label: 'Body Fat %', color: '#a78bfa' },
    { icon: '🥗', label: 'Cutting carbs', color: '#22c55e' },
  ];
  return (
    <div
      className="w-full flex items-center gap-1.5 px-3 py-2.5 rounded-lg mt-4"
      style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.08)' }}
    >
      {items.map((item, i) => (
        <React.Fragment key={i}>
          <div className="flex items-center gap-1.5">
            <span className="text-[13px]">{item.icon}</span>
            <span className="text-[11px] font-medium" style={{ color: item.color }}>{item.label}</span>
          </div>
          {i < items.length - 1 && (
            <span className="text-[10px] text-[#444]">→</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// Screen 5: Mini heatmap
const HEATMAP_COLORS = [
  'rgba(255,255,255,0.05)',
  'rgba(34, 197, 94, 0.3)',
  'rgba(34, 197, 94, 0.5)',
  'rgba(34, 197, 94, 0.7)',
  'rgba(34, 197, 94, 0.85)',
  'rgba(34, 197, 94, 1.0)'
];
const HEATMAP_DATA = [
  [0,2,3,4,2,1,0],
  [1,3,5,3,4,2,1],
  [0,1,4,5,3,3,2],
  [2,4,3,4,5,4,0],
];
function MiniHeatmap() {
  return (
    <div className="mt-4 w-full">
      <div className="flex gap-1 justify-center">
        {Array.from({ length: 7 }, (_, col) => (
          <div key={col} className="flex flex-col gap-1">
            {HEATMAP_DATA.map((row, r) => (
              <div
                key={r}
                className="w-6 h-6 rounded-[3px]"
                style={{ background: HEATMAP_COLORS[row[col]] }}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex gap-1 items-center justify-center mt-2">
        <span className="text-[9px] text-[#444] font-mono">less</span>
        {HEATMAP_COLORS.slice(1).map((c, i) => (
          <div key={i} className="w-2.5 h-2.5 rounded-[2px]" style={{ background: c }} />
        ))}
        <span className="text-[9px] text-[#444] font-mono">more</span>
      </div>
    </div>
  );
}

// Screen 6: SVG checkmark
function CheckIcon() {
  return (
    <svg width="52" height="52" viewBox="0 0 52 52" fill="none" className="mb-5">
      <circle cx="26" cy="26" r="25" stroke="#4d8eff" strokeWidth="1.5" strokeOpacity="0.3" />
      <circle cx="26" cy="26" r="25" stroke="#4d8eff" strokeWidth="1.5" strokeOpacity="0.08" fill="#4d8eff" fillOpacity="0.06" />
      <polyline points="14,27 22,35 38,18" stroke="#4d8eff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function Onboarding({ onComplete, onSetupNow }) {
  const [step, setStep] = useState(0);
  const [dir, setDir]   = useState(1);
  const TOTAL = 7;

  React.useEffect(() => {
    window.tracker?.setSetupMode?.();
  }, []);

  const go = (next) => {
    setDir(next > step ? 1 : -1);
    setStep(next);
  };
  const next = () => go(step + 1);
  const back = () => go(step - 1);

  const navBack = step > 0 ? (
    <button
      onClick={back}
      className="text-[11px] font-mono text-[#555] hover:text-[#888] transition-colors"
    >
      ← Back
    </button>
  ) : <div />;

  const navNext = (label = 'Next →', accent = '#4d8eff') => (
    <button
      onClick={next}
      className="px-5 py-2 rounded-lg text-[11px] font-bold transition-all hover:brightness-110 active:scale-[0.97]"
      style={{ background: accent, color: '#000' }}
    >
      {label}
    </button>
  );

  const slides = [
    // ── SCREEN 1: Welcome ──────────────────────────────────────────────────
    <motion.div key="s1" variants={slideVariants} initial="enter" animate="center" exit="exit"
      custom={dir} transition={{ duration: 0.26, ease }}
      className="flex flex-col items-center text-center px-4 w-full max-w-[280px]"
    >
      <div className="font-mono text-[26px] font-bold text-white tracking-tight mb-1">Tracker</div>
      <div className="text-[12px] text-[#666] mb-5">Your daily routine, structured.</div>
      <p className="text-[11.5px] text-[#777] leading-[1.65] mb-8">
        Tracker turns your day into a clear sequence of blocks, tasks, and goals.
        Takes 2 minutes to set up. Let's go.
      </p>
      <button
        onClick={next}
        className="w-full py-2.5 rounded-lg text-[12px] font-bold transition-all hover:brightness-110 active:scale-[0.97] mb-3"
        style={{ background: '#4d8eff', color: '#000' }}
      >
        Get Started →
      </button>
      <button
        onClick={onComplete}
        className="text-[10px] text-[#444] hover:text-[#666] transition-colors"
      >
        Skip setup, just open the app
      </button>
    </motion.div>,

    // ── SCREEN 2: Routine Blocks ───────────────────────────────────────────
    <motion.div key="s2" variants={slideVariants} initial="enter" animate="center" exit="exit"
      custom={dir} transition={{ duration: 0.26, ease }}
      className="flex flex-col items-center text-center w-full max-w-[280px]"
    >
      <SlideIcon color="#4d8eff">🗓</SlideIcon>
      <Heading>Your day, block by block</Heading>
      <Body>
        Add fixed time blocks for study, meals, sport, or anything you do daily.
        Tracker tells you what to do right now — and what's coming next.
      </Body>
      <BlockTimeline />
      <div className="flex justify-between items-center w-full mt-5">
        {navBack}
        {navNext()}
      </div>
    </motion.div>,

    // ── SCREEN 3: Floating Tasks ───────────────────────────────────────────
    <motion.div key="s3" variants={slideVariants} initial="enter" animate="center" exit="exit"
      custom={dir} transition={{ duration: 0.26, ease }}
      className="flex flex-col items-center text-center w-full max-w-[280px]"
    >
      <SlideIcon color="#22c55e">✅</SlideIcon>
      <Heading>Tasks that don't belong to a fixed time</Heading>
      <Body>
        Add one-off tasks for today — assignments, calls, errands. Check them off
        as you go. They carry over automatically if you miss them.
      </Body>
      <TaskRows />
      <div className="flex justify-between items-center w-full mt-5">
        {navBack}
        {navNext()}
      </div>
    </motion.div>,

    // ── SCREEN 4: Goals ────────────────────────────────────────────────────
    <motion.div key="s4" variants={slideVariants} initial="enter" animate="center" exit="exit"
      custom={dir} transition={{ duration: 0.26, ease }}
      className="flex flex-col items-center text-center w-full max-w-[280px]"
    >
      <SlideIcon color="#f59e0b">🎯</SlideIcon>
      <Heading>Connect your day to what matters</Heading>
      <Body>
        Link any block to a long-term goal. Tracker shows you the chain:
        what you're doing → what you're building toward.
      </Body>
      <GoalBreadcrumb />
      <p className="text-[10px] text-[#555] mt-2.5 italic">
        Optional — skip this if you just want the schedule.
      </p>
      <div className="flex justify-between items-center w-full mt-4">
        {navBack}
        {navNext()}
      </div>
    </motion.div>,

    // ── SCREEN 5: Stats ────────────────────────────────────────────────────
    <motion.div key="s5" variants={slideVariants} initial="enter" animate="center" exit="exit"
      custom={dir} transition={{ duration: 0.26, ease }}
      className="flex flex-col items-center text-center w-full max-w-[280px]"
    >
      <SlideIcon color="#a78bfa">📊</SlideIcon>
      <Heading>See your patterns over time</Heading>
      <Body>
        The Stats window tracks your daily completion, time by category, and
        a 28-day activity heatmap. Every block you complete builds your history.
      </Body>
      <MiniHeatmap />
      <div className="flex justify-between items-center w-full mt-5">
        {navBack}
        {navNext()}
      </div>
    </motion.div>,

    // ── SCREEN 6: Advanced Features ────────────────────────────────────────
    <motion.div key="s6" variants={slideVariants} initial="enter" animate="center" exit="exit"
      custom={dir} transition={{ duration: 0.26, ease }}
      className="flex flex-col items-center text-center w-full max-w-[280px]"
    >
      <SlideIcon color="#f59e0b">⚡</SlideIcon>
      <Heading>Advanced Block Setup</Heading>
      <div className="text-[11.5px] text-[#888] leading-[1.6] text-center mb-3">
        <p className="mb-2"><strong className="text-[#bbb]">🔗 Link to Goal:</strong> Connect any routine block to a North Star goal to see its Goal Card front and center while you work.</p>
        <p><strong className="text-[#bbb]">🛠️ Maintenance Block:</strong> Mark Sleep, Meals, and Rest blocks as "Maintenance (Ungraded)". They won't hurt your daily productivity score if you skip them!</p>
      </div>
      <div className="flex justify-between items-center w-full mt-4">
        {navBack}
        {navNext()}
      </div>
    </motion.div>,

    // ── SCREEN 7: Ready ────────────────────────────────────────────────────
    <motion.div key="s7" variants={slideVariants} initial="enter" animate="center" exit="exit"
      custom={dir} transition={{ duration: 0.26, ease }}
      className="flex flex-col items-center text-center w-full max-w-[280px]"
    >
      <CheckIcon />
      <Heading>You're all set</Heading>
      <Body>
        Tracker lives in your system tray. Press <span className="font-mono text-[#4d8eff]">Ctrl+Shift+W</span> anytime to
        show or hide it. Start by adding your daily routine.
      </Body>
      <div className="flex flex-col gap-2.5 w-full mt-7">
        <button
          onClick={onSetupNow || onComplete}
          className="w-full py-2.5 rounded-lg text-[12px] font-bold transition-all hover:brightness-110 active:scale-[0.97]"
          style={{ background: '#4d8eff', color: '#000' }}
        >
          Set up my routine →
        </button>
        <button
          onClick={onComplete}
          className="text-[11px] text-[#555] hover:text-[#888] transition-colors"
        >
          I'll explore on my own
        </button>
      </div>
      {navBack && (
        <div className="mt-4">
          {navBack}
        </div>
      )}
    </motion.div>,
  ];

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col overflow-y-auto"
      style={{
        background: 'linear-gradient(160deg, #0a0a14 0%, #0d0d1e 100%)',
      }}
    >
      {/* Progress bar */}
      <div className="flex-shrink-0 px-4 pt-4 pb-2 flex items-center gap-2">
        <div className="flex-1 h-[2px] bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-[#4d8eff]"
            animate={{ width: `${((step + 1) / TOTAL) * 100}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>
        <span className="font-mono text-[9px] text-[#444] flex-shrink-0">{step + 1} / {TOTAL}</span>
        {step > 0 && (
          <button
            onClick={onComplete}
            className="text-[9px] font-mono text-[#444] hover:text-[#777] transition-colors uppercase tracking-widest flex-shrink-0"
          >
            Skip
          </button>
        )}
      </div>

      {/* Slide */}
      <div className="flex-1 flex items-center justify-center p-5 min-h-0">
        <AnimatePresence mode="wait" custom={dir}>
          {slides[step]}
        </AnimatePresence>
      </div>

      {/* Dot indicators */}
      <div className="flex-shrink-0 flex justify-center gap-1.5 pb-5">
        {Array.from({ length: TOTAL }, (_, i) => (
          <motion.div
            key={i}
            animate={{
              width: i === step ? '18px' : '5px',
              opacity: i === step ? 1 : i < step ? 0.5 : 0.2,
            }}
            transition={{ duration: 0.25 }}
            className="h-[5px] rounded-full bg-[#4d8eff]"
          />
        ))}
      </div>
    </div>
  );
}
