import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Helpers ---
function getISOWeekStr(d) {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  const week1 = new Date(date.getFullYear(), 0, 4);
  return `${date.getFullYear()}-W${String(1 + Math.round(
    ((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7
  )).padStart(2, '0')}`;
}

const slideVariants = {
  enter: (dir) => ({ opacity: 0, x: dir > 0 ? 30 : -30 }),
  center: { opacity: 1, x: 0 },
  exit: (dir) => ({ opacity: 0, x: dir > 0 ? -30 : 30 }),
};
const ease = [0.16, 1, 0.3, 1];

export default function WeeklyReview({ logs, templates, weekActivity, goals, initialScheduleConfig, onSaveGoals, onComplete, onSkip }) {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [updatedGoals, setUpdatedGoals] = useState(goals ? JSON.parse(JSON.stringify(goals)) : []);
  
  // For Screen 1.5 (Reflection & Intention)
  const [reflection, setReflection] = useState({ wentWell: '', toImprove: '' });
  const [intention, setIntention] = useState('');

  // For Screen 2 (Numeric Outcomes)
  const numericOutcomes = updatedGoals.filter(g => g.type === 'outcome' && g.valueType === 'numeric');
  const [currentOutcomeIdx, setCurrentOutcomeIdx] = useState(0);
  const [outcomeInput, setOutcomeInput] = useState('');

  // For Screen 3 (Focus addition)
  const outcomes = updatedGoals.filter(g => g.type === 'outcome');
  const [addingFocusFor, setAddingFocusFor] = useState(null);
  const [newFocusText, setNewFocusText] = useState('');

  // For Screen 4 (Schedule)
  const [scheduleConfig, setScheduleConfig] = useState(initialScheduleConfig || {});

  const [isCompleting, setIsCompleting] = useState(false);

  const go = (nextStep) => {
    setDir(nextStep > step ? 1 : -1);
    setStep(nextStep);
  };

  // --- Process Screen 1 Data ---
  const currentWeek = getISOWeekStr(new Date());
  const weekNum = currentWeek.split('-W')[1];
  
  const weekLogs = Object.values(logs || {}).slice(-7);
  const totalBlocks = weekLogs.reduce((acc, l) => acc + (l.blocksTotal || 0), 0);
  const doneBlocks = weekLogs.reduce((acc, l) => acc + (l.blocksDone || 0), 0);
  const completionPct = totalBlocks > 0 ? Math.round((doneBlocks / totalBlocks) * 100) : 0;
  
  let currentStreak = 0;
  if (weekLogs.length > 0) {
    // Quick streak calculation based on the logs given
    for (let i = weekLogs.length - 1; i >= 0; i--) {
      const l = weekLogs[i];
      if (l.blocksTotal > 0 && l.blocksDone / l.blocksTotal >= 0.5) currentStreak++;
      else break;
    }
  }

  const categoryTime = {};
  weekLogs.forEach(l => {
    if (l.categoryTime) {
      Object.entries(l.categoryTime).forEach(([c, t]) => {
        categoryTime[c] = (categoryTime[c] || 0) + t;
      });
    }
  });
  let topCategory = null;
  let topMins = 0;
  Object.entries(categoryTime).forEach(([c, t]) => {
    if (t > topMins) { topMins = t; topCategory = c; }
  });

  const recentJournals = (weekActivity || []).filter(a => a.note || a.rating).reverse().slice(0, 3);

  // --- Handlers ---
  const saveNumericOutcome = () => {
    if (outcomeInput.trim() === '') return nextOutcome();
    
    const val = parseFloat(outcomeInput);
    if (isNaN(val)) return nextOutcome();
    
    const target = numericOutcomes[currentOutcomeIdx];
    const newGoals = updatedGoals.map(g => {
      if (g.id === target.id) {
        return {
          ...g,
          currentValue: val,
          history: [...(g.history || []), { date: new Date().toISOString().split('T')[0], value: val }]
        };
      }
      return g;
    });
    setUpdatedGoals(newGoals);
    onSaveGoals?.(newGoals);
    setOutcomeInput('');
    nextOutcome();
  };

  const nextOutcome = () => {
    if (currentOutcomeIdx < numericOutcomes.length - 1) {
      setCurrentOutcomeIdx(i => i + 1);
    } else {
      if (outcomes.length > 0) go(3);
      else go(4);
    }
  };

  const handleSelectFocus = (focusId, parentId) => {
    const newGoals = updatedGoals.map(g => {
      if (g.type === 'focus' && g.parentId === parentId) {
        return { ...g, active: g.id === focusId };
      }
      return g;
    });
    setUpdatedGoals(newGoals);
    onSaveGoals?.(newGoals);
  };

  const handleAddFocus = (parentId) => {
    if (!newFocusText.trim()) return;
    const newGoal = {
      id: `g_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      type: 'focus',
      parentId,
      text: newFocusText.trim(),
      active: true, // Auto-select the newly added focus
      createdAt: new Date().toISOString()
    };
    
    // Deactivate others
    const newGoals = updatedGoals.map(g => {
      if (g.type === 'focus' && g.parentId === parentId) return { ...g, active: false };
      return g;
    });
    newGoals.push(newGoal);
    
    setUpdatedGoals(newGoals);
    onSaveGoals?.(newGoals);
    setNewFocusText('');
    setAddingFocusFor(null);
  };

  const finishReview = () => {
    setIsCompleting(true);
    setTimeout(() => {
      onComplete?.(currentWeek, {
        intention,
        reflection,
        activeFocuses: updatedGoals.filter(g => g.type === 'focus' && g.active),
        scheduleConfig
      });
      // Reset state so it's fresh if reopened
      setTimeout(() => {
        setIsCompleting(false);
        setStep(0);
        setCurrentOutcomeIdx(0);
        setReflection({ wentWell: '', toImprove: '' });
        setIntention('');
      }, 500);
    }, 800); // Wait for success animation
  };

  const handleScreen1Next = () => {
    go(1); // Always go to reflection
  };

  const handleScreenReflectionNext = () => {
    if (numericOutcomes.length > 0) go(2);
    else if (outcomes.length > 0) go(3);
    else go(4);
  };

  const handleScreen2Back = () => {
    if (currentOutcomeIdx > 0) {
      setCurrentOutcomeIdx(i => i - 1);
    } else {
      go(1); // Back to reflection
    }
  };

  const handleScreen3Back = () => {
    if (numericOutcomes.length > 0) {
      setCurrentOutcomeIdx(numericOutcomes.length - 1);
      go(2);
    } else {
      go(1);
    }
  };

  const handleScreen4Back = () => {
    if (outcomes.length > 0) go(3);
    else if (numericOutcomes.length > 0) go(2);
    else go(1);
  };

  // --- Screens ---

  const renderScreen1 = () => (
    <motion.div key="s1" variants={slideVariants} initial="enter" animate="center" exit="exit" custom={dir} transition={{ duration: 0.25, ease }} className="w-full flex flex-col h-full">
      <div className="font-mono text-[9px] uppercase tracking-wide text-[#3a3a3a] mb-5">WEEK {weekNum} RECAP</div>
      
      {/* 3-col stat grid */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-[8px] p-3 flex flex-col items-center">
          <div className="font-mono text-[20px] text-white mb-0.5">{doneBlocks}</div>
          <div className="font-mono text-[9px] text-[#3a3a3a] uppercase">blocks done</div>
        </div>
        <div className="flex-1 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-[8px] p-3 flex flex-col items-center">
          <div className="font-mono text-[20px] text-white mb-0.5">{completionPct}%</div>
          <div className="font-mono text-[9px] text-[#3a3a3a] uppercase">completion</div>
        </div>
        <div className="flex-1 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-[8px] p-3 flex flex-col items-center">
          <div className="font-mono text-[20px] text-white mb-0.5">{currentStreak} days</div>
          <div className="font-mono text-[9px] text-[#3a3a3a] uppercase">streak 🔥</div>
        </div>
      </div>

      {topCategory && (
        <div className="font-mono text-[10px] text-[#888] mb-6 flex items-center gap-1.5 justify-center">
          Most time spent on <span className="uppercase text-[#ccc]">{topCategory}</span> ({(topMins/60).toFixed(1)}h)
          <span className="w-2 h-2 rounded-full" style={{ background: '#4d8eff' }}></span> {/* Placeholder color, exact CAT_COLOR requires fetching colors */}
        </div>
      )}

      {recentJournals.length > 0 && (
        <div className="flex flex-col gap-2 mb-auto">
          {recentJournals.map((j, i) => (
            <div key={i} className="font-sans text-[11px] text-[#555] truncate bg-[rgba(255,255,255,0.01)] px-2 py-1.5 rounded">
              {j.label} · {j.rating ? ['😵','😐','🙂','😄','🚀'][j.rating-1] : '📝'} {j.note}
            </div>
          ))}
        </div>
      )}
      <div className="mt-auto flex justify-between items-center pt-5">
        <button onClick={onSkip} className="font-mono text-[10px] text-[#444] hover:text-[#666]">Exit</button>
        <button onClick={handleScreen1Next} className="font-mono text-[11px] text-[#4d8eff] hover:brightness-110">Next →</button>
      </div>
    </motion.div>
  );

  const renderScreenReflection = () => (
    <motion.div key="s-ref" variants={slideVariants} initial="enter" animate="center" exit="exit" custom={dir} transition={{ duration: 0.25, ease }} className="w-full flex flex-col h-full">
      <div className="mb-4">
        <div className="font-mono text-[12px] font-bold text-white mb-1 uppercase">Reflection & Intention</div>
        <div className="font-sans text-[11px] text-[#888]">Pause and set the tone for the upcoming week.</div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-[10px] text-[#aaa]">What went well?</label>
          <textarea
            value={reflection.wentWell}
            onChange={e => setReflection({ ...reflection, wentWell: e.target.value })}
            placeholder="I finally finished the..."
            className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-[6px] p-2.5 font-sans text-[12px] text-white outline-none focus:border-[#4d8eff] resize-none h-[60px]"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-[10px] text-[#aaa]">What to improve?</label>
          <textarea
            value={reflection.toImprove}
            onChange={e => setReflection({ ...reflection, toImprove: e.target.value })}
            placeholder="I got distracted by..."
            className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-[6px] p-2.5 font-sans text-[12px] text-white outline-none focus:border-[#4d8eff] resize-none h-[60px]"
          />
        </div>

        <div className="flex flex-col gap-1.5 pt-2 border-t border-[rgba(255,255,255,0.05)]">
          <label className="font-mono text-[10px] text-[#4d8eff] font-bold">Weekly Intention</label>
          <div className="font-sans text-[10px] text-[#888] mb-1">This will appear in your Morning Briefing.</div>
          <input
            type="text"
            value={intention}
            onChange={e => setIntention(e.target.value)}
            placeholder="Deep work and recovery"
            className="bg-[#131313] border border-[#2a2a2a] rounded-[6px] p-2.5 font-sans text-[13px] font-medium text-white outline-none focus:border-[#4d8eff]"
          />
        </div>
      </div>

      <div className="mt-4 flex justify-between items-center pt-3 border-t border-[rgba(255,255,255,0.05)] flex-shrink-0">
        <button onClick={() => go(0)} className="font-mono text-[10px] text-[#444] hover:text-[#666]">← Back</button>
        <button onClick={handleScreenReflectionNext} className="font-mono text-[11px] text-[#4d8eff] hover:brightness-110">Next →</button>
      </div>
    </motion.div>
  );

  const renderScreen2 = () => {
    const target = numericOutcomes[currentOutcomeIdx];
    if (!target) return null;

    const lastVal = target.history?.length > 0 ? target.history[target.history.length-1].value : target.currentValue || 0;

    return (
      <motion.div key="s2" variants={slideVariants} initial="enter" animate="center" exit="exit" custom={dir} transition={{ duration: 0.25, ease }} className="w-full flex flex-col h-full">
        <div className="mb-8">
          <div className="font-mono text-[12px] font-bold text-white mb-1 uppercase">UPDATE YOUR OUTCOMES</div>
          <div className="font-sans text-[11px] text-[#888]">How are your goals tracking this week?</div>
        </div>

        <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-[8px] p-5">
          <div className="flex justify-between items-center mb-4">
            <div className="font-sans text-[14px] text-white font-medium">{target.icon || '🔥'} {target.text}</div>
            <div className="font-mono text-[9px] text-[#3a3a3a]">{currentOutcomeIdx + 1} of {numericOutcomes.length}</div>
          </div>
          
          <div className="font-sans text-[11px] text-[#666] mb-5">
            Last logged: <span className="text-white">{lastVal}</span> {target.unit} <span className="mx-2">→</span> Target: <span className="text-white">{target.targetValue}</span> {target.unit}
          </div>

          <div className="flex items-center gap-3">
            <div className="font-sans text-[12px] text-[#888]">New value:</div>
            <input
              type="number"
              autoFocus
              value={outcomeInput}
              onChange={e => setOutcomeInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveNumericOutcome()}
              className="w-[80px] bg-[#131313] border border-[#2a2a2a] rounded-[4px] px-2 py-1.5 font-mono text-[13px] text-white outline-none focus:border-[#4d8eff]"
            />
            <span className="text-[12px] text-[#666] -ml-1">{target.unit}</span>
          </div>
          
          <div className="flex gap-2 mt-6">
            <button onClick={saveNumericOutcome} className="bg-[#4d8eff] text-black font-bold text-[11px] px-4 py-1.5 rounded hover:brightness-110">Save</button>
            <button onClick={nextOutcome} className="text-[#888] font-mono text-[11px] px-4 py-1.5 rounded hover:bg-white/5">Skip →</button>
          </div>
        </div>

        <div className="mt-auto pt-5">
          <button onClick={handleScreen2Back} className="font-mono text-[10px] text-[#444] hover:text-[#666]">← Back</button>
        </div>
      </motion.div>
    );
  };

  const renderScreen3 = () => (
    <motion.div key="s3" variants={slideVariants} initial="enter" animate="center" exit="exit" custom={dir} transition={{ duration: 0.25, ease }} className="w-full flex flex-col h-full">
      <div className="mb-6 flex-shrink-0">
        <div className="font-mono text-[12px] font-bold text-white mb-1 uppercase">THIS WEEK'S FOCUS</div>
        <div className="font-sans text-[11px] text-[#888]">What's the one thing that moves each goal forward?</div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-5 custom-scrollbar">
        {outcomes.map(outcome => {
          const focusItems = updatedGoals.filter(g => g.type === 'focus' && g.parentId === outcome.id);
          const isAdding = addingFocusFor === outcome.id;

          return (
            <div key={outcome.id} className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-[8px] p-4">
              <div className="font-sans text-[13px] text-white font-medium mb-3">{outcome.icon || '🎯'} {outcome.text}</div>
              
              <div className="flex flex-col gap-2">
                {focusItems.map(f => (
                  <div key={f.id} onClick={() => handleSelectFocus(f.id, outcome.id)} className="flex items-start gap-2.5 cursor-pointer group">
                    <div className="mt-1 flex-shrink-0 relative w-[10px] h-[10px]">
                      <div className={`absolute inset-0 rounded-full border transition-all ${f.active ? 'border-[#4d8eff]' : 'border-[#555] group-hover:border-[#777]'}`}></div>
                      {f.active && <div className="absolute top-[2px] left-[2px] w-[6px] h-[6px] bg-[#4d8eff] rounded-full"></div>}
                    </div>
                    <span className={`text-[12px] leading-snug transition-colors ${f.active ? 'text-[#e6e6e6]' : 'text-[#555] group-hover:text-[#888]'}`}>{f.text}</span>
                  </div>
                ))}

                {isAdding ? (
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      autoFocus
                      type="text"
                      placeholder="Type a new focus..."
                      value={newFocusText}
                      onChange={e => setNewFocusText(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleAddFocus(outcome.id);
                        if (e.key === 'Escape') setAddingFocusFor(null);
                      }}
                      onBlur={() => handleAddFocus(outcome.id)}
                      className="flex-1 bg-[#131313] border border-[#2a2a2a] rounded-[4px] px-2 py-1.5 font-sans text-[11px] text-white outline-none focus:border-[#4d8eff]"
                    />
                  </div>
                ) : (
                  <button onClick={() => setAddingFocusFor(outcome.id)} className="mt-1 text-left font-sans text-[11px] text-[#444] hover:text-[#666] transition-colors w-max">
                    + Add a focus for this week
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex justify-between items-center pt-3 border-t border-[rgba(255,255,255,0.05)] flex-shrink-0">
        <button onClick={handleScreen3Back} className="font-mono text-[10px] text-[#444] hover:text-[#666]">← Back</button>
        <button onClick={() => go(4)} className="font-mono text-[11px] text-[#4d8eff] hover:brightness-110">Next →</button>
      </div>
    </motion.div>
  );

  const renderScreen4 = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const templateNames = Object.keys(templates || {});

    return (
      <motion.div key="s4" variants={slideVariants} initial="enter" animate="center" exit="exit" custom={dir} transition={{ duration: 0.25, ease }} className="w-full flex flex-col h-full">
        <div className="mb-6">
          <div className="font-mono text-[12px] font-bold text-white mb-1 uppercase">Schedule Commitment</div>
          <div className="font-sans text-[11px] text-[#888]">Assign routines to the upcoming days.</div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <div className="flex flex-col gap-2 mb-8">
            {days.map((day, idx) => (
              <div key={day} className="flex justify-between items-center bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-[8px] p-2.5">
                <span className="font-mono text-[11px] text-white w-8">{day}</span>
                <select
                  value={scheduleConfig[idx] || ''}
                  onChange={e => setScheduleConfig({ ...scheduleConfig, [idx]: e.target.value })}
                  className="bg-[#131313] border border-[#2a2a2a] rounded-[4px] px-2 py-1 font-sans text-[11px] text-white outline-none focus:border-[#4d8eff] w-[140px]"
                >
                  <option value="">(None)</option>
                  {templateNames.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-auto flex flex-col items-center gap-3 pt-4 border-t border-[rgba(255,255,255,0.05)]">
          <button onClick={finishReview} className="w-full py-3 bg-[#4d8eff] rounded-lg text-black font-bold text-[13px] hover:brightness-110 active:scale-[0.98] transition-all">
            Complete Review ✓
          </button>
        </div>
        
        <div className="absolute bottom-5 left-5">
          <button onClick={handleScreen4Back} className="font-mono text-[10px] text-[#444] hover:text-[#666]">← Back</button>
        </div>
      </motion.div>
    );
  };

  const renderScreen5 = () => {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center h-full w-full">
        <svg width="64" height="64" viewBox="0 0 52 52" fill="none" className="mb-4">
          <circle cx="26" cy="26" r="25" stroke="#22c55e" strokeWidth="2" strokeOpacity="0.3" />
          <circle cx="26" cy="26" r="25" fill="#22c55e" fillOpacity="0.1" />
          <motion.polyline 
            initial={{ pathLength: 0 }} 
            animate={{ pathLength: 1 }} 
            transition={{ duration: 0.4, ease: "easeOut" }}
            points="14,27 22,35 38,18" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" 
          />
        </svg>
        <div className="font-mono text-[14px] text-white font-bold">Week reviewed ✓</div>
      </motion.div>
    );
  };

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] text-white overflow-hidden p-6" style={{ WebkitAppRegion: 'drag' }}>
      {/* Draggable region for frameless window, but make content non-draggable */}
      <div className="absolute inset-0" style={{ WebkitAppRegion: 'no-drag' }}>
        <button 
          onClick={onSkip} 
          className="absolute top-4 right-4 text-[#555] hover:text-white transition-colors z-50 p-2"
          title="Close"
        >
          ✕
        </button>
        
        <div className="w-full h-full p-6">
          <AnimatePresence mode="wait" custom={dir}>
            {!isCompleting && step === 0 && renderScreen1()}
            {!isCompleting && step === 1 && renderScreenReflection()}
            {!isCompleting && step === 2 && renderScreen2()}
            {!isCompleting && step === 3 && renderScreen3()}
            {!isCompleting && step === 4 && renderScreen4()}
            {isCompleting && renderScreen5()}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
