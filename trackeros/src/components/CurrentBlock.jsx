import React from 'react';
import { fmtTime, minsLeft, blockProgress, toMin } from '../utils/time';
import Pomodoro from './Pomodoro';
import DirectionLayer from './DirectionLayer';

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

      <DirectionLayer embedded blockLabel={block.label} blockPreset={{ direction: block.direction, focus: block.focus, todayTarget: block.todayTarget }} />

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
                onClick={() => { window.tracker?.logActivity?.(block, 'done'); onUpdateStatus?.(block.id, 'done'); }} 
                className="text-[10px] opacity-60 hover:opacity-100 hover:text-green-400 transition-opacity"
                title="Mark Done"
              >✅</button>
              <button 
                onClick={() => { window.tracker?.logActivity?.(block, 'skipped'); onUpdateStatus?.(block.id, 'skipped'); }} 
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

