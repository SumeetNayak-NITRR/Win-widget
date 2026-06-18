import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function Checkbox({ done, onToggle }) {
  return (
    <motion.div
      onClick={onToggle}
      whileTap={{ scale: 0.82, transition: { duration: 0.12 } }}
      style={{
        width: '13px', height: '13px', borderRadius: '3px',
        border: done ? 'none' : '1.5px solid var(--border-medium)',
        background: done ? 'var(--green)' : 'rgba(255,255,255,0.03)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', flexShrink: 0,
        transition: 'background 0.15s, border 0.15s, box-shadow 0.15s',
        boxShadow: done ? '0 0 8px var(--green-dim)' : 'none',
      }}
    >
      {done && (
        <span style={{ fontSize: '8px', color: '#000', fontWeight: 700, lineHeight: 1, userSelect: 'none' }}>
          ✓
        </span>
      )}
    </motion.div>
  );
}

function TaskList({ tasks, onToggle, onAdd }) {
  const [showInput, setShowInput] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const inputRef = useRef(null);

  const handleAddClick = () => { setShowInput(true); setTimeout(() => inputRef.current?.focus(), 30); };
  const handleSubmit = () => {
    if (inputVal.trim()) onAdd(inputVal);
    setInputVal(''); setShowInput(false);
  };
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit();
    if (e.key === 'Escape') { setInputVal(''); setShowInput(false); }
  };

  return (
    <div style={{ padding: '0 4px' }}>
      <div className="font-mono uppercase" style={{
        fontSize: '9px', color: 'var(--text-disabled)',
        letterSpacing: '0.22em', padding: '0 6px', marginBottom: '2px',
      }}>
        Tasks
      </div>

      <AnimatePresence initial={false}>
        {tasks.map(task => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className="flex items-center"
            style={{
              gap: '8px', padding: '5px 6px', borderRadius: '6px',
              cursor: 'pointer', transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--acrylic-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            onClick={() => onToggle(task.id)}
          >
            <Checkbox done={task.done} onToggle={() => onToggle(task.id)} />
            <div className="flex-1 flex flex-col min-w-0">
              <div className="flex items-center gap-1 min-w-0">
                <span className="font-sans select-none truncate" style={{
                  fontSize: '11px',
                  color: task.done ? 'var(--text-disabled)' : 'var(--text-secondary)',
                  textDecoration: task.done ? 'line-through' : 'none',
                  transition: 'color 0.15s',
                }}>
                  {task.text}
                </span>
                {task.carriedOver && !task.done && (
                  <span title={`Carried from ${task.carriedFrom || 'yesterday'}`} style={{
                    fontSize: '8px', color: 'var(--accent)', opacity: 0.7,
                    background: 'var(--accent-dim)', borderRadius: '3px',
                    padding: '1px 3px', flexShrink: 0, fontFamily: 'monospace',
                  }}>↩</span>
                )}
              </div>
              {task.dueTime && !task.done && (
                <span className="font-mono" style={{ fontSize: '9px', color: 'var(--accent)' }}>
                  {task.dueTime}
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Add task row */}
      <div style={{ padding: '4px 6px' }}>
        {!showInput ? (
          <div
            id="btn-add-task"
            className="flex items-center"
            style={{ gap: '8px', cursor: 'pointer', opacity: 0.35, transition: 'opacity 0.15s' }}
            onClick={handleAddClick}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.65')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '0.35')}
          >
            <div style={{
              width: '13px', height: '13px', borderRadius: '3px',
              border: '1.5px dashed var(--border-medium)', flexShrink: 0,
            }} />
            <span className="font-sans" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              Add task...
            </span>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.12 }}
            className="flex items-center" style={{ gap: '8px' }}
          >
            <div style={{
              width: '13px', height: '13px', borderRadius: '3px',
              border: '1.5px dashed var(--border-medium)', flexShrink: 0,
            }} />
            <input
              ref={inputRef}
              id="task-input"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleSubmit}
              placeholder="New task..."
              style={{
                background: 'var(--acrylic-raised)',
                border: '0.5px solid var(--border-subtle)',
                borderRadius: '5px',
                color: 'var(--text-primary)',
                fontSize: '11px', fontFamily: 'Inter, sans-serif',
                padding: '3px 8px', outline: 'none', flex: 1, minWidth: 0,
              }}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}
export default React.memo(TaskList);
