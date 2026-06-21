import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import TemplateEditor from './TemplateEditor';
import ScheduleConfig from './ScheduleConfig';

export default function SettingsPanel({ onClose, onViewOnboarding }) {
  const [templates, setTemplates] = useState({});
  const [colors, setColors] = useState({});
  const [categories, setCategories] = useState([]);
  const [startupEnabled, setStartupEnabled] = useState(true);
  const [soundAlertsEnabled, setSoundAlertsEnabled] = useState(true);
  const [hotkey, setHotkey] = useState('Ctrl+Shift+W');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingText, setRecordingText] = useState('');
  const [activeTab, setActiveTab] = useState('general');
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#6366f1');
  const [addingCat, setAddingCat] = useState(false);

  useEffect(() => {
    Promise.all([
      window.tracker?.getTemplates?.() || Promise.resolve({}),
      window.tracker?.getColors?.() || Promise.resolve({}),
      window.tracker?.getCategories?.() || Promise.resolve([]),
      window.tracker?.getStartupStatus?.() !== undefined ? window.tracker.getStartupStatus() : Promise.resolve(true),
      window.tracker?.getHotkey?.() || Promise.resolve('Ctrl+Shift+W'),
      window.tracker?.getSoundAlertsStatus?.() !== undefined ? window.tracker.getSoundAlertsStatus() : Promise.resolve(true)
    ]).then(([t, c, cats, s, h, sAlerts]) => {
      setTemplates(t || {});
      setColors(c || {});
      setCategories(cats || []);
      setStartupEnabled(s !== undefined ? s : true);
      setHotkey(h || 'Ctrl+Shift+W');
      setSoundAlertsEnabled(sAlerts !== undefined ? sAlerts : true);
    });
  }, []);

  const saveColors = (newColors) => {
    setColors(newColors);
    window.tracker?.saveColors?.(newColors);
  };

  const handleToggleStartup = (e) => {
    const val = e.target.checked;
    setStartupEnabled(val);
    window.tracker?.setStartupStatus?.(val);
  };

  const handleToggleSoundAlerts = (e) => {
    const val = e.target.checked;
    setSoundAlertsEnabled(val);
    window.tracker?.setSoundAlertsStatus?.(val);
  };

  const handleKeyDown = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const keys = [];
    if (e.ctrlKey) keys.push('Ctrl');
    if (e.shiftKey) keys.push('Shift');
    if (e.altKey) keys.push('Alt');

    const keyName = e.key;
    if (
      keyName !== 'Control' &&
      keyName !== 'Shift' &&
      keyName !== 'Alt' &&
      keyName !== 'Meta'
    ) {
      let formattedKey = keyName;
      if (keyName === ' ') formattedKey = 'Space';
      else if (keyName.length === 1) formattedKey = keyName.toUpperCase();
      else if (keyName.startsWith('Arrow')) formattedKey = keyName.replace('Arrow', '');
      
      keys.push(formattedKey);
    }

    if (keys.length > 0) {
      setRecordingText(keys.join('+'));
    }
  };

  const handleKeyUp = () => {
    if (recordingText) {
      saveHotkey(recordingText);
      setIsRecording(false);
    }
  };

  const saveHotkey = async (newHotkey) => {
    const success = await window.tracker?.setHotkey?.(newHotkey);
    if (success) {
      setHotkey(newHotkey);
    } else {
      alert(`Failed to register global hotkey "${newHotkey}". It might be invalid or already bound.`);
    }
  };

  const handleExportData = async () => {
    const success = await window.tracker?.exportData?.();
    if (success) {
      alert('Data exported successfully!');
    }
  };

  const handleImportData = async () => {
    if (confirm('Importing data will overwrite your current settings, templates, routine history, and tasks. Are you sure you want to proceed?')) {
      const res = await window.tracker?.importData?.();
      if (res && res.success) {
        alert('Data imported successfully! The application will now reload.');
        window.location.reload();
      } else if (res && res.error) {
        alert(`Failed to import data: ${res.error}`);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="flex flex-col h-full p-3 select-none"
    >
      <div className="flex items-center justify-between mb-4" style={{ WebkitAppRegion: 'drag' }}>
        <h2 className="font-sans font-medium text-[14px] text-[var(--text-primary)]">Settings</h2>
        <button onClick={onClose} className="text-[12px] text-[var(--text-secondary)] hover:text-white transition-colors" style={{ WebkitAppRegion: 'no-drag' }}>
          Done
        </button>
      </div>

      <div className="flex gap-4 mb-4 border-b border-[var(--divider)]" style={{ WebkitAppRegion: 'no-drag', overflowX: 'auto' }}>
        {['general', 'schedules', 'colors'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-1 text-[11px] font-mono uppercase tracking-wider transition-all duration-150 whitespace-nowrap ${activeTab === tab ? 'text-[var(--accent)] border-b border-[var(--accent)] font-semibold' : 'text-[var(--text-disabled)] hover:text-[var(--text-secondary)]'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar" style={{ WebkitAppRegion: 'no-drag' }}>
        {activeTab === 'general' && (
          <div className="flex flex-col gap-3 py-1">
            {/* Startup Toggle */}
            <div className="flex items-center justify-between p-2 rounded bg-white/[0.02] border border-[var(--border-subtle)]">
              <div className="flex flex-col gap-0.5 pr-2">
                <span className="font-sans text-[12px] font-medium text-[var(--text-primary)]">Run on Startup</span>
                <span className="font-sans text-[10px] text-[var(--text-tertiary)] leading-tight">Launch Tracker automatically when you log in.</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={startupEnabled} 
                  onChange={handleToggleStartup}
                  className="sr-only peer"
                />
                <div className="w-8 h-4.5 bg-white/10 rounded-full peer peer-focus:outline-none peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-[var(--accent)]"></div>
              </label>
            </div>

            {/* Sound Alerts Toggle */}
            <div className="flex items-center justify-between p-2 rounded bg-white/[0.02] border border-[var(--border-subtle)]">
              <div className="flex flex-col gap-0.5 pr-2">
                <span className="font-sans text-[12px] font-medium text-[var(--text-primary)]">Sound Alerts</span>
                <span className="font-sans text-[10px] text-[var(--text-tertiary)] leading-tight">Play subtle chimes during routine and timer transitions.</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={soundAlertsEnabled} 
                  onChange={handleToggleSoundAlerts}
                  className="sr-only peer"
                />
                <div className="w-8 h-4.5 bg-white/10 rounded-full peer peer-focus:outline-none peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-[var(--accent)]"></div>
              </label>
            </div>

            {/* Hotkey Rebinding */}
            <div className="flex flex-col gap-2 p-2 rounded bg-white/[0.02] border border-[var(--border-subtle)]">
              <div className="flex flex-col gap-0.5">
                <span className="font-sans text-[12px] font-medium text-[var(--text-primary)]">Global Shortcut</span>
                <span className="font-sans text-[10px] text-[var(--text-tertiary)] leading-tight">Hotkey combination to toggle widget visibility.</span>
              </div>
              <div className="flex gap-2 items-center">
                <div 
                  tabIndex={0}
                  onKeyDown={handleKeyDown}
                  onKeyUp={handleKeyUp}
                  onFocus={() => { setIsRecording(true); setRecordingText(''); }}
                  onBlur={() => setIsRecording(false)}
                  className={`flex-1 h-8 rounded px-2 text-[11px] font-mono flex items-center justify-center border cursor-pointer select-none transition-colors outline-none ${isRecording ? 'border-[var(--accent)] bg-[rgba(76,194,255,0.06)] text-[var(--accent)]' : 'border-[var(--border-medium)] bg-black/20 text-[var(--text-secondary)] hover:border-[var(--text-secondary)]'}`}
                  title="Click and press key combination (e.g. Ctrl+Shift+K)"
                >
                  {isRecording ? (recordingText || 'Press keys...') : hotkey}
                </div>
                {hotkey !== 'Ctrl+Shift+W' && (
                  <button 
                    onClick={() => saveHotkey('Ctrl+Shift+W')}
                    className="text-[10px] font-mono text-[var(--text-tertiary)] hover:text-white transition-colors"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Data Backup */}
            <div className="flex flex-col gap-2 p-2 rounded bg-white/[0.02] border border-[var(--border-subtle)]">
              <div className="flex flex-col gap-0.5">
                <span className="font-sans text-[12px] font-medium text-[var(--text-primary)]">Data Backup</span>
                <span className="font-sans text-[10px] text-[var(--text-tertiary)] leading-tight">Backup your templates, routines, and task data, or restore from a file.</span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handleExportData}
                  className="flex-1 h-7 rounded bg-white/5 border border-[var(--border-medium)] hover:bg-white/10 hover:text-white transition-colors text-[10px] font-sans font-medium text-[var(--text-secondary)]"
                >
                  Export Data
                </button>
                <button 
                  onClick={handleImportData}
                  className="flex-1 h-7 rounded bg-white/5 border border-[var(--border-medium)] hover:bg-white/10 hover:text-white transition-colors text-[10px] font-sans font-medium text-[var(--text-secondary)]"
                >
                  Import Data
                </button>
              </div>
            </div>

            {/* Notification Permission Warning */}
            {typeof window !== 'undefined' && typeof Notification !== 'undefined' && Notification.permission === 'denied' && (
              <div className="p-2.5 rounded bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] text-[#ff7b72] text-[10px] leading-relaxed font-sans">
                ⚠️ Notification permissions are currently blocked in Windows settings. Tracker will not be able to trigger desktop notifications when your routine blocks change.
              </div>
            )}

            {/* View Onboarding */}
            <div className="flex justify-center mt-2">
              <button
                onClick={onViewOnboarding}
                className="text-[9px] font-mono text-[#3a3a3a] hover:text-[#666] transition-colors uppercase tracking-wider"
              >
                View onboarding guide
              </button>
            </div>
          </div>
        )}

        {activeTab === 'schedules' && (
          <div className="flex flex-col gap-5 py-1">
            {/* Template Editor */}
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-disabled)] mb-2">Templates</div>
              <TemplateEditor
                categories={categories}
                onTemplatesChange={t => setTemplates(t)}
              />
            </div>

            {/* Divider */}
            <div style={{ height: '0.5px', background: 'var(--divider)' }} />

            {/* Auto-Schedule */}
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-disabled)] mb-2">Auto-Schedule</div>
              <ScheduleConfig templates={templates} />
            </div>
          </div>
        )}

        {activeTab === 'colors' && (
          <div className="flex flex-col gap-3">
            <div className="text-[10px] text-[var(--text-disabled)] mb-1">Manage your activity categories and their colors.</div>

            {/* Category list */}
            {categories.map((cat, i) => (
              <div key={cat.id} className="flex items-center justify-between gap-2 p-2 rounded bg-white/[0.02] border border-[var(--border-subtle)]">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <input
                    type="color" value={cat.color}
                    onChange={e => {
                      const updated = categories.map((c, j) => j === i ? { ...c, color: e.target.value } : c);
                      setCategories(updated);
                      window.tracker?.saveCategories?.(updated);
                      // Keep colors map in sync
                      const newColors = {};
                      updated.forEach(c => { newColors[c.id] = c.color; });
                      setColors(newColors);
                      window.tracker?.saveColors?.(newColors);
                    }}
                    className="w-[20px] h-[20px] rounded border-none cursor-pointer bg-transparent flex-shrink-0"
                  />
                  <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-secondary)] truncate">{cat.emoji} {cat.label}</span>
                </div>
                <button
                  onClick={() => {
                    const updated = categories.filter((_, j) => j !== i);
                    setCategories(updated);
                    window.tracker?.saveCategories?.(updated);
                  }}
                  className="text-[10px] text-[var(--text-tertiary)] hover:text-red-400 transition-colors flex-shrink-0"
                  title="Delete category"
                >✕</button>
              </div>
            ))}

            {/* Add new category */}
            {addingCat ? (
              <div className="flex flex-col gap-2 p-2 rounded bg-white/[0.03] border border-[var(--accent)]">
                <div className="flex gap-2 items-center">
                  <input type="color" value={newCatColor} onChange={e => setNewCatColor(e.target.value)}
                    className="w-[24px] h-[24px] rounded border-none cursor-pointer flex-shrink-0" />
                  <input type="text" value={newCatName} onChange={e => setNewCatName(e.target.value)}
                    placeholder="Category name" maxLength={20} autoFocus
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        const id = newCatName.trim().toLowerCase().replace(/\s+/g, '_');
                        if (!id) return;
                        const cat = { id, label: newCatName.trim(), color: newCatColor, emoji: '📌' };
                        const updated = [...categories, cat];
                        setCategories(updated);
                        window.tracker?.saveCategories?.(updated);
                        const newColors = {};
                        updated.forEach(c => { newColors[c.id] = c.color; });
                        setColors(newColors);
                        window.tracker?.saveColors?.(newColors);
                        setNewCatName(''); setAddingCat(false);
                      }
                      if (e.key === 'Escape') setAddingCat(false);
                    }}
                    className="flex-1 bg-transparent border-b border-[var(--divider)] text-[12px] text-[var(--text-primary)] px-1 py-0.5 focus:border-[var(--accent)] outline-none"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setAddingCat(false)} className="text-[10px] px-3 py-1 rounded bg-white/5 border border-[var(--border-subtle)] text-[var(--text-tertiary)] cursor-pointer hover:text-white">Cancel</button>
                  <button
                    onClick={() => {
                      const id = newCatName.trim().toLowerCase().replace(/\s+/g, '_');
                      if (!id) return;
                      const cat = { id, label: newCatName.trim(), color: newCatColor, emoji: '📌' };
                      const updated = [...categories, cat];
                      setCategories(updated);
                      window.tracker?.saveCategories?.(updated);
                      const newColors = {};
                      updated.forEach(c => { newColors[c.id] = c.color; });
                      setColors(newColors);
                      window.tracker?.saveColors?.(newColors);
                      setNewCatName(''); setAddingCat(false);
                    }}
                    className="text-[10px] px-3 py-1 rounded bg-[var(--accent)] text-black font-semibold cursor-pointer"
                  >Add</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setAddingCat(true)}
                className="w-full py-2 rounded border border-dashed border-[var(--border-subtle)] text-[var(--text-tertiary)] hover:text-white hover:border-[var(--border-medium)] text-[11px] transition-colors"
              >+ Add Category</button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
