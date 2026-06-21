import React, { useState } from 'react';
import { fmtTime, minsLeft, blockProgress, toMin } from '../utils/time';
import Pomodoro from './Pomodoro';
import GoalCard from './GoalCard';

export default function CurrentBlock({ block, now, onUpdateStatus, pomoState, tasks, onToggleTask, onEarlyComplete }) {
  const [showEarlyCompletion, setShowEarlyCompletion] = useState(false);
  const [earlyMins, setEarlyMins] = useState(0);

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
  const remainingStr = minsLeft(block.end, now);
  let remainingNum = 0;
  if (remainingStr.endsWith('m')) {
    remainingNum = parseInt(remainingStr, 10);
  } else if (remainingStr.endsWith('h')) {
    remainingNum = parseFloat(remainingStr) * 60;
  }

  const handleMarkDone = () => {
    if (remainingNum > 5) {
      setEarlyMins(remainingNum);
      setShowEarlyCompletion(true);
    } else {
      onUpdateStatus?.(block.id, 'done');
    }
  };

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

      {/* Block-specific Tasks */}
      {tasks && tasks.length > 0 && (
        <div className="mb-2 mt-1 flex flex-col gap-1.5 bg-[rgba(0,0,0,0.2)] rounded-lg p-2 border border-[rgba(255,255,255,0.03)]">
          {tasks.map(task => (
            <div key={task.id} className="flex items-start gap-2 group">
              <button
                onClick={() => onToggleTask?.(task.id)}
                className={`w-3.5 h-3.5 rounded-[3px] flex-shrink-0 flex items-center justify-center mt-[1px] transition-all
                  ${task.done ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.3)] border-transparent' : 'border border-[rgba(255,255,255,0.3)] bg-white/5'}
                `}
              >
                {task.done && <span className="text-[9px] text-black font-bold">✓</span>}
              </button>
              <span className={`text-[11px] leading-snug flex-1 ${task.done ? 'text-[#666] line-through' : 'text-[#ddd]'}`}>
                {task.text}
              </span>
              {task.carriedOver && !task.done && (
                <span className="text-[8px] font-mono px-1 py-0.5 rounded bg-[rgba(245,158,11,0.12)] text-[#f59e0b] border border-[rgba(245,158,11,0.2)] flex-shrink-0">↩ due</span>
              )}
            </div>
          ))}
        </div>
      )}

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
                onClick={handleMarkDone} 
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
          {remainingStr}
        </div>
      </div>

      {/* Early Completion Overlay */}
      {showEarlyCompletion && (
        <div className="absolute inset-0 bg-[var(--acrylic-surface)] backdrop-blur-md z-10 p-3 flex flex-col justify-center border border-[rgba(77,142,255,0.2)]" style={{ borderRadius: '0 8px 8px 0' }}>
          <div className="font-mono text-[10px] text-white mb-2 text-center">
            Finished {earlyMins}m early. Now what?
          </div>
          <div className="flex flex-col gap-1.5">
            <button 
              onClick={() => onEarlyComplete?.(block.id, earlyMins, 'next')}
              className="text-[10px] font-sans bg-[#4d8eff] text-black rounded py-1 hover:brightness-110 font-medium"
            >
              Start Next Block
            </button>
            <button 
              onClick={() => onEarlyComplete?.(block.id, earlyMins, 'rest')}
              className="text-[10px] font-sans bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-[#ddd] rounded py-1 hover:bg-[rgba(255,255,255,0.1)]"
            >
              Use time to Rest
            </button>
            <button 
              onClick={() => onEarlyComplete?.(block.id, earlyMins, 'pending')}
              className="text-[10px] font-sans bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-[#ddd] rounded py-1 hover:bg-[rgba(255,255,255,0.1)]"
            >
              Do Pending Work
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

