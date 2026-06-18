import React from 'react';

function DayProgress({ done, total }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div style={{
      borderTop: '0.5px solid var(--divider)',
      padding: '8px 14px 10px',
      flexShrink: 0,
      background: 'rgba(255,255,255,0.012)',
    }}>
      <div className="flex justify-between items-center" style={{ marginBottom: '6px' }}>
        <span className="font-mono uppercase" style={{
          fontSize: '9px', color: 'var(--text-disabled)', letterSpacing: '0.15em',
        }}>
          Day Progress
        </span>
        <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
          {done}/{total} · {pct}%
        </span>
      </div>

      {/* Track */}
      <div style={{
        height: '2px', background: 'rgba(255,255,255,0.06)',
        borderRadius: '1px', overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: 'var(--green)',
          borderRadius: '1px',
          transition: 'width 0.35s ease',
          boxShadow: pct > 0 ? '0 0 6px var(--green-dim)' : 'none',
        }} />
      </div>
    </div>
  );
}
export default React.memo(DayProgress);
