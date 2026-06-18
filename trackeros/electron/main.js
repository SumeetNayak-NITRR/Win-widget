'use strict';

const { app, BrowserWindow, ipcMain, globalShortcut, screen, Notification, dialog } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

const isDev = process.env.NODE_ENV === 'development';


let mainWin = null;
let statsWin = null;
let tray = null;
let store = null;

let originalBounds = null;
let isMini = false;
let isSetupMode = false;

function storeGet(key, def) { return store ? store.get(key, def) : def; }
function storeSet(key, val) { if (store) store.set(key, val); }

const DEFAULT_FULL_WIDTH = 268;
const DEFAULT_FULL_HEIGHT = 580;

function setMiniMode(mini) {
  if (!mainWin || isMini === mini) return;
  isMini = mini;

  if (mini) {
    const currentBounds = mainWin.getBounds();
    // Only capture original bounds if we are currently in full size
    if (currentBounds.width >= DEFAULT_FULL_WIDTH && currentBounds.height >= DEFAULT_FULL_HEIGHT) {
      originalBounds = currentBounds;
    }
    
    const miniBounds = storeGet('settings.miniBounds', null);
    
    let targetBounds;
    if (miniBounds && typeof miniBounds.x === 'number') {
      targetBounds = miniBounds;
    } else {
      const display = screen.getDisplayNearestPoint({ x: (originalBounds || currentBounds).x, y: (originalBounds || currentBounds).y });
      const miniWidth = 240;
      const miniHeight = 85; 
      const x = display.workArea.x + display.workArea.width - miniWidth - 20;
      const y = display.workArea.y + display.workArea.height - miniHeight - 20;
      targetBounds = { x, y, width: miniWidth, height: miniHeight };
    }

    mainWin.webContents.send('view-state-change', 'mini');
    mainWin.setResizable(true); // Allow resizing in mini mode
    mainWin.setMinimumSize(150, 60);
    mainWin.setBounds(targetBounds, true);
  } else {
    mainWin.webContents.send('view-state-change', 'full');
    mainWin.setResizable(false);
    mainWin.setMinimumSize(DEFAULT_FULL_WIDTH, DEFAULT_FULL_HEIGHT);
    
    if (originalBounds) {
      mainWin.setBounds({
        x: originalBounds.x,
        y: originalBounds.y,
        width: DEFAULT_FULL_WIDTH,
        height: DEFAULT_FULL_HEIGHT
      }, true);
    } else {
      mainWin.setBounds({ width: DEFAULT_FULL_WIDTH, height: DEFAULT_FULL_HEIGHT }, true);
      mainWin.center();
    }
    mainWin.focus();
  }
}

let registeredHotkey = null;

function toggleWidgetVisibility() {
  if (!mainWin) return;
  if (mainWin.isVisible()) {
    if (!mainWin.isFocused()) {
      mainWin.focus();
      setMiniMode(false);
    } else {
      mainWin.hide();
    }
  } else {
    mainWin.show();
    setMiniMode(false);
    mainWin.focus();
  }
}

function registerGlobalHotkey(shortcut) {
  const oldHotkey = registeredHotkey;
  if (oldHotkey) {
    globalShortcut.unregister(oldHotkey);
  }
  
  try {
    const success = globalShortcut.register(shortcut, toggleWidgetVisibility);
    if (success) {
      registeredHotkey = shortcut;
      return true;
    } else {
      // Re-register old hotkey
      if (oldHotkey) {
        globalShortcut.register(oldHotkey, toggleWidgetVisibility);
      }
      return false;
    }
  } catch (err) {
    console.error('Failed to register global hotkey:', shortcut, err);
    if (oldHotkey) {
      try {
        globalShortcut.register(oldHotkey, toggleWidgetVisibility);
      } catch (e) {}
    }
    return false;
  }
}

function createWindows() {
  const savedX = storeGet('settings.windowX', null);
  const savedY = storeGet('settings.windowY', null);

  let finalX = (typeof savedX === 'number') ? savedX : undefined;
  let finalY = (typeof savedY === 'number') ? savedY : undefined;

  if (typeof savedX === 'number' && typeof savedY === 'number') {
    const displays = screen.getAllDisplays();
    const isOnScreen = displays.some(display => {
      const bounds = display.bounds;
      return savedX >= bounds.x && savedX < bounds.x + bounds.width &&
             savedY >= bounds.y && savedY < bounds.y + bounds.height;
    });
    if (!isOnScreen) {
      const primaryDisplay = screen.getPrimaryDisplay();
      finalX = primaryDisplay.workArea.x + primaryDisplay.workArea.width - DEFAULT_FULL_WIDTH - 20;
      finalY = primaryDisplay.workArea.y + primaryDisplay.workArea.height - DEFAULT_FULL_HEIGHT - 20;
    }
  }

  // ─── Main Widget Window (Fluent Acrylic) ─────────────────────────
  mainWin = new BrowserWindow({
    width: DEFAULT_FULL_WIDTH,
    height: DEFAULT_FULL_HEIGHT,
    x: finalX,
    y: finalY,
    frame: false,
    transparent: false,
    backgroundColor: '#111111',
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    show: !process.argv.includes('--hidden'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    mainWin.loadURL('http://localhost:5173');
  } else {
    mainWin.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWin.on('close', (e) => { e.preventDefault(); mainWin.hide(); });


  let isSnapping = false;
  const saveBounds = () => {
    if (isSnapping || isSetupMode) return;
    isSnapping = true;
    try {
      const bounds = mainWin.getBounds();
      const display = screen.getDisplayNearestPoint({ x: bounds.x, y: bounds.y });
      const area = display.workArea;
      const SNAP_THRESHOLD = 20;
      
      let newX = bounds.x;
      let newY = bounds.y;
      
      if (Math.abs(bounds.x - area.x) < SNAP_THRESHOLD) {
        newX = area.x;
      } else if (Math.abs((bounds.x + bounds.width) - (area.x + area.width)) < SNAP_THRESHOLD) {
        newX = area.x + area.width - bounds.width;
      }
      
      if (Math.abs(bounds.y - area.y) < SNAP_THRESHOLD) {
        newY = area.y;
      } else if (Math.abs((bounds.y + bounds.height) - (area.y + area.height)) < SNAP_THRESHOLD) {
        newY = area.y + area.height - bounds.height;
      }
      
      if (newX !== bounds.x || newY !== bounds.y) {
        mainWin.setBounds({ x: newX, y: newY, width: bounds.width, height: bounds.height }, true);
      }
      
      if (isMini) {
        storeSet('settings.miniBounds', { x: newX, y: newY, width: bounds.width, height: bounds.height });
      } else {
        storeSet('settings.windowX', newX);
        storeSet('settings.windowY', newY);
      }
    } finally {
      isSnapping = false;
    }
  };

  let boundsTimeout = null;
  const debouncedSaveBounds = () => {
    if (boundsTimeout) clearTimeout(boundsTimeout);
    boundsTimeout = setTimeout(saveBounds, 300);
  };

  mainWin.on('moved', debouncedSaveBounds);
  mainWin.on('resized', debouncedSaveBounds);

  // Auto-minimize on blur with 200ms debounce
  let blurTimeout = null;
  mainWin.on('blur', () => {
    if (isSetupMode) return; // Do not auto-minimize during the setup wizard
    if (blurTimeout) clearTimeout(blurTimeout);
    blurTimeout = setTimeout(() => {
      if (!mainWin.isFocused() && (!statsWin || !statsWin.isVisible() || !statsWin.isFocused())) {
        setMiniMode(true);
      }
    }, 200);
  });
  mainWin.on('focus', () => {
    if (blurTimeout) clearTimeout(blurTimeout);
  });
}

function positionStatsWindow() {
  if (!mainWin || !statsWin) return;
  const bounds = isMini && originalBounds ? originalBounds : mainWin.getBounds();
  statsWin.setPosition(bounds.x + bounds.width + 16, bounds.y);
}

function fmtDateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function toMin(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function logBlockActivity(block, status) {
  if (!block) return;
  const key = fmtDateKey(new Date());
  const dayLog = storeGet(`activity.${key}`, []);
  // Avoid duplicate entries for same block+status
  const alreadyLogged = dayLog.some(a => a.blockId === block.id && a.status === status);
  if (!alreadyLogged) {
    dayLog.push({
      blockId: block.id,
      category: block.category,
      label: block.label,
      duration_min: toMin(block.end) - toMin(block.start),
      status,
      completedAt: new Date().toISOString(),
    });
    storeSet(`activity.${key}`, dayLog);
  }
}

function saveLog() {
  const today = new Date();
  const key = fmtDateKey(today);
  
  const tasks = storeGet(`tasks.${key}`, []);
  const tasksTotal = tasks.length;
  const tasksDone  = tasks.filter(t => t.done).length;
  
  const routine = storeGet(`routine_${key}`, []);
  const blocksTotal = routine.length;
  const blocksDone = routine.filter(b => b.status === 'done').length;
  
  const categoryTime = {};
  routine.filter(b => b.status === 'done').forEach(b => {
    const dur = toMin(b.end) - toMin(b.start);
    categoryTime[b.category] = (categoryTime[b.category] || 0) + dur;
  });
  
  storeSet(`logs.${key}`, { tasksTotal, tasksDone, blocksTotal, blocksDone, categoryTime });

  // Calculate Streak (>=50% blocks done counts as a streak day)
  let streak = 0;
  let d = new Date();
  let checkingToday = true;
  
  while (true) {
    const k = fmtDateKey(d);
    const log = storeGet(`logs.${k}`);
    
    if (log && log.blocksTotal > 0 && (log.blocksDone / log.blocksTotal >= 0.5)) {
      streak++;
      d.setDate(d.getDate() - 1);
      checkingToday = false;
    } else {
      if (checkingToday) {
        d.setDate(d.getDate() - 1);
        checkingToday = false;
        continue;
      }
      break;
    }
  }
  storeSet('settings.streak', streak);
  if (mainWin) mainWin.webContents.send('streak-update', streak);
}

function registerIPC() {
  ipcMain.handle('is-mini-mode', () => isMini);
  ipcMain.handle('get-tasks', (_, date) => {
    let todayTasks = storeGet(`tasks.${date}`);
    if (!todayTasks) {
      todayTasks = [];
      // Find previous days to migrate undone tasks
      const allTasks = storeGet('tasks', {});
      const previousDates = Object.keys(allTasks).filter(k => k < date).sort().reverse();
      if (previousDates.length > 0) {
        const lastDate = previousDates[0];
        const lastTasks = allTasks[lastDate] || [];
        const undone = lastTasks.filter(t => !t.done).map(t => ({
          ...t,
          carriedOver: true,
          carriedFrom: lastDate,
        }));
        todayTasks = undone;
      }
      storeSet(`tasks.${date}`, todayTasks);
    }
    return todayTasks;
  });
  ipcMain.handle('save-tasks',  (_, date, tasks) => { storeSet(`tasks.${date}`, tasks); return true; });
  ipcMain.handle('get-logs',    ()               => storeGet('logs', {}));
  ipcMain.handle('get-startup-status', () => storeGet('settings.openAtLogin', true));
  ipcMain.handle('set-startup-status', (_, val) => {
    storeSet('settings.openAtLogin', val);
    app.setLoginItemSettings({
      openAtLogin: val,
      path: app.getPath('exe'),
      args: []
    });
    return true;
  });
  ipcMain.handle('get-hotkey', () => storeGet('settings.hotkey', 'Ctrl+Shift+W'));
  ipcMain.handle('set-hotkey', (_, hotkey) => {
    const success = registerGlobalHotkey(hotkey);
    if (success) {
      storeSet('settings.hotkey', hotkey);
    }
    return success;
  });
  ipcMain.handle('get-sound-alerts', () => storeGet('settings.soundAlerts', true));
  ipcMain.handle('set-sound-alerts', (_, val) => {
    storeSet('settings.soundAlerts', val);
    return true;
  });
  ipcMain.handle('export-data', async () => {
    if (!mainWin) return false;
    const { filePath } = await dialog.showSaveDialog(mainWin, {
      title: 'Export TrackerOS Backup',
      defaultPath: `tracker_backup_${new Date().toISOString().slice(0,10)}.json`,
      filters: [{ name: 'JSON Backup', extensions: ['json'] }]
    });
    if (!filePath) return false;
    try {
      const fs = require('fs');
      const data = store ? store.store : {};
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
      return true;
    } catch (err) {
      console.error('Failed to export store data:', err);
      return false;
    }
  });
  ipcMain.handle('import-data', async () => {
    if (!mainWin) return false;
    const { filePaths } = await dialog.showOpenDialog(mainWin, {
      title: 'Import TrackerOS Backup',
      filters: [{ name: 'JSON Backup', extensions: ['json'] }],
      properties: ['openFile']
    });
    if (!filePaths || filePaths.length === 0) return false;
    try {
      const fs = require('fs');
      const content = fs.readFileSync(filePaths[0], 'utf-8');
      const data = JSON.parse(content);
      if (typeof data !== 'object' || data === null) {
        return { success: false, error: 'Invalid backup file format.' };
      }
      // Validate required keys exist and have correct types
      const REQUIRED_KEYS = ['settings', 'templates', 'tasks'];
      const hasAllRequired = REQUIRED_KEYS.every(k => k in data);
      if (!hasAllRequired) {
        return { success: false, error: 'File is missing required TrackerOS fields (settings, templates, tasks). This may not be a valid TrackerOS backup.' };
      }
      if (typeof data.settings !== 'object' || data.settings === null ||
          typeof data.templates !== 'object' || data.templates === null ||
          typeof data.tasks !== 'object' || data.tasks === null) {
        return { success: false, error: 'Backup data has invalid types for settings, templates, or tasks.' };
      }
      if (store) {
        store.clear();
        for (const [key, value] of Object.entries(data)) {
          store.set(key, value);
        }
      }
      return { success: true };
    } catch (err) {
      console.error('Failed to import store data:', err);
      return { success: false, error: err.message };
    }
  });
  
  // Daily Setup
  ipcMain.handle('get-templates', () => storeGet('templates', {}));
  ipcMain.handle('save-templates', (_, temps) => { storeSet('templates', temps); return true; });
  ipcMain.handle('get-colors', () => {
    const stored = storeGet('colors', null);
    if (stored) return stored;
    // Build defaults from categories
    const cats = storeGet('categories', []);
    const colors = {};
    cats.forEach(c => { colors[c.id] = c.color; });
    return colors;
  });
  ipcMain.handle('save-colors', (_, colors) => { storeSet('colors', colors); return true; });
  ipcMain.handle('get-daily-routine', (_, date) => storeGet(`routine_${date}`, null));
  ipcMain.handle('save-daily-routine', (_, date, r) => { 
    storeSet(`routine_${date}`, r); 
    saveLog(); // Re-compute logs immediately on every save
    return true; 
  });
  ipcMain.handle('get-activity', (_, date) => storeGet(`activity.${date}`, []));
  ipcMain.on('log-block-activity', (_, block, status) => {
    logBlockActivity(block, status);
    saveLog(); // Keep logs in sync
  });
  ipcMain.handle('get-setup-state', () => storeGet('settings.lastSetupDate', null));
  ipcMain.handle('get-streak', () => storeGet('settings.streak', 0));
  
  ipcMain.handle('get-goals', () => storeGet('goals', []));
  ipcMain.handle('save-goals', (_, data) => { storeSet('goals', data); return true; });
  ipcMain.handle('get-review-week', () => storeGet('settings.lastReviewWeek', null));
  ipcMain.handle('set-review-week', (_, weekStr) => { storeSet('settings.lastReviewWeek', weekStr); return true; });

  // Schedule config (day-of-week → template name)
  ipcMain.handle('get-schedule-config', () => storeGet('scheduleConfig', {}));
  ipcMain.handle('save-schedule-config', (_, cfg) => { storeSet('scheduleConfig', cfg); return true; });

  // Categories
  ipcMain.handle('get-categories', () => storeGet('categories', []));
  ipcMain.handle('save-categories', (_, cats) => { storeSet('categories', cats); return true; });

  ipcMain.on('set-setup-mode', () => {
    isSetupMode = true;
  });

  ipcMain.on('finish-setup', () => {
    isSetupMode = false;
    const today = new Date();
    const key = fmtDateKey(today);
    storeSet('settings.lastSetupDate', key);
    if (mainWin) mainWin.focus();
  });

  ipcMain.on('win-minimize', () => setMiniMode(true));
  ipcMain.on('win-close',    () => mainWin && mainWin.hide());
  function getOrCreateStatsWin() {
    if (statsWin) return statsWin;
    statsWin = new BrowserWindow({
      width: 380,
      height: 500,
      frame: false,
      transparent: true,
      backgroundMaterial: 'acrylic',
      resizable: false,
      skipTaskbar: true,
      show: false,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
      },
    });
    if (isDev) {
      statsWin.loadURL('http://localhost:5173/#/stats');
    } else {
      statsWin.loadFile(path.join(__dirname, '../dist/index.html'), { hash: 'stats' });
    }
    statsWin.on('close', (e) => { e.preventDefault(); statsWin.hide(); });
    return statsWin;
  }

  ipcMain.on('stats-close',  () => statsWin && statsWin.hide());
  ipcMain.on('open-stats',   () => { 
    getOrCreateStatsWin();
    positionStatsWindow(); 
    statsWin.show(); 
    statsWin.focus(); 
    statsWin.webContents.send('stats-refresh'); 
  });
  
  ipcMain.on('widget-expand', () => {
    setMiniMode(false);
  });
}

app.whenReady().then(async () => {
  const { default: Store } = await import('electron-store');
  
  const DEFAULT_TEMPLATES = {
    Weekday: [
      { id: 'r1',  label: 'Morning Run + Stretch',  start: '06:00', end: '06:45', category: 'fitness' },
      { id: 'r2',  label: 'Breakfast + Oats',        start: '07:00', end: '07:30', category: 'health'  },
      { id: 'r3',  label: 'DSA Practice · A2Z',      start: '09:00', end: '11:00', category: 'study'   },
      { id: 'r4',  label: 'Mining Engg. Study',       start: '11:30', end: '13:00', category: 'study'   },
      { id: 'r5',  label: 'Lunch + Rest',             start: '13:00', end: '14:00', category: 'health'  },
      { id: 'r6',  label: 'English Communication',    start: '14:30', end: '15:30', category: 'skill'   },
      { id: 'r7',  label: 'Football Practice',        start: '16:00', end: '17:30', category: 'sport'   },
      { id: 'r8',  label: 'Evening Cooldown',         start: '17:30', end: '18:00', category: 'fitness' },
      { id: 'r9',  label: 'Dinner + Downtime',        start: '19:30', end: '20:30', category: 'health'  },
      { id: 'r10', label: 'LifeOS / Dev Work',        start: '21:00', end: '22:30', category: 'dev'     },
      { id: 'r11', label: 'Sleep Prep',               start: '23:00', end: '23:30', category: 'health'  },
    ],
    Weekend: [
      { id: 'w1',  label: 'Late Wakeup + Rest',       start: '08:00', end: '09:30', category: 'health'  },
      { id: 'w2',  label: 'Heavy Breakfast',          start: '09:30', end: '10:30', category: 'health'  },
      { id: 'w3',  label: 'Weekly Review / Planning', start: '11:00', end: '12:30', category: 'dev'     },
      { id: 'w4',  label: 'Lunch + Movie',            start: '13:00', end: '15:30', category: 'health'  },
      { id: 'w5',  label: 'Football / Outdoor',       start: '16:00', end: '18:00', category: 'sport'   },
      { id: 'w6',  label: 'Dinner Out',               start: '19:30', end: '21:30', category: 'health'  },
      { id: 'w7',  label: 'Downtime',                 start: '22:00', end: '23:30', category: 'health'  },
    ],
    Other: []
  };

  store = new Store({
    defaults: {
      templates: DEFAULT_TEMPLATES,
      tasks: {},
      logs: {},
      settings: { hotkey: 'Ctrl+Shift+W', windowX: null, windowY: null, lastSetupDate: null, openAtLogin: true, soundAlerts: true, lastReviewWeek: null },
      goals: [],
      scheduleConfig: { Mon: 'Weekday', Tue: 'Weekday', Wed: 'Weekday', Thu: 'Weekday', Fri: 'Weekday', Sat: 'Weekend', Sun: 'Weekend' },
      categories: [
        { id: 'study',   label: 'Study',   color: '#4d8eff', emoji: '📚' },
        { id: 'fitness', label: 'Fitness', color: '#22c55e', emoji: '🏃' },
        { id: 'sport',   label: 'Sport',   color: '#f97316', emoji: '⚽' },
        { id: 'skill',   label: 'Skill',   color: '#a78bfa', emoji: '🎯' },
        { id: 'health',  label: 'Health',  color: '#f59e0b', emoji: '🥗' },
        { id: 'dev',     label: 'Dev',     color: '#06b6d4', emoji: '💻' },
        { id: 'work',    label: 'Work',    color: '#6366f1', emoji: '💼' },
        { id: 'other',   label: 'Other',   color: '#94a3b8', emoji: '📌' },
      ]
    },
  });

  const openAtLogin = storeGet('settings.openAtLogin', true);
  app.setLoginItemSettings({
    openAtLogin: openAtLogin,
    path: app.getPath('exe'),
    args: []
  });

  if (!isDev) {
    autoUpdater.checkForUpdatesAndNotify();
    autoUpdater.on('update-downloaded', () => {
      if (mainWin) mainWin.webContents.send('update-ready');
    });
    ipcMain.on('restart-app', () => {
      autoUpdater.quitAndInstall();
    });
  }

  createWindows();
  registerIPC();

  const { setupTray } = require('./tray');
  tray = setupTray(app, mainWin, statsWin);

  const activeHotkey = storeGet('settings.hotkey', 'Ctrl+Shift+W');
  registerGlobalHotkey(activeHotkey);

  let lastDate = new Date().getDate();
  let lastNotifiedBlock = null;
  let lastNotifiedWarning = null;

  function checkNotifications() {
    const today = new Date();
    const dateKey = fmtDateKey(today);
    const routine = storeGet(`routine_${dateKey}`, []);
    if (!routine || routine.length === 0) return;

    const nm = today.getHours() * 60 + today.getMinutes();
    
    const current = routine.find(b => {
      const [hs, ms] = b.start.split(':').map(Number);
      const [he, me] = b.end.split(':').map(Number);
      return (hs * 60 + ms) <= nm && nm < (he * 60 + me);
    });

    if (current) {
      if (lastNotifiedBlock !== current.id) {
        if (Notification.isSupported()) {
          new Notification({ title: 'TrackerOS', body: `Now starting: ${current.label}`, silent: false }).show();
        }
        lastNotifiedBlock = current.id;
      }

      const [he, me] = current.end.split(':').map(Number);
      const endMin = he * 60 + me;
      if (endMin - nm === 5 && lastNotifiedWarning !== current.id) {
        if (Notification.isSupported()) {
          new Notification({ title: 'TrackerOS', body: `5 minutes left in ${current.label}`, silent: true }).show();
        }
        lastNotifiedWarning = current.id;
      }
    } else {
      lastNotifiedBlock = null;
    }
  }

  setInterval(() => {
    const n = new Date();
    if (n.getDate() !== lastDate) { saveLog(); lastDate = n.getDate(); }
    checkNotifications();
  }, 10000); // Check every 10 seconds for notifications
});

app.on('before-quit', () => { saveLog(); globalShortcut.unregisterAll(); });
app.on('window-all-closed', () => { /* keep alive in tray */ });
