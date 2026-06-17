import React, { useState, useEffect } from 'react';

export default function TitleBar({ onStats, onTimetable, onSettings }) {
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    window.tracker?.getStreak?.().then(s => setStreak(s || 0));
    window.tracker?.onStreakUpdate?.(s => setStreak(s || 0));
  }, []);

  return (
    <div
      className="flex items-center justify-between px-[11px]"
      style={{
        height: '28px',
        borderBottom: '0.5px solid var(--divider)',
        WebkitAppRegion: 'drag',
        background: 'rgba(255,255,255,0.02)',
      }}
    >
      {/* Left side: Window Controls & Logo / App name & Streak */}
      <div className="flex items-center gap-[10px]" style={{ WebkitAppRegion: 'no-drag' }}>
        {/* Window Controls */}
        <div className="flex items-center gap-[6px]">
          <button
            onClick={() => window.tracker?.close?.()}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px',
              color: 'var(--text-tertiary)', transition: 'color 0.15s', display: 'flex'
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
            title="Hide to Tray"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          <button
            onClick={() => window.tracker?.minimize?.()}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px',
              color: 'var(--text-tertiary)', transition: 'color 0.15s', display: 'flex'
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#eab308'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
            title="Switch to Mini Widget"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 14h6v6"></path>
              <path d="M10 20l-7-7"></path>
              <path d="M20 10h-6V4"></path>
              <path d="M14 4l7 7"></path>
            </svg>
          </button>
        </div>

        {/* Divider */}
        <div style={{ width: '1px', height: '12px', background: 'var(--border-medium)' }} />

        {/* Logo / App Name & Streak */}
        <div className="flex items-center gap-1.5" style={{ WebkitAppRegion: 'drag' }}>
          <span className="font-mono select-none" style={{
            fontSize: '9.5px',
            fontWeight: '700',
            letterSpacing: '0.18em',
            color: 'var(--text-primary)',
          }}>
            TRACKER
          </span>
          <span className="font-mono select-none" style={{
            fontSize: '8px',
            fontWeight: '700',
            letterSpacing: '0.05em',
            color: '#121218',
            background: 'var(--accent)',
            padding: '1px 3.5px',
            borderRadius: '3.5px',
            lineHeight: '1',
            boxShadow: '0 0 8px var(--accent-dim)',
            transition: 'background-color 0.3s ease, box-shadow 0.3s ease',
          }}>
            OS
          </span>
          {streak > 0 && (
            <span className="text-[10px] font-medium text-orange-400 select-none drop-shadow-md ml-1" title={`${streak} day streak!`}>
              {streak}🔥
            </span>
          )}
        </div>
      </div>

      {/* Right side: Actions */}
      <div className="flex items-center gap-[8px]" style={{ WebkitAppRegion: 'no-drag' }}>
        <button
          onClick={onSettings}
          style={{
            background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px',
            color: 'var(--text-disabled)', transition: 'color 0.15s', display: 'flex'
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-disabled)'}
          title="Settings"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
        </button>
        <button
          onClick={onTimetable}
          style={{
            background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px',
            color: 'var(--text-tertiary)', transition: 'color 0.15s', display: 'flex'
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
          title="View Timetable"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        </button>
        <button
          onClick={onStats}
          style={{
            background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px',
            color: 'var(--text-tertiary)', transition: 'color 0.15s, transform 0.15s', display: 'flex'
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.transform = 'scale(1.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-tertiary)'; e.currentTarget.style.transform = 'scale(1)'; }}
          title="View Stats"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
        </button>
      </div>
    </div>
  );
}
