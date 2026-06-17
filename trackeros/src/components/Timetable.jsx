import React from 'react';
import { motion } from 'framer-motion';
import { CAT_COLOR } from '../data/routine';
import { fmtTime, minsLeft, isCurrentBlock } from '../utils/time';
import { useClock } from '../hooks/useClock';

export default function Timetable({ routine, onBack }) {
  const now = useClock();

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="acrylic-root h-full w-full flex flex-col p-4"
    >
      <div className="flex items-center justify-between mb-4 mt-2">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Full Timetable</h2>
        <button 
          onClick={onBack}
          className="p-1 rounded-md bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] transition-colors text-[var(--text-secondary)]"
          title="Back to Widget"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 pb-4">
        {routine.map(block => {
          const current = isCurrentBlock(block, now);
          return (
            <div 
              key={block.id} 
              className="flex flex-col p-3 rounded-xl border transition-colors relative overflow-hidden"
              style={{
                backgroundColor: current ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)',
                borderColor: current ? 'var(--accent)' : 'var(--border-subtle)',
                boxShadow: current ? '0 0 12px rgba(76,194,255,0.2)' : 'none',
              }}
            >
              {/* Category indicator line */}
              <div 
                className="absolute left-0 top-0 bottom-0 w-[3px]"
                style={{ backgroundColor: CAT_COLOR[block.category] || 'var(--text-disabled)' }}
              />

              <div className="flex justify-between items-start pl-2">
                <div className="font-medium text-[var(--text-primary)] text-sm">{block.label}</div>
                {current && (
                  <div className="text-[10px] font-mono text-[var(--accent)] font-bold">
                    {minsLeft(block.end, now)}
                  </div>
                )}
              </div>
              
              <div className="pl-2 mt-1 flex justify-between items-center">
                <div className="font-mono text-[10px] text-[var(--text-tertiary)]">
                  {fmtTime(block.start)} – {fmtTime(block.end)}
                </div>
                <div className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: CAT_COLOR[block.category] || 'var(--text-disabled)' }}>
                  {block.category}
                </div>
              </div>
            </div>
          );
        })}
        {routine.length === 0 && (
          <div className="text-sm text-[var(--text-disabled)] italic text-center mt-10">No blocks for today.</div>
        )}
      </div>
    </motion.div>
  );
}
