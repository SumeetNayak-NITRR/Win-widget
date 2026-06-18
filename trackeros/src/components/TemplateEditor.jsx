import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { detectConflicts, suggestNextStart, blockDuration, toMin, sortBlocks } from '../utils/schedule';

const TEMPLATE_NAME_REGEX = /^[a-zA-Z0-9 _-]{1,24}$/;

function TimelinePreview({ blocks, categories }) {
  const DAY_START = 6 * 60;  // 06:00
  const DAY_END   = 24 * 60; // 24:00
  const DAY_SPAN  = DAY_END - DAY_START;
  const conflicts = detectConflicts(blocks);

  const catMap = {};
  (categories || []).forEach(c => { catMap[c.id] = c; });

  return (
    <div style={{
      position: 'relative',
      height: '18px',
      background: 'rgba(0,0,0,0.25)',
      borderRadius: '4px',
      overflow: 'hidden',
      marginBottom: '10px',
    }}>
      {sortBlocks(blocks).map((b, i) => {
        const start = Math.max(toMin(b.start), DAY_START);
        const end   = Math.min(toMin(b.end), DAY_END);
        if (end <= start) return null;
        const left  = ((start - DAY_START) / DAY_SPAN) * 100;
        const width = ((end - start) / DAY_SPAN) * 100;
        const cat = catMap[b.category];
        return (
          <div key={b.id || i} title={`${b.label} (${b.start}–${b.end})`} style={{
            position: 'absolute',
            left: `${left}%`,
            width: `${width}%`,
            height: '100%',
            background: conflicts.has(i) ? '#ef4444' : (cat?.color || '#4cc2ff'),
            opacity: 0.85,
            borderRight: '1px solid rgba(0,0,0,0.4)',
          }} />
        );
      })}
    </div>
  );
}

function BlockRow({ block, index, total, categories, isConflict, onEdit, onDelete, onMove }) {
  const catMap = {};
  (categories || []).forEach(c => { catMap[c.id] = c; });
  const cat = catMap[block.category];

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '6px 8px',
      borderRadius: '6px',
      background: isConflict ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.02)',
      border: `0.5px solid ${isConflict ? 'rgba(239,68,68,0.4)' : 'var(--border-subtle)'}`,
      marginBottom: '4px',
    }}>
      {/* Color dot */}
      <div style={{
        width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
        background: cat?.color || '#94a3b8',
      }} />

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '12px', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {cat?.emoji && <span style={{ marginRight: '4px' }}>{cat.emoji}</span>}
          {block.label}
        </div>
        <div style={{ fontSize: '9px', color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>
          {block.start} – {block.end} · {blockDuration(block)}m
          {isConflict && <span style={{ color: '#ef4444', marginLeft: '6px' }}>⚠ Overlap</span>}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
        <button onClick={() => onMove(index, -1)} disabled={index === 0}
          style={{ fontSize: '10px', padding: '2px 4px', opacity: index === 0 ? 0.3 : 0.6, cursor: 'pointer', background: 'none', border: 'none', color: 'var(--text-secondary)' }}
          className="hover:text-white">↑</button>
        <button onClick={() => onMove(index, 1)} disabled={index === total - 1}
          style={{ fontSize: '10px', padding: '2px 4px', opacity: index === total - 1 ? 0.3 : 0.6, cursor: 'pointer', background: 'none', border: 'none', color: 'var(--text-secondary)' }}
          className="hover:text-white">↓</button>
        <button onClick={() => onEdit(block)}
          style={{ fontSize: '10px', padding: '2px 6px', cursor: 'pointer', background: 'rgba(255,255,255,0.06)', border: '0.5px solid var(--border-subtle)', color: 'var(--text-secondary)', borderRadius: '4px' }}
          className="hover:text-white hover:bg-white/10">Edit</button>
        <button onClick={() => onDelete(block.id)}
          style={{ fontSize: '10px', padding: '2px 6px', cursor: 'pointer', background: 'rgba(239,68,68,0.08)', border: '0.5px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: '4px' }}
          className="hover:bg-red-500/20">✕</button>
      </div>
    </div>
  );
}

function BlockEditForm({ block, categories, goals, onSave, onCancel }) {
  const [form, setForm] = useState(block
    ? { label: block.label, start: block.start, end: block.end, category: block.category, emoji: block.emoji || '', linkedOutcomeId: block.linkedOutcomeId || '', topic: block.topic || '' }
    : { label: '', start: '09:00', end: '10:00', category: 'study', emoji: '', linkedOutcomeId: '', topic: '' }
  );

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.15 }}
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '0.5px solid var(--accent)',
        borderRadius: '8px',
        padding: '10px 12px',
        marginBottom: '6px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      <input
        type="text"
        value={form.label}
        onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
        placeholder="Block name (e.g. Mining Study)"
        style={{
          background: 'rgba(0,0,0,0.25)',
          border: '0.5px solid var(--border-subtle)',
          borderRadius: '5px',
          padding: '5px 8px',
          fontSize: '12px',
          color: 'var(--text-primary)',
          outline: 'none',
        }}
        className="focus:border-[var(--accent)]"
        autoFocus
      />
      
      <input
        type="text"
        value={form.topic || ''}
        onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
        placeholder="Specific topic/task for this block (optional)"
        style={{
          background: 'rgba(0,0,0,0.25)',
          border: '0.5px solid var(--border-subtle)',
          borderRadius: '5px',
          padding: '5px 8px',
          fontSize: '11px',
          color: 'var(--text-secondary)',
          outline: 'none',
        }}
        className="focus:border-[var(--accent)]"
      />
      <div style={{ display: 'flex', gap: '8px' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <label style={{ fontSize: '9px', color: 'var(--text-disabled)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Start</label>
          <input type="time" value={form.start} onChange={e => setForm(f => ({ ...f, start: e.target.value }))}
            style={{ background: 'rgba(0,0,0,0.25)', border: '0.5px solid var(--border-subtle)', borderRadius: '5px', padding: '5px 8px', fontSize: '12px', color: 'var(--text-primary)', outline: 'none', width: '100%' }} />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <label style={{ fontSize: '9px', color: 'var(--text-disabled)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>End</label>
          <input type="time" value={form.end} onChange={e => setForm(f => ({ ...f, end: e.target.value }))}
            style={{ background: 'rgba(0,0,0,0.25)', border: '0.5px solid var(--border-subtle)', borderRadius: '5px', padding: '5px 8px', fontSize: '12px', color: 'var(--text-primary)', outline: 'none', width: '100%' }} />
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
        <label style={{ fontSize: '9px', color: 'var(--text-disabled)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Category</label>
        <select
          value={form.category}
          onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
          style={{ background: 'rgba(0,0,0,0.25)', border: '0.5px solid var(--border-subtle)', borderRadius: '5px', padding: '5px 8px', fontSize: '12px', color: 'var(--text-primary)', outline: 'none', width: '100%' }}
        >
          {(categories || []).map(c => (
            <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>
          ))}
        </select>
      </div>
      {/* Goal Link Section */}
      <div style={{ borderTop: '0.5px solid var(--border-subtle)', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{ fontSize: '9px', color: 'var(--text-disabled)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>🔗 Link to Goal</label>
        <select
          value={form.linkedOutcomeId || ''}
          onChange={e => setForm(f => ({ ...f, linkedOutcomeId: e.target.value }))}
          style={{ background: 'rgba(0,0,0,0.25)', border: '0.5px solid var(--border-subtle)', borderRadius: '5px', padding: '5px 8px', fontSize: '12px', color: 'var(--text-primary)', outline: 'none', width: '100%' }}
        >
          <option value="">None</option>
          {goals.filter(g => g.type === 'northstar').map(ns => {
            const children = goals.filter(g => g.type === 'outcome' && g.parentId === ns.id);
            return (
              <React.Fragment key={ns.id}>
                <option value={ns.id}>★ {ns.icon} {ns.label}</option>
                {children.map(oc => (
                  <option key={oc.id} value={oc.id}>&nbsp;&nbsp;&nbsp;↳ {oc.label}</option>
                ))}
              </React.Fragment>
            );
          })}
        </select>
        <div style={{ fontSize: '9px', color: 'var(--text-disabled)', fontStyle: 'italic', lineHeight: 1.5 }}>
          Linking a goal shows the Goal Card during this block. Create new goals in the Stats menu.
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '2px' }}>
        <button onClick={onCancel}
          style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '5px', background: 'rgba(255,255,255,0.06)', border: '0.5px solid var(--border-subtle)', color: 'var(--text-secondary)', cursor: 'pointer' }}>
          Cancel
        </button>
        <button onClick={() => form.label && form.start && form.end && onSave(form)}
          style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '5px', background: 'var(--accent)', color: '#000', fontWeight: 600, border: 'none', cursor: 'pointer', opacity: form.label ? 1 : 0.5 }}>
          {block ? 'Save' : 'Add Block'}
        </button>
      </div>
    </motion.div>
  );
}

export default function TemplateEditor({ categories = [], onTemplatesChange }) {
  const [templates, setTemplates] = useState({});
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [editingBlock, setEditingBlock] = useState(null); // null | 'new' | block object
  const [newTemplateName, setNewTemplateName] = useState('');
  const [addingTemplate, setAddingTemplate] = useState(false);
  const [deletingTemplate, setDeletingTemplate] = useState(null);
  const [goals, setGoals] = useState([]);

  useEffect(() => {
    Promise.all([
      window.tracker?.getTemplates?.() || Promise.resolve({}),
      window.tracker?.getGoals?.() || Promise.resolve([])
    ]).then(([t, g]) => {
      setTemplates(t || {});
      setGoals(g || []);
      if (!selectedTemplate && t && Object.keys(t).length > 0) {
        setSelectedTemplate(Object.keys(t)[0]);
      }
    });
  }, []);

  const saveAll = async (updated) => {
    setTemplates(updated);
    await window.tracker?.saveTemplates?.(updated);
    onTemplatesChange?.(updated);
  };

  const handleAddTemplate = async () => {
    const name = newTemplateName.trim();
    if (!name || !TEMPLATE_NAME_REGEX.test(name) || templates[name]) return;
    const updated = { ...templates, [name]: [] };
    await saveAll(updated);
    setSelectedTemplate(name);
    setNewTemplateName('');
    setAddingTemplate(false);
  };

  const handleDeleteTemplate = async (name) => {
    const updated = { ...templates };
    delete updated[name];
    await saveAll(updated);
    setSelectedTemplate(Object.keys(updated)[0] || null);
    setDeletingTemplate(null);
  };

  const handleSaveBlock = async (form, existingId = null) => {
    const blocks = [...(templates[selectedTemplate] || [])];
    if (existingId) {
      const idx = blocks.findIndex(b => b.id === existingId);
      if (idx !== -1) blocks[idx] = { ...blocks[idx], ...form };
    } else {
      blocks.push({ id: `b_${Date.now()}`, ...form });
    }
    const sorted = sortBlocks(blocks);
    const updated = { ...templates, [selectedTemplate]: sorted };
    await saveAll(updated);
    setEditingBlock(null);
  };

  const handleDeleteBlock = async (blockId) => {
    const blocks = (templates[selectedTemplate] || []).filter(b => b.id !== blockId);
    const updated = { ...templates, [selectedTemplate]: blocks };
    await saveAll(updated);
  };

  const handleMoveBlock = async (index, direction) => {
    const blocks = [...(templates[selectedTemplate] || [])];
    if ((direction === -1 && index === 0) || (direction === 1 && index === blocks.length - 1)) return;
    const target = index + direction;
    // Swap labels/categories, keep times
    const a = blocks[index], b = blocks[target];
    blocks[index] = { ...a, label: b.label, category: b.category, emoji: b.emoji };
    blocks[target] = { ...b, label: a.label, category: a.category, emoji: a.emoji };
    const updated = { ...templates, [selectedTemplate]: blocks };
    await saveAll(updated);
  };

  const currentBlocks = templates[selectedTemplate] || [];
  const conflicts = detectConflicts(currentBlocks);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

      {/* Template Selector */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
        {Object.keys(templates).map(name => (
          <button
            key={name}
            onClick={() => { setSelectedTemplate(name); setEditingBlock(null); }}
            style={{
              fontSize: '11px', padding: '3px 10px', borderRadius: '20px', cursor: 'pointer',
              background: selectedTemplate === name ? 'var(--accent)' : 'rgba(255,255,255,0.06)',
              border: '0.5px solid ' + (selectedTemplate === name ? 'var(--accent)' : 'var(--border-subtle)'),
              color: selectedTemplate === name ? '#000' : 'var(--text-secondary)',
              fontWeight: selectedTemplate === name ? 600 : 400,
            }}
            className="transition-all"
          >
            {name}
            <span style={{ marginLeft: '5px', opacity: 0.5, fontSize: '9px' }}>
              {templates[name].length}
            </span>
          </button>
        ))}

        {addingTemplate ? (
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <input
              autoFocus
              type="text"
              value={newTemplateName}
              onChange={e => setNewTemplateName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAddTemplate(); if (e.key === 'Escape') setAddingTemplate(false); }}
              placeholder="Name..."
              maxLength={24}
              style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '5px', background: 'rgba(0,0,0,0.25)', border: '0.5px solid var(--accent)', color: 'var(--text-primary)', outline: 'none', width: '100px' }}
            />
            <button onClick={handleAddTemplate} style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '5px', background: 'var(--accent)', color: '#000', fontWeight: 600, border: 'none', cursor: 'pointer' }}>✓</button>
            <button onClick={() => setAddingTemplate(false)} style={{ fontSize: '11px', padding: '3px 6px', borderRadius: '5px', background: 'rgba(255,255,255,0.05)', border: '0.5px solid var(--border-subtle)', color: 'var(--text-tertiary)', cursor: 'pointer' }}>✕</button>
          </div>
        ) : (
          <button
            onClick={() => setAddingTemplate(true)}
            style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', background: 'rgba(255,255,255,0.03)', border: '0.5px dashed var(--border-subtle)', color: 'var(--text-tertiary)', cursor: 'pointer' }}
            className="hover:text-white hover:border-[var(--border-medium)]"
          >
            + New
          </button>
        )}
      </div>

      {selectedTemplate && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {/* Timeline preview */}
          <TimelinePreview blocks={currentBlocks} categories={categories} />

          {/* Conflict summary */}
          {conflicts.size > 0 && (
            <div style={{ fontSize: '10px', color: '#f87171', background: 'rgba(239,68,68,0.08)', border: '0.5px solid rgba(239,68,68,0.3)', borderRadius: '5px', padding: '4px 8px', marginBottom: '4px' }}>
              ⚠ {conflicts.size} block{conflicts.size > 1 ? 's' : ''} overlap — fix times to avoid issues
            </div>
          )}

          {/* Block list */}
          <div style={{ maxHeight: '200px', overflowY: 'auto', paddingRight: '2px' }}>
            <AnimatePresence>
              {currentBlocks.map((block, i) => (
                <React.Fragment key={block.id}>
                  {editingBlock && editingBlock !== 'new' && editingBlock.id === block.id ? (
                    <BlockEditForm
                      block={block}
                      categories={categories}
                      goals={goals}
                      onSave={form => handleSaveBlock(form, block.id)}
                      onCancel={() => setEditingBlock(null)}
                    />
                  ) : (
                    <BlockRow
                      block={block}
                      index={i}
                      total={currentBlocks.length}
                      categories={categories}
                      isConflict={conflicts.has(i)}
                      onEdit={b => setEditingBlock(b)}
                      onDelete={handleDeleteBlock}
                      onMove={handleMoveBlock}
                    />
                  )}
                </React.Fragment>
              ))}
            </AnimatePresence>

            {currentBlocks.length === 0 && editingBlock !== 'new' && (
              <div style={{ fontSize: '11px', color: 'var(--text-disabled)', textAlign: 'center', padding: '16px', fontStyle: 'italic' }}>
                No blocks yet — add your first one below
              </div>
            )}
          </div>

          {/* Add new block */}
          {editingBlock === 'new' ? (
            <BlockEditForm
              block={null}
              categories={categories}
              goals={goals}
              onSave={form => handleSaveBlock({ ...form, start: form.start || suggestNextStart(currentBlocks) })}
              onCancel={() => setEditingBlock(null)}
            />
          ) : (
            <button
              onClick={() => setEditingBlock('new')}
              style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '0.5px dashed var(--border-subtle)', background: 'transparent', color: 'var(--text-tertiary)', fontSize: '11px', cursor: 'pointer' }}
              className="hover:text-white hover:border-[var(--border-medium)] transition-colors"
            >
              + Add Block
            </button>
          )}

          {/* Delete template */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
            {deletingTemplate === selectedTemplate ? (
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', fontSize: '11px' }}>
                <span style={{ color: '#f87171' }}>Delete "{selectedTemplate}"?</span>
                <button onClick={() => handleDeleteTemplate(selectedTemplate)} style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(239,68,68,0.2)', border: '0.5px solid rgba(239,68,68,0.5)', color: '#f87171', cursor: 'pointer', fontSize: '10px' }}>Yes, delete</button>
                <button onClick={() => setDeletingTemplate(null)} style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', border: '0.5px solid var(--border-subtle)', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: '10px' }}>Cancel</button>
              </div>
            ) : (
              <button onClick={() => setDeletingTemplate(selectedTemplate)}
                style={{ fontSize: '10px', color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer' }}
                className="hover:text-red-400 transition-colors">
                Delete template
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
