import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CAT_COLOR } from '../data/routine';
import { fmtTime, minsLeft, isCurrentBlock, toMin } from '../utils/time';
import { useClock } from '../hooks/useClock';
import { sortBlocks } from '../utils/schedule';

function BlockEditForm({ block, categories, goals, defaultGoalId, onSave, onCancel }) {
  const [form, setForm] = useState(block
    ? { label: block.label, start: block.start, end: block.end, category: block.category, emoji: block.emoji || '', linkedOutcomeId: block.linkedOutcomeId || '', topic: block.topic || '' }
    : { label: '', start: '09:00', end: '10:00', category: 'study', emoji: '', linkedOutcomeId: defaultGoalId || '', topic: '' }
  );

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.15 }}
      style={{
        background: 'rgba(255,255,255,0.04)', border: '0.5px solid var(--accent)',
        borderRadius: '8px', padding: '10px 12px', marginBottom: '6px',
        display: 'flex', flexDirection: 'column', gap: '8px',
      }}
    >
      <input type="text" value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
        placeholder="Block name (e.g. Mining Study)"
        style={{ background: 'rgba(0,0,0,0.25)', border: '0.5px solid var(--border-subtle)', borderRadius: '5px', padding: '5px 8px', fontSize: '12px', color: 'var(--text-primary)', outline: 'none' }} autoFocus />
      
      <input type="text" value={form.topic || ''} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
        placeholder="Specific topic/task for this block (optional)"
        style={{ background: 'rgba(0,0,0,0.25)', border: '0.5px solid var(--border-subtle)', borderRadius: '5px', padding: '5px 8px', fontSize: '11px', color: 'var(--text-secondary)', outline: 'none' }} />
      
      <div style={{ display: 'flex', gap: '8px' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <label style={{ fontSize: '9px', color: 'var(--text-disabled)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Start</label>
          <input type="time" value={form.start} onChange={e => setForm(f => ({ ...f, start: e.target.value }))} style={{ background: 'rgba(0,0,0,0.25)', border: '0.5px solid var(--border-subtle)', borderRadius: '5px', padding: '5px 8px', fontSize: '12px', color: 'var(--text-primary)', outline: 'none', width: '100%' }} />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <label style={{ fontSize: '9px', color: 'var(--text-disabled)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>End</label>
          <input type="time" value={form.end} onChange={e => setForm(f => ({ ...f, end: e.target.value }))} style={{ background: 'rgba(0,0,0,0.25)', border: '0.5px solid var(--border-subtle)', borderRadius: '5px', padding: '5px 8px', fontSize: '12px', color: 'var(--text-primary)', outline: 'none', width: '100%' }} />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
        <label style={{ fontSize: '9px', color: 'var(--text-disabled)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Category</label>
        <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={{ background: 'rgba(0,0,0,0.25)', border: '0.5px solid var(--border-subtle)', borderRadius: '5px', padding: '5px 8px', fontSize: '12px', color: 'var(--text-primary)', outline: 'none', width: '100%' }}>
          {(categories || []).map(c => ( <option key={c.id} value={c.id}>{c.emoji} {c.label}</option> ))}
        </select>
      </div>

      <div style={{ borderTop: '0.5px solid var(--border-subtle)', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{ fontSize: '9px', color: 'var(--text-disabled)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>🔗 Link to Goal</label>
        <select value={form.linkedOutcomeId || ''} onChange={e => setForm(f => ({ ...f, linkedOutcomeId: e.target.value }))} style={{ background: 'rgba(0,0,0,0.25)', border: '0.5px solid var(--border-subtle)', borderRadius: '5px', padding: '5px 8px', fontSize: '12px', color: 'var(--text-primary)', outline: 'none', width: '100%' }}>
          <option value="">None</option>
          {goals.filter(g => g.type === 'northstar').map(ns => {
            const children = goals.filter(g => g.type === 'outcome' && g.parentId === ns.id);
            return (
              <React.Fragment key={ns.id}>
                <option value={ns.id}>★ {ns.icon} {ns.label}</option>
                {children.map(oc => ( <option key={oc.id} value={oc.id}>&nbsp;&nbsp;&nbsp;↳ {oc.label}</option> ))}
              </React.Fragment>
            );
          })}
        </select>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '2px' }}>
        <button onClick={onCancel} style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '5px', background: 'rgba(255,255,255,0.06)', border: '0.5px solid var(--border-subtle)', color: 'var(--text-secondary)', cursor: 'pointer' }}>Cancel</button>
        <button onClick={() => form.label && form.start && form.end && onSave(form)} style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '5px', background: 'var(--accent)', color: '#000', fontWeight: 600, border: 'none', cursor: 'pointer', opacity: form.label ? 1 : 0.5 }}>
          {block ? 'Save' : 'Add Block'}
        </button>
      </div>
    </motion.div>
  );
}

export default function Timetable({ routine, onUpdateRoutine, categories, goals, onBack }) {
  const now = useClock();
  const [editingBlock, setEditingBlock] = useState(null); // null | 'new' | block object

  // Default to the goal of the current block, or the previous block
  const getDefaultGoalId = () => {
    const nm = now.getHours() * 60 + now.getMinutes();
    const currentBlock = routine.find(b => toMin(b.start) <= nm && nm < toMin(b.end));
    if (currentBlock && currentBlock.linkedOutcomeId) return currentBlock.linkedOutcomeId;
    if (routine.length > 0) {
      const pastBlocks = routine.filter(b => toMin(b.start) <= nm).sort((a,b) => toMin(b.start) - toMin(a.start));
      if (pastBlocks[0] && pastBlocks[0].linkedOutcomeId) return pastBlocks[0].linkedOutcomeId;
    }
    return '';
  };

  const handleSaveBlock = (form, existingId = null) => {
    const blocks = [...routine];
    if (existingId) {
      const idx = blocks.findIndex(b => b.id === existingId);
      if (idx !== -1) blocks[idx] = { ...blocks[idx], ...form };
    } else {
      blocks.push({ id: `b_${Date.now()}`, ...form });
    }
    const sorted = sortBlocks(blocks);
    onUpdateRoutine(sorted);
    setEditingBlock(null);
  };

  const handleDeleteBlock = (blockId) => {
    onUpdateRoutine(routine.filter(b => b.id !== blockId));
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
      className="acrylic-root h-full w-full flex flex-col p-4"
    >
      <div className="flex items-center justify-between mb-4 mt-2">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Full Timetable</h2>
        <button onClick={onBack} className="p-1 rounded-md bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] transition-colors text-[var(--text-secondary)]" title="Back to Widget">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 pb-4">
        {routine.map(block => {
          const current = isCurrentBlock(block, now);
          
          let linkedGoal = null;
          let goalIcon = '🔗';
          if (block.linkedOutcomeId) {
            linkedGoal = goals.find(g => g.id === block.linkedOutcomeId);
            if (linkedGoal) {
              if (linkedGoal.type === 'outcome') {
                const parent = goals.find(g => g.id === linkedGoal.parentId);
                if (parent && parent.icon) goalIcon = parent.icon;
              } else if (linkedGoal.icon) {
                goalIcon = linkedGoal.icon;
              }
            }
          }

          if (editingBlock && editingBlock.id === block.id) {
            return (
              <BlockEditForm key={block.id} block={block} categories={categories} goals={goals} onSave={(form) => handleSaveBlock(form, block.id)} onCancel={() => setEditingBlock(null)} />
            );
          }
          return (
            <div key={block.id} 
              className="flex flex-col shrink-0 p-3 rounded-xl border transition-colors relative overflow-hidden"
              style={{ backgroundColor: current ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)', borderColor: current ? 'var(--accent)' : 'var(--border-subtle)', boxShadow: current ? '0 0 12px rgba(76,194,255,0.2)' : 'none' }}>
              <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ backgroundColor: CAT_COLOR[block.category] || 'var(--text-disabled)' }} />
              
              <div className="flex justify-between items-start pl-2">
                <div className="font-medium text-[var(--text-primary)] text-sm flex items-center flex-wrap gap-1">
                  {block.label}
                  {linkedGoal && (
                    <span style={{ marginLeft: '4px', fontSize: '9px', color: 'var(--text-secondary)', backgroundColor: 'rgba(255,255,255,0.05)', padding: '1px 5px', borderRadius: '4px', border: '0.5px solid var(--border-subtle)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      {goalIcon} {linkedGoal.label}
                    </span>
                  )}
                </div>
                {current && <div className="text-[10px] font-mono text-[var(--accent)] font-bold shrink-0 ml-2">{minsLeft(block.end, now)}</div>}
              </div>
              
              <div className="pl-2 mt-1 flex justify-between items-center">
                <div className="font-mono text-[10px] text-[var(--text-tertiary)]">{fmtTime(block.start)} – {fmtTime(block.end)}</div>
                
                <div className="flex gap-2 items-center">
                  <div className="flex items-center gap-1">
                    <button onClick={() => setEditingBlock(block)} className="text-[10px] bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded text-white/70 border-none cursor-pointer">Edit</button>
                    <button onClick={() => handleDeleteBlock(block.id)} className="text-[10px] bg-red-500/10 hover:bg-red-500/20 px-2 py-0.5 rounded text-red-400 border-none cursor-pointer">✕</button>
                  </div>
                  <div className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: CAT_COLOR[block.category] || 'var(--text-disabled)' }}>{block.category}</div>
                </div>
              </div>
            </div>
          );
        })}

        <AnimatePresence>
          {editingBlock === 'new' && (
            <BlockEditForm categories={categories} goals={goals} defaultGoalId={getDefaultGoalId()} onSave={(form) => handleSaveBlock(form)} onCancel={() => setEditingBlock(null)} />
          )}
        </AnimatePresence>

        {!editingBlock && (
          <button onClick={() => setEditingBlock('new')} style={{ marginTop: '8px', padding: '10px', border: '1px dashed var(--border-medium)', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', color: 'var(--text-secondary)', fontSize: '12px', cursor: 'pointer', textAlign: 'center' }} className="hover:bg-white/5 hover:border-[var(--text-secondary)] transition-colors">
            + Add Block
          </button>
        )}
      </div>
    </motion.div>
  );
}
