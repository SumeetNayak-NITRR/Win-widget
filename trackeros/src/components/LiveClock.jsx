import React from 'react';
import { fmt12, fmtDate } from '../utils/time';
import { useClock } from '../hooks/useClock';

export default function LiveClock() {
  const now = useClock();
  return (
    <div
      className="flex items-center justify-between"
      style={{
        borderBottom: '0.5px solid var(--divider)',
        padding: '10px 14px 9px',
        flexShrink: 0,
        background: 'rgba(255,255,255,0.015)',
      }}
    >
      {/* Time */}
      <span
        className="font-mono font-semibold select-none"
        style={{
          fontSize: '22px',
          letterSpacing: '-1px',
          lineHeight: 1,
          color: 'var(--text-primary)',
          textShadow: '0 0 18px rgba(76,194,255,0.12)',
        }}
      >
        {fmt12(now)}
      </span>

      {/* Date + institution */}
      <div className="text-right">
        <div className="font-mono uppercase select-none" style={{
          fontSize: '10px', color: 'var(--text-tertiary)',
          lineHeight: 1.4, letterSpacing: '0.07em',
        }}>
          {fmtDate(now)}
        </div>
        <div className="font-mono uppercase select-none" style={{
          fontSize: '9px', color: 'var(--text-disabled)',
          lineHeight: 1.4, letterSpacing: '0.09em',
        }}>
          NITRR · 2026
        </div>
      </div>
    </div>
  );
}
