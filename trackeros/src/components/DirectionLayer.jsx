import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fmtDateKey } from '../utils/time';

export default function DirectionLayer({ accentColor, embedded = false, blockLabel = '', blockPreset = null }) {
  const [expanded, setExpanded] = useState(false);
  const [data, setData] = useState({
    direction: '',
    focus: '',
    todayTarget: '',
    targetDate: '',
    completed: false
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      if (!blockLabel) return;
      
      const stored = await window.tracker?.getDirectionLayer?.(blockLabel);
      if (stored) {
        let updated = { ...stored };
        const today = fmtDateKey(new Date());
        
        if (!updated.targetDate) {
          updated.targetDate = today;
        } else if (updated.targetDate < today) {
          if (updated.completed) {
            // Rollover: if yesterday was completed, start fresh today
            updated.todayTarget = '';
            updated.completed = false;
            updated.targetDate = today;
          }
          // If not completed, we keep the past date to show it carried over
        }
        
        setData(updated);
        // Resave if we modified the object during rollover
        if (JSON.stringify(updated) !== JSON.stringify(stored)) {
          window.tracker?.saveDirectionLayer?.(blockLabel, updated);
        }
      } else {
        // No stored data — use block preset if available, or blank defaults
        const initData = {
          direction: blockPreset?.direction || '',
          focus: blockPreset?.focus || '',
          todayTarget: blockPreset?.todayTarget || '',
          targetDate: fmtDateKey(new Date()),
          completed: false
        };
        setData(initData);
        window.tracker?.saveDirectionLayer?.(blockLabel, initData);
      }
      setLoaded(true);
    }
    setLoaded(false);
    load();
  }, [blockLabel]);

  // Update effect to auto-save whenever `data` changes
  useEffect(() => {
    if (!loaded || !blockLabel) return;
    const timer = setTimeout(() => {
      window.tracker?.saveDirectionLayer?.(blockLabel, data);
    }, 500); // Debounce saves
    return () => clearTimeout(timer);
  }, [data, loaded, blockLabel]);

  const handleChange = (field, value) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const toggleComplete = (e) => {
    e.stopPropagation();
    setData(prev => ({ ...prev, completed: !prev.completed }));
  };

  const moveTargetToTomorrow = (e) => {
    e.stopPropagation();
    const tmrw = new Date();
    tmrw.setDate(tmrw.getDate() + 1);
    setData(prev => ({ ...prev, targetDate: fmtDateKey(tmrw) }));
  };

  if (!loaded || !blockLabel) return null;

  const todayStr = fmtDateKey(new Date());
  const isCarriedOver = data.targetDate && data.targetDate < todayStr && !data.completed && data.todayTarget.trim() !== '';
  const isTomorrow = data.targetDate && data.targetDate > todayStr;
  
  const hasData = data.direction.trim() || data.focus.trim() || data.todayTarget.trim();

  return (
    <div
      className={embedded ? "mb-2 rounded-[6px] overflow-hidden transition-all" : "mx-2 mt-2 rounded-[8px] overflow-hidden transition-all"}
      style={{
        background: embedded ? ((!hasData && !expanded) ? 'transparent' : 'rgba(0,0,0,0.1)') : 'rgba(255,255,255,0.02)',
        border: embedded ? ((!hasData && !expanded) ? 'none' : '0.5px solid rgba(255,255,255,0.05)') : '0.5px solid var(--border-subtle)',
        boxShadow: embedded ? ((!hasData && !expanded) ? 'none' : 'inset 0 1px 3px rgba(0,0,0,0.2)') : 'none',
      }}
    >
      {/* Header / Collapsed View */}
      <div 
        className={`flex items-center justify-between px-3 py-1.5 cursor-pointer hover:bg-[rgba(255,255,255,0.04)] transition-colors ${embedded ? 'py-1' : ''}`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {(!hasData && !expanded) ? (
            <span className="text-[10px] select-none opacity-40 hover:opacity-100 transition-opacity flex items-center gap-1.5 font-mono uppercase tracking-wider text-[var(--text-disabled)]">
              🧭 <span className="text-[9px]">Add Target</span>
            </span>
          ) : (
            <>
              <span className="text-[10px] select-none">🧭</span>
              <span 
                className="text-[11px] font-medium truncate select-none"
                style={{ color: data.direction ? 'var(--text-primary)' : 'var(--text-disabled)' }}
              >
                {data.direction || data.todayTarget || data.focus || 'Set your Direction'}
              </span>
            </>
          )}
        </div>
        
        {/* Quick status dots */}
        <div className="flex items-center gap-1.5">
          {!expanded && isCarriedOver && (
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400" title="Carried over target" />
          )}
          {!expanded && data.completed && (
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" title="Target completed" />
          )}
          <svg 
            width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ color: 'var(--text-tertiary)', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      </div>

      {/* Expanded View */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`px-3 pb-3 flex flex-col gap-3 border-t border-[var(--border-subtle)] ${embedded ? 'pt-2 pb-2 gap-2' : 'pt-3'}`}
          >
            {/* Direction */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase tracking-wider font-mono text-[var(--text-disabled)] flex items-center gap-1">
                <span className="text-[10px]">🎯</span> Direction
              </label>
              <input
                type="text"
                value={data.direction}
                onChange={e => handleChange('direction', e.target.value)}
                placeholder="Long-term destination (e.g. Data Analytics Placement)"
                className="bg-transparent border-b border-[var(--divider)] text-[12px] text-[var(--text-primary)] px-1 py-0.5 focus:border-[var(--accent)] transition-colors placeholder:text-[var(--text-tertiary)]"
                style={{ outline: 'none' }}
              />
            </div>

            {/* Focus */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase tracking-wider font-mono text-[var(--text-disabled)] flex items-center gap-1">
                <span className="text-[10px]">📚</span> Focus
              </label>
              <input
                type="text"
                value={data.focus}
                onChange={e => handleChange('focus', e.target.value)}
                placeholder="Current area (e.g. Learn SQL)"
                className="bg-transparent border-b border-[var(--divider)] text-[12px] text-[var(--text-primary)] px-1 py-0.5 focus:border-[var(--accent)] transition-colors placeholder:text-[var(--text-tertiary)]"
                style={{ outline: 'none' }}
              />
            </div>

            {/* Today's Target */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-end">
                <label className="text-[9px] uppercase tracking-wider font-mono text-[var(--text-disabled)] flex items-center gap-1">
                  <span className="text-[10px]">⚡</span> {isTomorrow ? 'Tomorrow' : 'Today'}
                </label>
                {isCarriedOver && (
                  <span className="text-[8px] bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded font-mono uppercase tracking-wider">Carried Over</span>
                )}
              </div>
              
              <div className="flex items-center gap-2 mt-1">
                <button 
                  onClick={toggleComplete}
                  className="flex-shrink-0 w-4 h-4 rounded-full border flex items-center justify-center transition-colors cursor-pointer"
                  style={{ 
                    borderColor: data.completed ? 'var(--green)' : 'var(--text-tertiary)',
                    background: data.completed ? 'var(--green)' : 'transparent'
                  }}
                  title="Mark Complete"
                >
                  {data.completed && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  )}
                </button>
                
                <input
                  type="text"
                  value={data.todayTarget}
                  onChange={e => handleChange('todayTarget', e.target.value)}
                  placeholder="Smallest meaningful action"
                  className="bg-transparent border-b border-[var(--divider)] text-[12px] text-[var(--text-primary)] px-1 py-0.5 focus:border-[var(--accent)] transition-colors placeholder:text-[var(--text-tertiary)] flex-1 min-w-0"
                  style={{ 
                    outline: 'none',
                    textDecoration: data.completed ? 'line-through' : 'none',
                    color: data.completed ? 'var(--text-disabled)' : 'var(--text-primary)'
                  }}
                />
                
                {!data.completed && !isTomorrow && data.todayTarget && (
                  <button 
                    onClick={moveTargetToTomorrow}
                    className="flex-shrink-0 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                    title="Move to Tomorrow"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="13 17 18 12 13 7"></polyline>
                      <line x1="6" y1="12" x2="18" y2="12"></line>
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
