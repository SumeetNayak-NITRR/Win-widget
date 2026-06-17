import React from 'react';

export default function Pomodoro({ pomoState }) {
  if (!pomoState) return null;
  const { active, mode, timeLeft, ambientTrack, setAmbientTrack, toggle, reset } = pomoState;

  const m = Math.floor(timeLeft / 60);
  const s = timeLeft % 60;
  const timeStr = `${m}:${s.toString().padStart(2, '0')}`;

  return (
    <div className="flex flex-col gap-1.5 mt-2 bg-[rgba(0,0,0,0.2)] p-1.5 rounded border border-[rgba(255,255,255,0.05)]">
      {/* Top Row: Timer controls */}
      <div className="flex items-center gap-2">
        <button 
          onClick={toggle}
          className="text-[11px] px-2 py-0.5 rounded transition-colors"
          style={{
            background: active ? (mode === 'focus' ? '#ef4444' : '#22c55e') : 'rgba(255,255,255,0.1)',
            color: active ? 'white' : 'var(--text-secondary)',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          {active ? '⏸' : '▶'}
        </button>
        <div className="font-mono text-[10px] text-[var(--text-primary)] w-[36px] text-center">
          {timeStr}
        </div>
        <div className="text-[9px] uppercase font-semibold tracking-wider text-[var(--text-tertiary)] flex-1">
          {mode}
        </div>
        {(timeLeft < (mode === 'focus' ? 25*60 : 5*60)) && (
          <button 
            onClick={reset} 
            className="text-[10px] text-[var(--text-secondary)] hover:text-white px-1"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            ↺
          </button>
        )}
      </div>

      {/* Bottom Row: Ambient tracks */}
      {mode === 'focus' && (
        <div className="flex items-center gap-1 border-t border-[rgba(255,255,255,0.03)] pt-1.5">
          <span className="text-[8px] text-[var(--text-disabled)] font-mono uppercase tracking-wider pr-1">Music</span>
          {[
            { id: 'none', label: '🔇' },
            { id: 'lofi', label: '🎵 Lofi' },
            { id: 'rain', label: '🌧️ Rain' },
            { id: 'noise', label: '💨 Noise' }
          ].map(tr => (
            <button
              key={tr.id}
              onClick={() => setAmbientTrack(tr.id)}
              className="text-[8px] px-1.5 py-0.5 rounded transition-all font-sans"
              style={{
                background: ambientTrack === tr.id ? 'rgba(76, 194, 255, 0.2)' : 'transparent',
                color: ambientTrack === tr.id ? 'var(--accent)' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              {tr.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
