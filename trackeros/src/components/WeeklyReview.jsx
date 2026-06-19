import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function WeeklyReview({ logs, goals, templates, onComplete, onSkip, onSaveGoals }) {
  const [step, setStep] = useState(1);
  const [updatedGoals, setUpdatedGoals] = useState(JSON.parse(JSON.stringify(goals)));

  const handleNext = () => setStep(s => s + 1);
  const handleFinish = () => {
    if (onSaveGoals) onSaveGoals(updatedGoals);
    onComplete();
  };

  // Screen 1: Recap math
  const weekLogs = Object.values(logs).slice(-7); // Roughly last 7 days
  const totalBlocks = weekLogs.reduce((acc, log) => acc + Object.keys(log.activity || {}).length, 0);
  const doneBlocks = weekLogs.reduce((acc, log) => {
    return acc + Object.values(log.activity || {}).filter(v => v === 'done').length;
  }, 0);
  const completionPct = totalBlocks > 0 ? Math.round((doneBlocks / totalBlocks) * 100) : 0;

  // Screen 2 data
  const numericOutcomes = updatedGoals.filter(g => g.type === 'outcome' && g.valueType === 'numeric');
  
  const handleUpdateNumeric = (id, val) => {
    if (val === '') return;
    setUpdatedGoals(prev => prev.map(g => {
      if (g.id === id) {
        return {
          ...g,
          currentValue: Number(val),
          history: [...(g.history || []), { date: new Date().toISOString().split('T')[0], value: Number(val) }]
        };
      }
      return g;
    }));
  };

  // Screen 3 data
  const textOutcomes = updatedGoals.filter(g => g.type === 'outcome'); // outcomes that can have focus children
  const handleSetFocus = (outcomeId, focusId) => {
    setUpdatedGoals(prev => prev.map(g => {
      if (g.type === 'focus' && g.parentId === outcomeId) {
        return { ...g, active: g.id === focusId };
      }
      return g;
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6 text-white font-sans">
      <AnimatePresence mode="wait">
        
        {step === 1 && (
          <motion.div key="step1" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-20}} className="max-w-md w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-xl p-6 shadow-2xl flex flex-col gap-6">
            <div>
              <h2 className="text-xl font-medium text-white mb-1">Weekly Review</h2>
              <p className="text-sm text-[#aaa]">Let's check in on your progress and set the trajectory for next week.</p>
            </div>
            
            <div className="bg-black/30 rounded-lg p-4 border border-[rgba(255,255,255,0.05)]">
              <div className="text-[10px] uppercase font-mono tracking-widest text-[#888] mb-3">Last 7 Days Recap</div>
              <div className="flex justify-between items-end mb-2">
                <span className="text-[#ccc] text-sm">Completion Rate</span>
                <span className="text-2xl font-mono text-[#4d8eff]">{completionPct}%</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-[#ccc] text-sm">Blocks Done</span>
                <span className="text-xl font-mono text-[#fff]">{doneBlocks} <span className="text-sm text-[#666]">/ {totalBlocks}</span></span>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-2">
              <button onClick={onSkip} className="px-4 py-2 text-sm text-[#888] hover:text-white transition-colors">Skip</button>
              <button onClick={handleNext} className="px-5 py-2 bg-[#4d8eff] text-black font-medium rounded-md hover:bg-[#6ba0ff] transition-colors">Continue</button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="step2" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-20}} className="max-w-md w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-xl p-6 shadow-2xl flex flex-col gap-6">
            <div>
              <h2 className="text-xl font-medium text-white mb-1">Update Numbers</h2>
              <p className="text-sm text-[#aaa]">Log your latest measurements. Leave blank if unchanged.</p>
            </div>
            
            <div className="flex flex-col gap-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
              {numericOutcomes.length === 0 && (
                <div className="text-sm text-[#888] italic text-center py-4">No numeric tracking goals set up yet.</div>
              )}
              {numericOutcomes.map(oc => (
                <div key={oc.id} className="flex justify-between items-center bg-black/30 p-3 rounded-lg border border-[rgba(255,255,255,0.05)]">
                  <div>
                    <div className="text-sm text-[#eee]">{oc.label}</div>
                    <div className="text-[10px] text-[#888] font-mono mt-1">Currently: {oc.currentValue}{oc.unit} · Target: {oc.targetValue}{oc.unit}</div>
                  </div>
                  <input 
                    type="number"
                    placeholder="New val"
                    onBlur={(e) => handleUpdateNumeric(oc.id, e.target.value)}
                    className="bg-black/50 border border-[rgba(255,255,255,0.1)] rounded px-2 py-1 text-sm text-white w-20 outline-none focus:border-[#4d8eff]"
                  />
                </div>
              ))}
            </div>
            
            <div className="flex justify-end gap-3 mt-2">
              <button onClick={handleNext} className="px-5 py-2 bg-[#4d8eff] text-black font-medium rounded-md hover:bg-[#6ba0ff] transition-colors">Next</button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="step3" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-20}} className="max-w-md w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-xl p-6 shadow-2xl flex flex-col gap-6">
            <div>
              <h2 className="text-xl font-medium text-white mb-1">Set Your Focus</h2>
              <p className="text-sm text-[#aaa]">Choose the primary area of focus for your active goals this week.</p>
            </div>
            
            <div className="flex flex-col gap-5 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
              {textOutcomes.map(oc => {
                const focuses = updatedGoals.filter(g => g.type === 'focus' && g.parentId === oc.id);
                if (focuses.length === 0) return null;
                return (
                  <div key={oc.id} className="flex flex-col gap-2">
                    <div className="text-[11px] uppercase font-mono tracking-wider text-[#888]">{oc.label}</div>
                    <div className="flex flex-col gap-1 bg-black/30 p-2 rounded-lg border border-[rgba(255,255,255,0.05)]">
                      {focuses.map(f => (
                        <label key={f.id} className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${f.active ? 'bg-[rgba(77,142,255,0.15)] text-white' : 'hover:bg-white/5 text-[#aaa]'}`}>
                          <input 
                            type="radio" 
                            name={`focus-${oc.id}`} 
                            checked={!!f.active} 
                            onChange={() => handleSetFocus(oc.id, f.id)}
                            className="accent-[#4d8eff]"
                          />
                          <span className="text-sm">{f.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
              {textOutcomes.every(oc => updatedGoals.filter(g => g.type === 'focus' && g.parentId === oc.id).length === 0) && (
                <div className="text-sm text-[#888] italic text-center py-4">No focuses defined for any outcomes. Add them in the Stats panel.</div>
              )}
            </div>
            
            <div className="flex justify-end gap-3 mt-2">
              <button onClick={handleNext} className="px-5 py-2 bg-[#4d8eff] text-black font-medium rounded-md hover:bg-[#6ba0ff] transition-colors">Next</button>
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div key="step4" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-20}} className="max-w-md w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-xl p-6 shadow-2xl flex flex-col gap-6">
            <div>
              <h2 className="text-xl font-medium text-white mb-1">Confirm Schedule</h2>
              <p className="text-sm text-[#aaa]">You're all set for the week! Here is a quick look at your templates.</p>
            </div>
            
            <div className="bg-black/30 rounded-lg p-4 border border-[rgba(255,255,255,0.05)] flex flex-col gap-3">
              {Object.entries(templates || {}).map(([name, blocks]) => (
                <div key={name} className="flex justify-between items-center pb-2 border-b border-[rgba(255,255,255,0.05)] last:border-0 last:pb-0">
                  <span className="text-sm text-[#eee]">{name}</span>
                  <span className="font-mono text-xs text-[#888]">{blocks.length} blocks</span>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end gap-3 mt-2">
              <button onClick={handleFinish} className="px-5 py-2 bg-[#4d8eff] text-black font-medium rounded-md hover:bg-[#6ba0ff] transition-colors">Finish & Start Day</button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
