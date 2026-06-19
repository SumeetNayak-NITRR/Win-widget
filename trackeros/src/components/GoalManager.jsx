import React, { useState } from 'react';
import { getDueStatus } from '../utils/time';

function GoalForm({ type, parentId, onSave, onCancel }) {
  const [label, setLabel] = useState('');
  const [icon, setIcon] = useState('🎯');
  const [valueType, setValueType] = useState('numeric');
  const [currentValue, setCurrentValue] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [unit, setUnit] = useState('');
  const [direction, setDirection] = useState('increase');
  const [trackType, setTrackType] = useState('boolean');
  const [dueDate, setDueDate] = useState('');

  const handleSave = () => {
    if (!label.trim()) return;
    const base = {
      id: Math.random().toString(36).substr(2, 9),
      createdAt: Date.now(),
      type,
      parentId,
      label: label.trim(),
    };
    if (type === 'northstar') {
      base.icon = icon;
    } else if (type === 'outcome') {
      base.valueType = valueType;
      base.currentValue = parseFloat(currentValue) || 0;
      base.targetValue = parseFloat(targetValue) || 0;
      base.unit = unit.trim();
      base.direction = direction;
      base.history = [{ date: new Date().toISOString().split('T')[0], value: base.currentValue }];
    } else if (type === 'focus') {
      base.trackType = trackType;
      base.dueDate = dueDate || null;
      base.done = false;
    }
    onSave(base);
  };

  return (
    <div style={{
      background: 'rgba(0,0,0,0.25)', padding: '14px', borderRadius: '10px',
      border: '1px solid rgba(77,142,255,0.2)', marginTop: '8px', marginBottom: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
    }}>
      <div style={{ fontSize: '10px', color: 'var(--text-disabled)', marginBottom: '8px', textTransform: 'uppercase' }}>
        New {type}
      </div>
      <div className="flex gap-2 mb-2">
        {type === 'northstar' && (
          <input value={icon} onChange={e => setIcon(e.target.value)}
            style={{ width: '30px', background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', borderRadius: '4px', textAlign: 'center' }}
          />
        )}
        <input value={label} onChange={e => setLabel(e.target.value)} placeholder="Title"
          style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', borderRadius: '4px', padding: '4px 8px', fontSize: '12px' }}
        />
      </div>

      {type === 'outcome' && (
        <div className="flex gap-2 mb-2" style={{ fontSize: '11px' }}>
          <select value={valueType} onChange={e => setValueType(e.target.value)}
            style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', borderRadius: '4px', padding: '4px' }}>
            <option value="numeric">Numeric</option>
            <option value="boolean">Boolean</option>
          </select>
          <input value={currentValue} onChange={e => setCurrentValue(e.target.value)} placeholder="Current" style={{ width: '60px', background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', borderRadius: '4px', padding: '4px' }} />
          <input value={targetValue} onChange={e => setTargetValue(e.target.value)} placeholder="Target" style={{ width: '60px', background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', borderRadius: '4px', padding: '4px' }} />
          <input value={unit} onChange={e => setUnit(e.target.value)} placeholder="Unit (e.g. kg)" style={{ width: '80px', background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', borderRadius: '4px', padding: '4px' }} />
          <select value={direction} onChange={e => setDirection(e.target.value)}
            style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', borderRadius: '4px', padding: '4px' }}>
            <option value="increase">Increase</option>
            <option value="decrease">Decrease</option>
          </select>
        </div>
      )}

      {type === 'focus' && (
        <div className="flex flex-col gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>Tracking Type</span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setTrackType('boolean')} className={`flex-1 py-1.5 px-2 rounded-md transition-colors border ${trackType === 'boolean' ? 'bg-[rgba(77,142,255,0.15)] text-[#4d8eff] border-[#4d8eff]' : 'bg-[rgba(255,255,255,0.03)] text-[#aaa] border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.08)]'}`} style={{ fontSize: '11px', fontWeight: '500' }}>✓ Boolean</button>
            <button onClick={() => setTrackType('duration')} className={`flex-1 py-1.5 px-2 rounded-md transition-colors border ${trackType === 'duration' ? 'bg-[rgba(77,142,255,0.15)] text-[#4d8eff] border-[#4d8eff]' : 'bg-[rgba(255,255,255,0.03)] text-[#aaa] border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.08)]'}`} style={{ fontSize: '11px', fontWeight: '500' }}>⏱ Duration</button>
            <button onClick={() => setTrackType('count')} className={`flex-1 py-1.5 px-2 rounded-md transition-colors border ${trackType === 'count' ? 'bg-[rgba(77,142,255,0.15)] text-[#4d8eff] border-[#4d8eff]' : 'bg-[rgba(255,255,255,0.03)] text-[#aaa] border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.08)]'}`} style={{ fontSize: '11px', fontWeight: '500' }}>🔢 Count</button>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>Deadline (Optional)</span>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px', padding: '4px 8px', outline: 'none', fontSize: '11px' }} />
          </div>
        </div>
      )}

      <div className="flex gap-2 justify-end mt-3">
        <button onClick={onCancel} style={{ fontSize: '11px', padding: '5px 10px', background: 'transparent', color: 'var(--text-disabled)', border: 'none', cursor: 'pointer' }} className="hover:text-white transition-colors">Cancel</button>
        <button onClick={handleSave} style={{ fontSize: '11px', padding: '5px 16px', background: '#4d8eff', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }} className="hover:bg-[#3a78eb] transition-colors">Save</button>
      </div>
    </div>
  );
}

export default function GoalManager({ goals, setGoals }) {
  const [adding, setAdding] = useState(null);

  const addGoal = (goal) => {
    setGoals([...goals, goal]);
    setAdding(null);
  };

  const deleteGoal = (id) => {
    const toDelete = new Set([id]);
    let prevSize = 0;
    while(toDelete.size > prevSize) {
      prevSize = toDelete.size;
      goals.forEach(g => {
        if (toDelete.has(g.parentId)) toDelete.add(g.id);
      });
    }
    setGoals(goals.filter(g => !toDelete.has(g.id)));
  };

  const northstars = goals.filter(g => g.type === 'northstar');
  const outcomes = goals.filter(g => g.type === 'outcome');
  const focuses = goals.filter(g => g.type === 'focus');

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <h3 style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: '600', letterSpacing: '0.02em' }}>Goals Setup</h3>
        <button onClick={() => setAdding({ type: 'northstar', parentId: null })}
          style={{ fontSize: '11px', background: 'rgba(77,142,255,0.1)', border: '1px solid rgba(77,142,255,0.3)', color: '#4d8eff', padding: '5px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}
          className="hover:bg-[rgba(77,142,255,0.2)] transition-colors"
        >
          + New North Star
        </button>
      </div>

      {adding && adding.type === 'northstar' && (
        <GoalForm type="northstar" parentId={null} onSave={addGoal} onCancel={() => setAdding(null)} />
      )}

      {northstars.length === 0 && !adding && (
        <div style={{ fontSize: '11px', color: 'var(--text-disabled)', textAlign: 'center', padding: '20px' }}>
          No goals set. Create a North Star to begin.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {northstars.map(ns => (
          <div key={ns.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '16px', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' }}>
            <div className="flex justify-between items-center mb-2">
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="text-xl">{ns.icon}</span> {ns.label}
              </div>
              <button onClick={() => deleteGoal(ns.id)} style={{ background: 'none', border: 'none', color: '#ff5f57', cursor: 'pointer', fontSize: '14px', opacity: 0.7 }} className="hover:opacity-100 transition-opacity">✕</button>
            </div>

            <div style={{ marginTop: '16px' }}>
              <div className="flex justify-between items-center mb-3">
                <span style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>Outcomes</span>
                <button onClick={() => setAdding({ type: 'outcome', parentId: ns.id })} style={{ background: 'none', border: 'none', color: '#4d8eff', fontSize: '11px', cursor: 'pointer', fontWeight: '500' }} className="hover:text-[#6fa3ff] transition-colors">+ Add</button>
              </div>
              
              {adding && adding.parentId === ns.id && adding.type === 'outcome' && (
                <GoalForm type="outcome" parentId={ns.id} onSave={addGoal} onCancel={() => setAdding(null)} />
              )}

              <div className="flex flex-col gap-3">
                {outcomes.filter(o => o.parentId === ns.id).map(out => (
                  <div key={out.id} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '12px' }}>
                    <div className="flex justify-between items-center">
                      <span style={{ fontSize: '13px', color: '#e6e6e6', fontWeight: '500' }}>{out.label} <span style={{ color: '#666', fontSize: '11px', marginLeft: '6px' }}>({out.currentValue} → {out.targetValue} {out.unit})</span></span>
                      <button onClick={() => deleteGoal(out.id)} style={{ background: 'none', border: 'none', color: '#ff5f57', cursor: 'pointer', fontSize: '11px', opacity: 0.7 }} className="hover:opacity-100 transition-opacity">✕</button>
                    </div>
                    
                    <div style={{ marginTop: '12px', paddingLeft: '12px', borderLeft: '2px solid rgba(77,142,255,0.3)' }}>
                      <div className="flex justify-between items-center mb-2">
                        <span style={{ fontSize: '9px', color: '#888', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: '600' }}>FOCUS AREAS / TO-DO</span>
                        <button onClick={() => setAdding({ type: 'focus', parentId: out.id })} style={{ background: 'none', border: 'none', color: '#4d8eff', fontSize: '10px', cursor: 'pointer', fontWeight: '500' }} className="hover:text-[#6fa3ff] transition-colors">+ Add</button>
                      </div>
                      {adding && adding.parentId === out.id && adding.type === 'focus' && (
                        <GoalForm type="focus" parentId={out.id} onSave={addGoal} onCancel={() => setAdding(null)} />
                      )}
                      <div className="flex flex-col gap-1.5">
                        {focuses.filter(f => f.parentId === out.id).map(foc => {
                          const due = getDueStatus(foc.dueDate);
                          return (
                          <div key={foc.id} className="flex justify-between items-center group" style={{ fontSize: '12px', background: 'rgba(255,255,255,0.03)', padding: '6px 10px', borderRadius: '6px', color: '#ccc' }}>
                            <div className="flex items-center gap-2">
                              {foc.done && <span style={{ color: '#4d8eff', fontSize: '14px' }}>✓</span>}
                              <span style={{ textDecoration: foc.done ? 'line-through' : 'none', color: foc.done ? '#666' : '#ccc' }}>{foc.label}</span>
                              {due && !foc.done && (
                                <span style={{ fontSize: '9px', background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px', color: due.color, marginLeft: '4px' }}>
                                  {due.text}
                                </span>
                              )}
                            </div>
                            <button onClick={() => deleteGoal(foc.id)} style={{ background: 'none', border: 'none', color: '#ff5f57', cursor: 'pointer', fontSize: '10px', opacity: 0 }} className="group-hover:opacity-100 transition-opacity">✕</button>
                          </div>
                        )})}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
