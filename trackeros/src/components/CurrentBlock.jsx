import React from 'react';
import { fmtTime, minsLeft, blockProgress, toMin } from '../utils/time';
import Pomodoro from './Pomodoro';
import GoalCard from './GoalCard';

export default function CurrentBlock({ block, now, onUpdateStatus, pomoState }) {
  if (!block) {
    return (
      <div style={{
        margin: '2px 10px 8px',
        border: '0.5px dashed var(--border-subtle)',
        borderRadius: '8px',
        padding: '13px',
        textAlign: 'center',
        background: 'rgba(255,255,255,0.018)',
      }}>
        <span className="font-sans" style={{ fontSize: '11px', color: 'var(--text-disabled)' }}>
          No active block · free time
        </span>
      </div>
    );
  }

  const pct = blockProgress(block, now);
  const remaining = minsLeft(block.end, now);

  return (
    <div
      className="current-block-glow"
      style={{
        margin: '2px 10px 8px',
        background: 'var(--acrylic-surface)',
        border: '0.5px solid var(--border-subtle)',
        borderLeft: '2.5px solid var(--accent)',
        borderRadius: '0 8px 8px 0',
        padding: '10px 12px 11px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Luminous top edge on card */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
        background: 'linear-gradient(90deg, transparent 0%, var(--border-medium) 40%, transparent 100%)',
        pointerEvents: 'none',
      }} />

      {/* Block name */}
      <div className="font-sans font-medium" style={{
        fontSize: '13px', marginBottom: '3px', lineHeight: 1.3,
        color: 'var(--text-primary)',
      }}>
        {block.label}
      </div>

      {/* Time range */}
      <div className="font-mono" style={{
        fontSize: '10px', color: 'var(--text-tertiary)', marginBottom: '9px',
      }}>
        {fmtTime(block.start)} – {fmtTime(block.end)}
      </div>

      {block.topic && (
        <div className="font-sans text-[11.5px] text-[#e6e6e6] bg-[rgba(255,255,255,0.04)] px-2 py-1.5 rounded-[4px] mb-2 border border-[rgba(255,255,255,0.03)] flex flex-col gap-1.5">
          <div className="flex items-start gap-1.5">
            <span className="text-[10px] mt-[1px]">📌</span>
            <span className="leading-snug">{block.topic}</span>
          </div>
        </div>
      )}

      <GoalCard embedded block={block} />

      {/* Progress bar */}
      <div style={{
        height: '2px', background: 'rgba(255,255,255,0.06)',
        borderRadius: '1px', overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: 'var(--accent)',
          borderRadius: '1px',
          transition: 'width 1s linear',
          boxShadow: '0 0 6px var(--accent)',
        }} />
      </div>

      {/* Pomodoro Timer for Long Blocks */}
      {(toMin(block.end) - toMin(block.start)) >= 45 && (
        <Pomodoro pomoState={pomoState} />
      )}

      {/* Status & Time remaining */}
      <div className="flex items-center justify-between mt-[5px]">
        <div className="flex gap-[6px]">
          {block.status === 'done' ? (
            <span className="text-[10px] text-green-400 font-medium">✅ Done</span>
          ) : block.status === 'skipped' ? (
            <span className="text-[10px] text-red-400 font-medium">⏭️ Skipped</span>
          ) : (
            <>
              <button 
                onClick={() => onUpdateStatus?.(block.id, 'done')} 
                className="text-[10px] opacity-60 hover:opacity-100 hover:text-green-400 transition-opacity"
                title="Mark Done"
              >✅</button>
              <button 
                onClick={() => onUpdateStatus?.(block.id, 'skipped')} 
                className="text-[10px] opacity-60 hover:opacity-100 hover:text-red-400 transition-opacity"
                title="Skip Block"
              >⏭️</button>
            </>
          )}
        </div>
        <div className="font-mono text-right" style={{
          fontSize: '9px', color: 'var(--accent)',
        }}>
          {remaining}
        </div>
      </div>
    </div>
  );
}

