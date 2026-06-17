import React, { useState, useEffect } from 'react';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_LABELS = { Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday' };

export default function ScheduleConfig({ templates = {} }) {
  const [config, setConfig] = useState({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    window.tracker?.getScheduleConfig?.().then(c => {
      setConfig(c || {});
    });
  }, []);

  const handleChange = async (day, value) => {
    const updated = { ...config, [day]: value };
    setConfig(updated);
    await window.tracker?.saveScheduleConfig?.(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const templateNames = Object.keys(templates);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ fontSize: '10px', color: 'var(--text-disabled)', marginBottom: '4px', lineHeight: 1.5 }}>
        Assign a template to each day. TrackerOS will auto-load the right schedule every morning — no manual setup needed.
      </div>

      {DAYS.map(day => (
        <div key={day} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '6px 10px', borderRadius: '6px',
          background: 'rgba(255,255,255,0.02)',
          border: '0.5px solid var(--border-subtle)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '28px', fontSize: '10px', fontFamily: 'monospace',
              color: ['Sat', 'Sun'].includes(day) ? 'var(--accent)' : 'var(--text-secondary)',
              fontWeight: 600,
            }}>
              {day}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
              {DAY_LABELS[day]}
            </div>
          </div>

          {templateNames.length === 0 ? (
            <span style={{ fontSize: '10px', color: 'var(--text-disabled)', fontStyle: 'italic' }}>No templates</span>
          ) : (
            <select
              value={config[day] || ''}
              onChange={e => handleChange(day, e.target.value)}
              style={{
                background: 'rgba(0,0,0,0.3)',
                border: '0.5px solid var(--border-medium)',
                borderRadius: '5px',
                padding: '3px 8px',
                fontSize: '11px',
                color: config[day] ? 'var(--text-primary)' : 'var(--text-disabled)',
                outline: 'none',
                cursor: 'pointer',
                maxWidth: '120px',
              }}
            >
              <option value="">— None —</option>
              {templateNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          )}
        </div>
      ))}

      {saved && (
        <div style={{ fontSize: '10px', color: 'var(--accent)', textAlign: 'right', transition: 'opacity 0.3s' }}>
          ✓ Saved
        </div>
      )}

      <div style={{ fontSize: '10px', color: 'var(--text-disabled)', marginTop: '4px', padding: '6px 8px', background: 'rgba(255,255,255,0.015)', borderRadius: '5px', border: '0.5px solid var(--border-subtle)', lineHeight: 1.6 }}>
        💡 If a day has no template assigned, TrackerOS will ask you to choose one during Daily Setup.
      </div>
    </div>
  );
}
