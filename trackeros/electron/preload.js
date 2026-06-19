'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('tracker', {
  minimize:   ()             => ipcRenderer.send('win-minimize'),
  close:      ()             => ipcRenderer.send('win-close'),
  closeStats: ()             => ipcRenderer.send('stats-close'),
  openStats:  ()             => ipcRenderer.send('open-stats'),
  expandWidget: ()           => ipcRenderer.send('widget-expand'),
  isMiniMode:   ()           => ipcRenderer.invoke('is-mini-mode'),
  getTasks:   (date)         => ipcRenderer.invoke('get-tasks', date),
  saveTasks:  (date, tasks)  => ipcRenderer.invoke('save-tasks', date, tasks),
  getLogs:    ()             => ipcRenderer.invoke('get-logs'),
  getActivity:(date)         => ipcRenderer.invoke('get-activity', date),
  logActivity:(block,status) => ipcRenderer.send('log-block-activity', block, status),
  getRoutine: ()             => ipcRenderer.invoke('get-routine'),
  getStartupStatus: ()       => ipcRenderer.invoke('get-startup-status'),
  setStartupStatus: (val)    => ipcRenderer.invoke('set-startup-status', val),
  getHotkey:        ()       => ipcRenderer.invoke('get-hotkey'),
  setHotkey:        (hotkey) => ipcRenderer.invoke('set-hotkey', hotkey),
  getSoundAlertsStatus: ()   => ipcRenderer.invoke('get-sound-alerts'),
  setSoundAlertsStatus: (val)=> ipcRenderer.invoke('set-sound-alerts', val),
  exportData:           ()   => ipcRenderer.invoke('export-data'),
  importData:           ()   => ipcRenderer.invoke('import-data'),
  getGoals:             ()   => ipcRenderer.invoke('get-goals'),
  saveGoals:            (g)  => ipcRenderer.invoke('save-goals', g),
  
  // Daily Setup IPC
  getTemplates:  () => ipcRenderer.invoke('get-templates'),
  saveTemplates: (t) => ipcRenderer.invoke('save-templates', t),
  getColors:     () => ipcRenderer.invoke('get-colors'),
  saveColors:    (c) => ipcRenderer.invoke('save-colors', c),
  getDailyRoutine: (date)    => ipcRenderer.invoke('get-daily-routine', date),
  saveDailyRoutine:(date, r) => ipcRenderer.invoke('save-daily-routine', date, r),
  getSetupState: ()          => ipcRenderer.invoke('get-setup-state'),
  finishSetup:   ()          => ipcRenderer.send('finish-setup'),
  getStreak:     ()          => ipcRenderer.invoke('get-streak'),
  getDirectionLayer: (blockLabel)      => ipcRenderer.invoke('get-direction-layer', blockLabel),
  saveDirectionLayer: (blockLabel, data) => ipcRenderer.invoke('save-direction-layer', blockLabel, data),
  getScheduleConfig:  ()               => ipcRenderer.invoke('get-schedule-config'),
  saveScheduleConfig: (cfg)            => ipcRenderer.invoke('save-schedule-config', cfg),
  getCategories:      ()               => ipcRenderer.invoke('get-categories'),
  saveCategories:     (cats)           => ipcRenderer.invoke('save-categories', cats),
  
  onViewStateChange: (callback) => {
    const sub = (_, state) => callback(state);
    ipcRenderer.on('view-state-change', sub);
    return () => ipcRenderer.removeListener('view-state-change', sub);
  },
  onStreakUpdate: (callback) => {
    const sub = (_, streak) => callback(streak);
    ipcRenderer.on('streak-update', sub);
    return () => ipcRenderer.removeListener('streak-update', sub);
  },
  onSkipCurrentBlock: (callback) => {
    const sub = () => callback();
    ipcRenderer.on('skip-current-block', sub);
    return () => ipcRenderer.removeListener('skip-current-block', sub);
  },
  onStatsRefresh: (callback) => {
    const sub = () => callback();
    ipcRenderer.on('stats-refresh', sub);
    return () => ipcRenderer.removeListener('stats-refresh', sub);
  },
  onUpdateReady: (callback) => {
    const sub = () => callback();
    ipcRenderer.on('update-ready', sub);
    return () => ipcRenderer.removeListener('update-ready', sub);
  },
  restartAndUpdate: () => ipcRenderer.send('restart-app'),
  setSetupMode: () => ipcRenderer.send('set-setup-mode'),
});
