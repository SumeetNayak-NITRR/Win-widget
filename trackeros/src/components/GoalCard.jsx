import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getDueStatus } from '../utils/time';

function calcPct(outcome) {
  const { currentValue, targetValue, direction, history = [] } = outcome;
  const start = history[0]?.value ?? currentValue;
  const current = Number(currentValue) || 0;
  const target = Number(targetValue) || 0;
  const s = Number(start) || 0;
  
  if (s === target) return 100;
  
  let pct;
  if (direction === 'decrease') {
    pct = ((s - current) / (s - target)) * 100;
  } else {
    pct = ((current - s) / (target - s)) * 100;
  }
  return Math.min(Math.max(Math.round(pct), 0), 100);
}

function estimateCompletionDate(outcome) {
  const history = outcome.history || [];
  if (history.length < 3) return null;
  
  const points = history.map(h => ({
    x: new Date(h.date).getTime(),
    y: Number(h.value),
  }));
  
  const n = points.length;
  const sumX = points.reduce((s,p)=>s+p.x,0);
  const sumY = points.reduce((s,p)=>s+p.y,0);
  const sumXY = points.reduce((s,p)=>s+p.x*p.y,0);
  const sumXX = points.reduce((s,p)=>s+p.x*p.x,0);
  
  const denominator = (n*sumXX - sumX*sumX);
  if (denominator === 0) return 'Not enough data';
  
  const slope = (n*sumXY - sumX*sumY) / denominator;
  if (slope === 0 || !isFinite(slope)) return 'Not enough data';
  
  const intercept = (sumY - slope*sumX) / n;
  const targetX = (outcome.targetValue - intercept) / slope;
  
  const etaDate = new Date(targetX);
  return etaDate > new Date() ? etaDate.toLocaleDateString() : 'Past target date';
}

export default function GoalCard({ block, embedded = false }) {
  const [expanded, setExpanded] = useState(false);
  const [goals, setGoals] = useState([]);
  const [logInputOpen, setLogInputOpen] = useState(false);
  const [newLogValue, setNewLogValue] = useState('');
  const [actionText, setActionText] = useState('');
  const [actionDone, setActionDone] = useState(false);

  useEffect(() => {
    window.tracker?.getGoals?.().then(g => setGoals(g || []));
  }, []);

  if (!block || !block.linkedOutcomeId) return null;

  let outcome = goals.find(g => g.id === block.linkedOutcomeId && g.type === 'outcome');
  let northStar = goals.find(g => g.id === outcome?.parentId && g.type === 'northstar');

  if (!outcome) {
    // Check if they linked directly to a North Star
    northStar = goals.find(g => g.id === block.linkedOutcomeId && g.type === 'northstar');
  }

  useEffect(() => {
    const targetGoal = outcome || northStar;
    if (targetGoal && targetGoal.nextAction) {
      setActionText(targetGoal.nextAction.text || '');
      setActionDone(targetGoal.nextAction.done || false);
    }
  }, [block.linkedOutcomeId, goals.length]); // Wait for goals to load

  if (!outcome && !northStar) return null; // Orphaned link or goals not loaded

  const targetGoalId = outcome ? outcome.id : northStar.id;
  const targetFocuses = goals.filter(g => g.parentId === targetGoalId && g.type === 'focus');

  const handleSaveLog = () => {
    if (!newLogValue) return;
    const val = Number(newLogValue);
    if (isNaN(val)) return;

    const todayStr = new Date().toISOString().split('T')[0]; // simple YYYY-MM-DD
    const updatedGoals = goals.map(g => {
      if (outcome && g.id === outcome.id) {
        return {
          ...g,
          currentValue: val,
          history: [...(g.history || []), { date: todayStr, value: val }]
        };
      }
      return g;
    });

    setGoals(updatedGoals);
    window.tracker?.saveGoals?.(updatedGoals);
    setLogInputOpen(false);
    setNewLogValue('');
  };

  const handleToggleFocus = (focusId, currentDone) => {
    const updatedGoals = goals.map(g => g.id === focusId ? { ...g, done: !currentDone } : g);
    setGoals(updatedGoals);
    window.tracker?.saveGoals?.(updatedGoals);
  };

  const pct = (outcome && outcome.valueType === 'numeric') ? calcPct(outcome) : 0;
  const eta = (outcome && outcome.valueType === 'numeric') ? estimateCompletionDate(outcome) : null;

  const containerClass = embedded 
    ? "mb-2 rounded-[6px] overflow-hidden transition-all bg-[rgba(77,142,255,0.06)] border border-[rgba(77,142,255,0.2)]" 
    : "mx-2 mt-2 rounded-[8px] overflow-hidden transition-all bg-[rgba(77,142,255,0.06)] border border-[rgba(77,142,255,0.2)]";

  return (
    <div className={containerClass}>
      {/* Collapsed State */}
      <div 
        className={`flex items-center gap-[7px] cursor-pointer hover:bg-[rgba(77,142,255,0.1)] transition-colors px-[10px] ${embedded ? 'py-[4px]' : 'py-[6px]'}`}
        onClick={() => setExpanded(!expanded)}
      >
        <span className="text-[12px] select-none">{northStar?.icon || '🎯'}</span>
        <span className="font-sans text-[11px] text-[#aaa] flex-1 truncate select-none">
          {outcome ? outcome.label : northStar.label}
        </span>
        {outcome && outcome.valueType === 'numeric' && (
          <span className="font-mono text-[10px] text-[#4d8eff] select-none">{pct}%</span>
        )}
        <svg 
          width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4d8eff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>

      {/* Expanded State */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`px-[10px] pb-[10px] flex flex-col ${embedded ? 'pt-[4px]' : 'pt-[8px]'}`}
          >
            {outcome ? (
              <>
                <div className="font-mono text-[9px] text-[#555] uppercase tracking-wider mb-2">
                  {northStar?.icon} {northStar?.label} › {outcome.label}
                </div>

                {outcome.valueType === 'numeric' ? (
                  <div className="flex flex-col">
                    <div className="flex items-center font-mono text-[13px] text-[#e6e6e6] gap-2 mb-1">
                      <span>{outcome.currentValue}{outcome.unit}</span>
                      <span className="text-[11px] text-[#4d8eff]">→</span>
                      <span>{outcome.targetValue}{outcome.unit}</span>
                    </div>
                    
                    <div className="w-full bg-[rgba(255,255,255,0.1)] h-1 rounded-full mt-1 overflow-hidden">
                      <div className="bg-[#4d8eff] h-full" style={{ width: `${pct}%` }} />
                    </div>
                    
                    {eta && (
                      <div className="font-mono text-[9px] text-[#4d8eff] mt-[4px]">Est. completion: {eta}</div>
                    )}
                    
                    {logInputOpen ? (
                      <div className="flex items-center gap-2 mt-[8px]">
                        <input 
                          type="number"
                          autoFocus
                          value={newLogValue}
                          onChange={e => setNewLogValue(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleSaveLog()}
                          placeholder="New val"
                          className="bg-[rgba(0,0,0,0.3)] border border-[rgba(77,142,255,0.4)] rounded-[4px] px-2 py-[2px] text-[10px] text-white outline-none focus:border-[#4d8eff] w-[60px]"
                        />
                        <button onClick={handleSaveLog} className="font-mono text-[9px] border-[0.5px] border-[#4d8eff] text-[#4d8eff] px-[8px] py-[3px] rounded-[4px] hover:bg-[rgba(77,142,255,0.1)]">Save</button>
                        <button onClick={() => setLogInputOpen(false)} className="font-mono text-[9px] text-[#888] hover:text-[#bbb] px-[4px]">Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => setLogInputOpen(true)} className="font-mono text-[9px] border-[0.5px] border-[#4d8eff] text-[#4d8eff] px-[8px] py-[3px] rounded-[4px] mt-[8px] hover:bg-[rgba(77,142,255,0.1)] w-fit">
                        + Log new value
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="font-sans text-[11px] text-[#bbb] leading-[1.5] mt-1">
                    {outcome.note}
                  </div>
                )}
              </>
            ) : (
              <div className="font-sans text-[11px] text-[#bbb] leading-[1.5] mt-1">
                Dedicated block for North Star: <strong>{northStar.label}</strong>
              </div>
            )}

            {/* Focus Areas List */}
            {targetFocuses.length > 0 && (
              <div className="mt-4 border-t border-[rgba(255,255,255,0.05)] pt-3">
                <div className="text-[9px] text-[#555] uppercase tracking-wider mb-2 flex items-center gap-1 font-mono">
                  <span className="text-[#4d8eff]">📌</span> FOCUS AREAS / TO-DO
                </div>
                <div className="flex flex-col gap-2">
                  {targetFocuses.map(foc => {
                    const due = getDueStatus(foc.dueDate);
                    return (
                    <div key={foc.id} className="flex items-center gap-2">
                      <div 
                        onClick={() => handleToggleFocus(foc.id, foc.done)}
                        className="w-[14px] h-[14px] shrink-0 rounded-full border flex items-center justify-center cursor-pointer transition-colors"
                        style={{
                          borderColor: foc.done ? '#4d8eff' : '#555',
                          background: foc.done ? '#4d8eff' : 'transparent'
                        }}
                      >
                        {foc.done && <span className="text-[#000] text-[9px]">✓</span>}
                      </div>
                      <span className="text-[11px] font-sans" style={{ color: foc.done ? '#666' : '#e6e6e6', textDecoration: foc.done ? 'line-through' : 'none' }}>
                        {foc.label}
                      </span>
                      {due && !foc.done && (
                        <span style={{ fontSize: '9px', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px', color: due.color, marginLeft: 'auto' }}>
                          {due.text}
                        </span>
                      )}
                    </div>
                  )})}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
