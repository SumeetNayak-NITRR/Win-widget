import React from 'react';
import { fmtTime } from '../utils/time';
import { CAT_COLOR } from '../data/routine';

function UpcomingList({ upcoming }) {
  return (
    <div style={{ padding: '0 4px' }}>
      <div className="font-mono uppercase" style={{
        fontSize: '9px', color: 'var(--text-disabled)',
        letterSpacing: '0.22em', padding: '0 8px', marginBottom: '2px',
      }}>
        Upcoming
      </div>

      {upcoming.length === 0 ? (
        <div className="font-sans text-center" style={{
          fontSize: '11px', color: 'var(--text-disabled)', padding: '8px',
        }}>
          No more blocks today
        </div>
      ) : (
        upcoming.map((block) => (
          <div
            key={block.id}
            className="flex items-center"
            style={{
              gap: '9px', padding: '5px 8px', borderRadius: '6px',
              cursor: 'default', transition: 'background 0.15s',
              opacity: block.isMaintenance ? 0.45 : 1, // Passive visual for maintenance blocks
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--acrylic-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            {/* Category dot with subtle glow */}
            <div style={{
              width: '5px', height: '5px', borderRadius: '50%',
              background: CAT_COLOR[block.category] || 'var(--border-medium)',
              flexShrink: 0,
              boxShadow: `0 0 5px ${CAT_COLOR[block.category] || '#888'}66`,
            }} />

            {/* Start time */}
            <span className="font-mono" style={{
              fontSize: '10px', color: 'var(--text-tertiary)',
              minWidth: '46px', flexShrink: 0,
            }}>
              {fmtTime(block.start)}
            </span>

            {/* Block name */}
            <span className="font-sans truncate" style={{
              fontSize: '11px', color: 'var(--text-secondary)',
              flex: 1, minWidth: 0,
            }}>
              {block.label}
            </span>
          </div>
        ))
      )}
    </div>
  );
}
export default React.memo(UpcomingList);
