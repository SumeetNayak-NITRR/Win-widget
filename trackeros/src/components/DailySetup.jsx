import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fmtDateKey } from '../utils/time';

export default function DailySetup({ onComplete, autoTemplate }) {
  const [step, setStep] = useState(1);
  const [templates, setTemplates] = useState({});
  const [categories, setCategories] = useState([]);
  const [goals, setGoals] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(autoTemplate || 'Weekday');
  const [routineBlocks, setRoutineBlocks] = useState([]);
  
  const [carriedTasks, setCarriedTasks] = useState([]);
  const [newTaskInput, setNewTaskInput] = useState('');
  const [newTaskGoal, setNewTaskGoal] = useState('');
  const [tasksToAdd, setTasksToAdd] = useState([]);

  const [editingBlock, setEditingBlock] = useState(null);
  const [editForm, setEditForm] = useState({ label: '', topic: '', start: '', end: '', category: 'study', linkedOutcomeId: '' });

  useEffect(() => {
    Promise.all([
      window.tracker?.getTemplates?.(),
      window.tracker?.getCategories?.(),
      window.tracker?.getTasks?.(fmtDateKey(new Date())),
      window.tracker?.getGoals?.()
    ]).then(([t, cats, tasks, g]) => {
      setTemplates(t || {});
      setCategories(cats || []);
      setGoals(g || []);
      if (tasks) setCarriedTasks(tasks.filter(tk => !tk.done));

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
    await window.tracker?.saveDailyRoutine?.(key, routineBlocks);
    
    // We do NOT save tasks directly here, we let App.jsx add them via onComplete
    // App.jsx will call addTask() for each string we pass. Carried tasks are already in store, so we only pass the NEW tasks.
    const finalNewTasks = [...tasksToAdd];
    if (newTaskInput.trim()) {
      finalNewTasks.push({ text: newTaskInput.trim(), linkedOutcomeId: newTaskGoal });
    }

    window.tracker?.finishSetup?.();
    onComplete(routineBlocks, finalNewTasks);
  };

  const deleteBlock = (id) => setRoutineBlocks(prev => prev.filter(b => b.id !== id));

  const moveBlock = (index, direction) => {
    setRoutineBlocks(prev => {
      if ((direction === -1 && index === 0) || (direction === 1 && index === prev.length - 1)) return prev;
      const arr = [...prev];
      const target = index + direction;
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
      setRoutineBlocks(prev => prev.map(b => b.id === editingBlock ? { ...b, ...editForm } : b).sort((a, b) => a.start.localeCompare(b.start)));
    }
    setEditingBlock(null);
  };

  const openEdit = (block) => {
    setEditingBlock(block.id);
    setEditForm({ label: block.label, topic: block.topic || '', start: block.start, end: block.end, category: block.category, linkedOutcomeId: block.linkedOutcomeId || '', isMaintenance: !!block.isMaintenance });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="acrylic-root p-4 w-full h-full flex flex-col text-[var(--text-primary)]"
      style={{ WebkitAppRegion: 'drag', userSelect: 'none' }}
    >
      <div className="flex-shrink-0 mb-3" style={{ WebkitAppRegion: 'no-drag' }}>
        <h2 className="text-lg font-bold mb-0.5">{step === 1 && autoTemplate ? "Start Your Day" : "Daily Setup"}</h2>
        <p className="text-[10px] text-[var(--text-secondary)] leading-tight">
          {step === 1 && "Confirm your routine template."}
          {step === 2 && "Review and adjust your blocks."}
          {step === 3 && "Review today's tasks."}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 custom-scroll" style={{ WebkitAppRegion: 'no-drag' }}>
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="flex flex-col gap-2">
              {Object.keys(templates).length === 0 ? (
                <div className="text-xs text-[var(--text-disabled)] italic text-center py-6">
                  No templates found.
                </div>
              ) : (
                Object.keys(templates).map(name => (
                  <button
                    key={name}
                    onClick={() => handleSelectTemplate(name)}
                    className={`p-3 rounded-xl border flex flex-col transition-colors ${selectedTemplate === name ? 'bg-[rgba(76,194,255,0.1)] border-[var(--accent)] text-white' : 'bg-[rgba(255,255,255,0.03)] border-[var(--border-subtle)] hover:bg-[rgba(255,255,255,0.08)]'}`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-medium text-sm flex items-center gap-2">
                        {name} 
                        {name === autoTemplate && <span className="text-[8px] bg-[var(--accent)] text-black px-1.5 py-0.5 rounded font-mono font-bold tracking-wider">AUTO</span>}
                      </span>
                    </div>
                    <span className="text-[10px] text-[var(--text-secondary)] mt-1">{templates[name].length} blocks</span>
                  </button>
                ))
              )}
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
              <div className="flex flex-col gap-2 mb-2">
                {routineBlocks.map((block, index) => {
                  if (editingBlock === block.id) {
                    return (
                      <div key={block.id} className="p-2 rounded-lg bg-[rgba(255,255,255,0.05)] border border-[var(--accent)] flex flex-col gap-2">
                        <input className="bg-[rgba(0,0,0,0.2)] border border-[var(--border-subtle)] rounded px-2 py-1 text-xs outline-none text-[var(--text-primary)]" value={editForm.label} onChange={e=>setEditForm({...editForm, label: e.target.value})} placeholder="Label" />
                        <input className="bg-[rgba(0,0,0,0.2)] border border-[var(--border-subtle)] rounded px-2 py-1 text-[11px] outline-none text-[var(--text-secondary)]" value={editForm.topic} onChange={e=>setEditForm({...editForm, topic: e.target.value})} placeholder="Focus area / to-do (optional)" />
                        <div className="flex flex-col gap-1">
                          <div className="flex gap-1 items-center text-[10px] text-[var(--text-secondary)]">
                            Start: <input type="time" className="bg-[rgba(0,0,0,0.2)] border border-[var(--border-subtle)] rounded px-1 py-1 text-xs outline-none flex-1" value={editForm.start} onChange={e=>setEditForm({...editForm, start: e.target.value})} />
                          </div>
                          <div className="flex gap-1 items-center text-[10px] text-[var(--text-secondary)]">
                            End: <input type="time" className="bg-[rgba(0,0,0,0.2)] border border-[var(--border-subtle)] rounded px-1 py-1 text-xs outline-none flex-1" value={editForm.end} onChange={e=>setEditForm({...editForm, end: e.target.value})} />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <select className="bg-[rgba(0,0,0,0.2)] border border-[var(--border-subtle)] rounded px-1 py-1 text-xs outline-none flex-1" value={editForm.category} onChange={e=>setEditForm({...editForm, category: e.target.value})}>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
                          </select>
                          <select className="bg-[rgba(0,0,0,0.2)] border border-[var(--border-subtle)] rounded px-1 py-1 text-xs outline-none flex-1" value={editForm.linkedOutcomeId} onChange={e=>setEditForm({...editForm, linkedOutcomeId: e.target.value})}>
                            <option value="">No Goal</option>
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
                        <label className="flex items-center gap-2 mt-1" style={{ fontSize: '10px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                          <input type="checkbox" checked={editForm.isMaintenance} onChange={e => setEditForm({ ...editForm, isMaintenance: e.target.checked })} />
                          Maintenance / Survival Block
                        </label>
                        <div className="flex justify-end gap-1 mt-1">
                          <button onClick={() => setEditingBlock(null)} className="text-[10px] px-2 py-1 rounded bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.15)] text-[var(--text-primary)]">Cancel</button>
                          <button onClick={saveBlock} className="text-[10px] px-2 py-1 rounded bg-[var(--accent)] text-black font-medium">Save</button>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div key={block.id} className="flex flex-col p-2 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[var(--border-subtle)]">
                      <div className="flex items-start justify-between">
                        <div className="flex flex-col min-w-0 pr-1">
                          <div className="text-xs truncate flex items-center gap-1">
                            {block.label}
                            {block.linkedOutcomeId && (
                              <span className="text-[8px] bg-[rgba(255,255,255,0.1)] px-1 rounded text-[var(--text-secondary)]" title="Linked to goal">★</span>
                            )}
                          </div>
                          {block.topic && <div className="text-[10px] text-[var(--text-secondary)] truncate mt-0.5">{block.topic}</div>}
                          <div className="text-[9px] text-[var(--text-tertiary)] font-mono">{block.start} - {block.end}</div>
                        </div>
                        <button onClick={() => deleteBlock(block.id)} className="text-red-400 hover:text-red-300 px-1 text-[10px]">✕</button>
                      </div>
                      <div className="flex justify-end items-center gap-1 mt-1">
                        <button onClick={() => moveBlock(index, -1)} disabled={index === 0} className="text-[var(--text-secondary)] hover:text-white px-1 text-xs disabled:opacity-30">↑</button>
                        <button onClick={() => moveBlock(index, 1)} disabled={index === routineBlocks.length - 1} className="text-[var(--text-secondary)] hover:text-white px-1 text-xs disabled:opacity-30">↓</button>
                        <button onClick={() => openEdit(block)} className="text-[var(--text-secondary)] hover:text-white px-1 text-[10px] bg-[rgba(255,255,255,0.05)] rounded">Edit</button>
                      </div>
                    </div>
                  );
                })}

                {editingBlock === 'new' && (
                  <div className="p-2 rounded-lg bg-[rgba(255,255,255,0.05)] border border-[var(--accent)] flex flex-col gap-2">
                    <input className="bg-[rgba(0,0,0,0.2)] border border-[var(--border-subtle)] rounded px-2 py-1 text-xs outline-none text-[var(--text-primary)]" value={editForm.label} onChange={e=>setEditForm({...editForm, label: e.target.value})} placeholder="Label" />
                    <input className="bg-[rgba(0,0,0,0.2)] border border-[var(--border-subtle)] rounded px-2 py-1 text-[11px] outline-none text-[var(--text-secondary)]" value={editForm.topic} onChange={e=>setEditForm({...editForm, topic: e.target.value})} placeholder="Focus area / to-do (optional)" />
                    <div className="flex flex-col gap-1">
                      <div className="flex gap-1 items-center text-[10px] text-[var(--text-secondary)]">
                        Start: <input type="time" className="bg-[rgba(0,0,0,0.2)] border border-[var(--border-subtle)] rounded px-1 py-1 text-xs outline-none flex-1" value={editForm.start} onChange={e=>setEditForm({...editForm, start: e.target.value})} />
                      </div>
                      <div className="flex gap-1 items-center text-[10px] text-[var(--text-secondary)]">
                        End: <input type="time" className="bg-[rgba(0,0,0,0.2)] border border-[var(--border-subtle)] rounded px-1 py-1 text-xs outline-none flex-1" value={editForm.end} onChange={e=>setEditForm({...editForm, end: e.target.value})} />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <select className="bg-[rgba(0,0,0,0.2)] border border-[var(--border-subtle)] rounded px-1 py-1 text-xs outline-none flex-1" value={editForm.category} onChange={e=>setEditForm({...editForm, category: e.target.value})}>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
                      </select>
                      <select className="bg-[rgba(0,0,0,0.2)] border border-[var(--border-subtle)] rounded px-1 py-1 text-xs outline-none flex-1" value={editForm.linkedOutcomeId} onChange={e=>setEditForm({...editForm, linkedOutcomeId: e.target.value})}>
                        <option value="">No Goal</option>
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
                    <label className="flex items-center gap-2 mt-1" style={{ fontSize: '10px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                      <input type="checkbox" checked={editForm.isMaintenance} onChange={e => setEditForm({ ...editForm, isMaintenance: e.target.checked })} />
                      Maintenance / Survival Block
                    </label>
                    <div className="flex justify-end gap-1 mt-1">
                      <button onClick={() => setEditingBlock(null)} className="text-[10px] px-2 py-1 rounded bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.15)] text-[var(--text-primary)]">Cancel</button>
                      <button onClick={saveBlock} className="text-[10px] px-2 py-1 rounded bg-[var(--accent)] text-black font-medium">Add</button>
                    </div>
                  </div>
                )}

                {routineBlocks.length === 0 && editingBlock !== 'new' && <div className="text-xs text-[var(--text-disabled)] italic mt-2">No blocks for today.</div>}
                
                {editingBlock !== 'new' && (
                  <button onClick={() => { setEditingBlock('new'); setEditForm({ label: '', topic: '', start: '12:00', end: '13:00', category: 'study', linkedOutcomeId: '', isMaintenance: false }); }} className="mt-1 py-1.5 rounded-lg border border-dashed border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-medium)] text-[11px] transition-colors">
                    + Add New Block
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="flex flex-col gap-3">
              {carriedTasks.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-[var(--text-disabled)]">Due Tasks</span>
                  {carriedTasks.map((t) => (
                    <div key={t.id} className="text-[11px] px-2 py-1.5 rounded-md bg-[rgba(255,255,255,0.03)] border border-[var(--border-subtle)] text-[var(--text-secondary)] truncate">
                      • {t.text}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <span className="font-mono text-[9px] uppercase tracking-wider text-[var(--text-disabled)]">Today's Focus</span>
                {tasksToAdd.map((t, i) => {
                  const label = t.text || t;
                  const gLabel = t.linkedOutcomeId ? goals.find(g => g.id === t.linkedOutcomeId)?.label : null;
                  return (
                    <div key={i} className="text-[11px] px-2 py-1.5 rounded-md bg-[rgba(76,194,255,0.05)] border border-[var(--accent)] text-white flex justify-between items-center">
                      <div className="truncate flex-1 flex items-center gap-2">
                        <span>• {label}</span>
                        {gLabel && <span className="text-[8px] bg-[rgba(255,255,255,0.1)] px-1 rounded text-[var(--text-secondary)] truncate max-w-[80px]">★ {gLabel}</span>}
                      </div>
                      <button onClick={() => setTasksToAdd(prev => prev.filter((_, idx) => idx !== i))} className="text-[10px] text-red-400 opacity-60 hover:opacity-100 ml-2 px-1">✕</button>
                    </div>
                  );
                })}
                
                <div className="flex gap-1 mt-1">
                  <input 
                    type="text" 
                    value={newTaskInput}
                    onChange={e => setNewTaskInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && newTaskInput.trim()) {
                        setTasksToAdd([...tasksToAdd, { text: newTaskInput.trim(), linkedOutcomeId: newTaskGoal }]);
                        setNewTaskInput('');
                      }
                    }}
                    placeholder="Type a task and hit Enter..."
                    className="bg-[rgba(0,0,0,0.2)] border border-[var(--border-subtle)] rounded-md px-2 py-1.5 text-[11px] outline-none focus:border-[var(--accent)] flex-1 placeholder:text-[var(--text-tertiary)]"
                  />
                  <select 
                    value={newTaskGoal} 
                    onChange={e => setNewTaskGoal(e.target.value)}
                    className="bg-[rgba(0,0,0,0.2)] border border-[var(--border-subtle)] rounded-md px-1 py-1.5 text-[10px] outline-none text-[var(--text-secondary)] w-[80px]"
                    title="Link to goal (optional)"
                  >
                    <option value="">No Goal</option>
                    {goals.filter(g => g.type === 'northstar').map(ns => {
                      const children = goals.filter(g => g.type === 'outcome' && g.parentId === ns.id);
                      return (
                        <React.Fragment key={ns.id}>
                          <option value={ns.id}>★ {ns.icon} {ns.label}</option>
                          {children.map(oc => ( <option key={oc.id} value={oc.id}>↳ {oc.label}</option> ))}
                        </React.Fragment>
                      );
                    })}
                  </select>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      <div className="flex-shrink-0 mt-3 pt-3 border-t border-[var(--divider)] flex flex-col gap-2" style={{ WebkitAppRegion: 'no-drag' }}>
        <div className="flex justify-between gap-2">
          {step > 1 ? (
            <button onClick={() => setStep(step - 1)} className="px-3 py-1.5 flex-1 rounded-md bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-[11px] transition-colors">
              Back
            </button>
          ) : (
            <button onClick={() => setStep(2)} className="px-3 py-1.5 flex-1 rounded-md bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-[var(--text-secondary)] hover:text-white text-[11px] transition-colors border border-[var(--border-subtle)]">
              Adjust Blocks
            </button>
          )}
          
          {step < 3 ? (
            <button onClick={() => setStep(step + 1)} className="px-3 py-1.5 flex-1 rounded-md bg-[var(--accent)] text-black font-medium hover:brightness-110 text-[11px] transition-colors">
              Next
            </button>
          ) : (
            <button onClick={handleFinish} className="px-3 py-1.5 flex-[1.5] rounded-md bg-[var(--accent)] text-black font-medium hover:brightness-110 text-[11px] transition-colors shadow-[0_0_8px_var(--accent)]">
              Start Day
            </button>
          )}
        </div>
        {step === 1 && (
           <button onClick={handleFinish} className="w-full py-1.5 text-[10px] text-[var(--text-tertiary)] hover:text-white transition-colors underline decoration-dashed underline-offset-2">
             Skip directly to Start Day
           </button>
        )}
      </div>
    </motion.div>
  );
}
