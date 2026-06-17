import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fmtDateKey } from '../utils/time';

export default function DailySetup({ onComplete, autoTemplate }) {
  const [step, setStep] = useState(1);
  const [templates, setTemplates] = useState({});
  const [categories, setCategories] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(autoTemplate || 'Weekday');
  const [routineBlocks, setRoutineBlocks] = useState([]);
  const [newTaskInput, setNewTaskInput] = useState('');
  const [tasksToAdd, setTasksToAdd] = useState([]);
  const [editingBlock, setEditingBlock] = useState(null);
  const [editForm, setEditForm] = useState({ label: '', start: '', end: '', category: 'study' });

  useEffect(() => {
    Promise.all([
      window.tracker?.getTemplates?.(),
      window.tracker?.getCategories?.(),
    ]).then(([t, cats]) => {
      setTemplates(t || {});
      setCategories(cats || []);

      let initialTemplate = selectedTemplate;
      if (autoTemplate && t?.[autoTemplate]) {
        initialTemplate = autoTemplate;
        setSelectedTemplate(autoTemplate);
      } else if (!t?.[selectedTemplate] && Object.keys(t || {}).length > 0) {
        initialTemplate = Object.keys(t)[0];
        setSelectedTemplate(initialTemplate);
      }
      
      if (initialTemplate && t?.[initialTemplate]) {
        setRoutineBlocks([...t[initialTemplate]]);
      }
    });
    window.tracker?.setSetupMode?.();
  }, [autoTemplate]);

  const handleSelectTemplate = (name) => {
    setSelectedTemplate(name);
    setRoutineBlocks(templates[name] ? [...templates[name]] : []);
  };

  const handleFinish = async () => {
    const today = new Date();
    const key = fmtDateKey(today);
    
    // Save routine
    await window.tracker?.saveDailyRoutine?.(key, routineBlocks);
    
    // Tell electron to restore bounds and log setup date
    window.tracker?.finishSetup?.();

    const finalTasks = [...tasksToAdd];
    if (newTaskInput.trim()) {
      finalTasks.push(newTaskInput.trim());
    }
    
    onComplete(routineBlocks, finalTasks);
  };

  const deleteBlock = (id) => {
    setRoutineBlocks(prev => prev.filter(b => b.id !== id));
  };

  const moveBlock = (index, direction) => {
    setRoutineBlocks(prev => {
      if ((direction === -1 && index === 0) || (direction === 1 && index === prev.length - 1)) return prev;
      const arr = [...prev];
      const target = index + direction;
      
      // Swap everything except start/end times so the timeline stays strictly chronological
      const tempLabel = arr[index].label;
      const tempCategory = arr[index].category;
      
      arr[index] = { ...arr[index], label: arr[target].label, category: arr[target].category };
      arr[target] = { ...arr[target], label: tempLabel, category: tempCategory };
      
      return arr;
    });
  };

  const saveBlock = () => {
    if (!editForm.label || !editForm.start || !editForm.end) return;
    
    if (editingBlock === 'new') {
      const newBlock = { id: `b_${Date.now()}`, ...editForm };
      setRoutineBlocks(prev => [...prev, newBlock].sort((a, b) => a.start.localeCompare(b.start)));
    } else {
      setRoutineBlocks(prev => {
        const arr = prev.map(b => b.id === editingBlock ? { ...b, ...editForm } : b);
        return arr.sort((a, b) => a.start.localeCompare(b.start));
      });
    }
    setEditingBlock(null);
  };

  const openEdit = (block) => {
    setEditingBlock(block.id);
    setEditForm({ label: block.label, start: block.start, end: block.end, category: block.category });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="acrylic-root p-6 w-full h-full flex flex-col text-[var(--text-primary)]"
      style={{ WebkitAppRegion: 'drag', userSelect: 'none' }}
    >
      <div className="flex-shrink-0 mb-4" style={{ WebkitAppRegion: 'no-drag' }}>
        <h2 className="text-xl font-bold mb-1">{step === 1 && autoTemplate ? "Start Your Day" : "Daily Setup"}</h2>
        <p className="text-xs text-[var(--text-secondary)]">
          {step === 1 && "Confirm your routine template, or choose a different one."}
          {step === 2 && "Review and adjust your blocks, then add any tasks."}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto pr-2" style={{ WebkitAppRegion: 'no-drag' }}>
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex flex-col gap-3">
              {Object.keys(templates).length === 0 ? (
                <div className="text-sm text-[var(--text-disabled)] italic text-center py-6">
                  No templates found. Create one in Settings → Schedules.
                </div>
              ) : (
                Object.keys(templates).map(name => (
                  <button
                    key={name}
                    onClick={() => handleSelectTemplate(name)}
                    className={`p-4 rounded-xl border flex items-center justify-between transition-colors ${selectedTemplate === name ? 'bg-[rgba(76,194,255,0.1)] border-[var(--accent)] text-white' : 'bg-[rgba(255,255,255,0.03)] border-[var(--border-subtle)] hover:bg-[rgba(255,255,255,0.08)]'}`}
                  >
                    <span className="font-medium flex items-center gap-2">
                      {name} 
                      {name === autoTemplate && <span className="text-[9px] bg-[var(--accent)] text-black px-1.5 py-0.5 rounded font-mono font-bold tracking-wider">AUTO</span>}
                    </span>
                    <span className="text-xs text-[var(--text-secondary)]">{templates[name].length} blocks</span>
                  </button>
                ))
              )}
            </motion.div>
          )}


          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <div className="flex flex-col gap-2 mb-4">
                {routineBlocks.map((block, index) => {
                  if (editingBlock === block.id) {
                    return (
                      <div key={block.id} className="p-3 rounded-lg bg-[rgba(255,255,255,0.05)] border border-[var(--accent)] flex flex-col gap-2">
                        <input className="bg-[rgba(0,0,0,0.2)] border border-[var(--border-subtle)] rounded px-2 py-1 text-sm outline-none" value={editForm.label} onChange={e=>setEditForm({...editForm, label: e.target.value})} placeholder="Label" />
                        <div className="flex gap-2">
                          <input type="time" className="bg-[rgba(0,0,0,0.2)] border border-[var(--border-subtle)] rounded px-2 py-1 text-sm outline-none flex-1" value={editForm.start} onChange={e=>setEditForm({...editForm, start: e.target.value})} />
                          <input type="time" className="bg-[rgba(0,0,0,0.2)] border border-[var(--border-subtle)] rounded px-2 py-1 text-sm outline-none flex-1" value={editForm.end} onChange={e=>setEditForm({...editForm, end: e.target.value})} />
                        </div>
                        <select className="bg-[rgba(0,0,0,0.2)] border border-[var(--border-subtle)] rounded px-2 py-1 text-sm outline-none" value={editForm.category} onChange={e=>setEditForm({...editForm, category: e.target.value})}>
                          {categories.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
                        </select>
                        <div className="flex justify-end gap-2 mt-1">
                          <button onClick={() => setEditingBlock(null)} className="text-xs px-3 py-1 rounded bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.15)]">Cancel</button>
                          <button onClick={saveBlock} className="text-xs px-3 py-1 rounded bg-[var(--accent)] text-black font-medium">Save</button>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div key={block.id} className="flex items-center justify-between p-2 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[var(--border-subtle)]">
                      <div>
                        <div className="text-sm">{block.label}</div>
                        <div className="text-[10px] text-[var(--text-tertiary)] font-mono">{block.start} - {block.end}</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => moveBlock(index, -1)} disabled={index === 0} className="text-[var(--text-secondary)] hover:text-white px-1 text-xs disabled:opacity-30">↑</button>
                        <button onClick={() => moveBlock(index, 1)} disabled={index === routineBlocks.length - 1} className="text-[var(--text-secondary)] hover:text-white px-1 text-xs disabled:opacity-30">↓</button>
                        <button onClick={() => openEdit(block)} className="text-[var(--text-secondary)] hover:text-white px-2 text-xs">Edit</button>
                        <button onClick={() => deleteBlock(block.id)} className="text-red-400 hover:text-red-300 px-2 text-xs">✕</button>
                      </div>
                    </div>
                  );
                })}

                {editingBlock === 'new' && (
                  <div className="p-3 rounded-lg bg-[rgba(255,255,255,0.05)] border border-[var(--accent)] flex flex-col gap-2">
                    <input className="bg-[rgba(0,0,0,0.2)] border border-[var(--border-subtle)] rounded px-2 py-1 text-sm outline-none" value={editForm.label} onChange={e=>setEditForm({...editForm, label: e.target.value})} placeholder="Label" />
                    <div className="flex gap-2">
                      <input type="time" className="bg-[rgba(0,0,0,0.2)] border border-[var(--border-subtle)] rounded px-2 py-1 text-sm outline-none flex-1" value={editForm.start} onChange={e=>setEditForm({...editForm, start: e.target.value})} />
                      <input type="time" className="bg-[rgba(0,0,0,0.2)] border border-[var(--border-subtle)] rounded px-2 py-1 text-sm outline-none flex-1" value={editForm.end} onChange={e=>setEditForm({...editForm, end: e.target.value})} />
                    </div>
                    <select className="bg-[rgba(0,0,0,0.2)] border border-[var(--border-subtle)] rounded px-2 py-1 text-sm outline-none" value={editForm.category} onChange={e=>setEditForm({...editForm, category: e.target.value})}>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
                    </select>
                    <div className="flex justify-end gap-2 mt-1">
                      <button onClick={() => setEditingBlock(null)} className="text-xs px-3 py-1 rounded bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.15)]">Cancel</button>
                      <button onClick={saveBlock} className="text-xs px-3 py-1 rounded bg-[var(--accent)] text-black font-medium">Add</button>
                    </div>
                  </div>
                )}

                {routineBlocks.length === 0 && editingBlock !== 'new' && <div className="text-sm text-[var(--text-disabled)] italic">No blocks for today.</div>}
                
                {editingBlock !== 'new' && (
                  <button onClick={() => { setEditingBlock('new'); setEditForm({ label: '', start: '12:00', end: '13:00', category: 'study' }); }} className="mt-2 py-2 rounded-lg border border-dashed border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-medium)] text-sm transition-colors">
                    + Add New Block
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <div className="flex gap-2 mb-4">
                <input 
                  type="text" 
                  value={newTaskInput}
                  onChange={e => setNewTaskInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && newTaskInput.trim()) {
                      setTasksToAdd([...tasksToAdd, newTaskInput.trim()]);
                      setNewTaskInput('');
                    }
                  }}
                  placeholder="Type a task and hit Enter"
                  className="flex-1 bg-[rgba(0,0,0,0.2)] border border-[var(--border-subtle)] rounded-md px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                />
              </div>
              <ul className="flex flex-col gap-2">
                {tasksToAdd.map((t, i) => (
                  <li key={i} className="text-sm px-3 py-2 rounded-md bg-[rgba(255,255,255,0.05)] border border-[var(--border-subtle)]">
                    • {t}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex-shrink-0 mt-4 flex justify-between" style={{ WebkitAppRegion: 'no-drag' }}>
        {step > 1 ? (
          <button onClick={() => setStep(step - 1)} className="px-4 py-2 rounded-md bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-sm transition-colors">
            Back
          </button>
        ) : <div />}
        
        {step === 1 ? (
          <div className="flex gap-2">
            <button onClick={() => setStep(2)} className="px-4 py-2 rounded-md bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-[var(--text-secondary)] hover:text-white text-sm transition-colors border border-[var(--border-subtle)]">
              Adjust Blocks
            </button>
            <button onClick={handleFinish} className="px-4 py-2 rounded-md bg-[var(--accent)] text-black font-medium hover:brightness-110 text-sm transition-colors shadow-[0_0_12px_var(--accent)] flex items-center gap-2">
              Start Day <span>→</span>
            </button>
          </div>
        ) : (
          <button onClick={handleFinish} className="px-4 py-2 rounded-md bg-[var(--accent)] text-black font-medium hover:brightness-110 text-sm transition-colors shadow-[0_0_12px_var(--accent)]">
            Start Day
          </button>
        )}
      </div>
    </motion.div>
  );
}
