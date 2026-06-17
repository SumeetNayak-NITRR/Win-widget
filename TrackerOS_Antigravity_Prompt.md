# TrackerOS — Windows 11 Productivity Widget
## Master Build Prompt for Antigravity IDE

---

## ROLE & GOAL

You are an expert Electron + React developer. Build a Windows 11 desktop productivity widget called **TrackerOS**. It is a hybrid routine tracker with fixed daily time blocks, floating tasks, stats panel, and system tray integration. The app must work exactly as described below. Follow every specification precisely.

---

## TECH STACK

| Layer | Tool |
|---|---|
| Runtime | Electron (latest stable) |
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS (custom config) |
| Animations | Framer Motion |
| Persistence | electron-store (v8+) |
| Packaging | electron-builder |
| Language | JavaScript (ES modules) |

Install these packages:
```
npm create vite@latest trackeros -- --template react
cd trackeros
npm install electron electron-store framer-motion electron-builder
npm install -D concurrently wait-on cross-env
```

---

## PROJECT FILE STRUCTURE

```
trackeros/
├── electron/
│   ├── main.js          ← Main process (windows, tray, shortcuts)
│   ├── tray.js          ← System tray setup
│   └── preload.js       ← Context bridge (ipcRenderer expose)
├── src/
│   ├── components/
│   │   ├── TitleBar.jsx       ← Draggable window titlebar
│   │   ├── LiveClock.jsx      ← Real-time HH:MM AM/PM + date
│   │   ├── CurrentBlock.jsx   ← Active routine block with progress
│   │   ├── UpcomingList.jsx   ← Next 4 blocks from now
│   │   ├── TaskList.jsx       ← Floating checkable tasks
│   │   ├── DayProgress.jsx    ← Footer: X/Y · Z% bar
│   │   └── StatsPanel.jsx     ← Stats window (Today/Week tabs)
│   ├── hooks/
│   │   ├── useClock.js        ← updates every second via setInterval
│   │   └── useTaskStore.js    ← CRUD for tasks via ipcRenderer
│   ├── data/
│   │   └── routine.js         ← Default routine seed data
│   ├── utils/
│   │   └── time.js            ← toMin(), fmt12(), fmtDate(), blockProgress()
│   ├── App.jsx
│   └── main.jsx
├── assets/
│   └── icon.png               ← App icon (create a simple dark icon)
├── tailwind.config.js
├── vite.config.js
├── package.json
└── electron-builder.yml
```

---

## DESIGN SYSTEM

### Colors (add to tailwind.config.js)

```js
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{jsx,js}'],
  theme: {
    extend: {
      colors: {
        'w-bg':      '#0d0d0d',
        'w-surface': '#131313',
        'w-raised':  '#1b1b1b',
        'w-border':  '#1e1e1e',
        'w-border2': '#262626',
        'w-text':    '#e6e6e6',
        'w-sub':     '#666666',
        'w-faint':   '#2a2a2a',
        'w-accent':  '#4d8eff',
        'w-green':   '#22c55e',
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
}
```

### Typography Rules
- All times and numbers → `font-mono`
- Section labels → `font-mono text-[9px] tracking-[0.22em] uppercase text-w-faint`
- Task names / block names → `font-sans text-[11px] text-w-text`
- Clock display → `font-mono text-[22px] font-semibold text-w-text tracking-tight`
- Accent color (#4d8eff) used ONLY for: current block border, active progress bar, today's bar in week stats, active tab underline, STATS button active state

### Category Colors (used for upcoming block dots)
```js
export const CAT_COLOR = {
  study:   '#4d8eff',
  fitness: '#22c55e',
  sport:   '#f97316',
  skill:   '#a78bfa',
  health:  '#f59e0b',
  dev:     '#06b6d4',
};
```

---

## WINDOW CONFIGURATION

### Main Widget Window (main.js)
```js
const mainWin = new BrowserWindow({
  width: 268,
  height: 580,
  minWidth: 268,
  maxWidth: 268,
  frame: false,
  transparent: true,
  alwaysOnTop: true,
  resizable: false,
  skipTaskbar: true,
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
    contextIsolation: true,
    nodeIntegration: false,
  },
});
```

### Stats Window (main.js)
```js
const statsWin = new BrowserWindow({
  width: 380,
  height: 500,
  frame: false,
  transparent: true,
  resizable: false,
  skipTaskbar: true,
  show: false,
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
    contextIsolation: true,
    nodeIntegration: false,
  },
});
```

### Window Behavior Rules
- On window `close` event → `event.preventDefault()` → hide to tray instead of quitting
- Main widget: position saved to electron-store on move, restored on relaunch
- Stats window: positioned 16px to the right of the main widget automatically

---

## SYSTEM TRAY (tray.js)

```js
// Tray setup
const tray = new Tray(path.join(__dirname, '../assets/icon.png'));
tray.setToolTip('TrackerOS');
tray.setContextMenu(Menu.buildFromTemplate([
  { label: 'Show / Hide', click: () => mainWin.isVisible() ? mainWin.hide() : mainWin.show() },
  { label: 'Stats', click: () => statsWin.show() },
  { type: 'separator' },
  { label: 'Quit TrackerOS', click: () => app.quit() },
]));
tray.on('double-click', () => mainWin.isVisible() ? mainWin.hide() : mainWin.show());
```

### Global Hotkey
```js
globalShortcut.register('Ctrl+Shift+W', () => {
  mainWin.isVisible() ? mainWin.hide() : mainWin.show();
});
```

---

## IPC CHANNELS (preload.js → main.js)

### preload.js
```js
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('tracker', {
  minimize: () => ipcRenderer.send('win-minimize'),
  close:    () => ipcRenderer.send('win-close'),
  openStats: () => ipcRenderer.send('open-stats'),
  getTasks:  (date) => ipcRenderer.invoke('get-tasks', date),
  saveTasks: (date, tasks) => ipcRenderer.invoke('save-tasks', date, tasks),
  getLogs:   () => ipcRenderer.invoke('get-logs'),
  getRoutine: () => ipcRenderer.invoke('get-routine'),
});
```

### main.js IPC Handlers
```js
ipcMain.handle('get-tasks',   (_, date) => store.get(`tasks.${date}`, []));
ipcMain.handle('save-tasks',  (_, date, tasks) => { store.set(`tasks.${date}`, tasks); return true; });
ipcMain.handle('get-logs',    () => store.get('logs', {}));
ipcMain.handle('get-routine', () => store.get('routine', DEFAULT_ROUTINE));
ipcMain.on('win-minimize',    () => mainWin.hide());
ipcMain.on('win-close',       () => mainWin.hide());
ipcMain.on('open-stats',      () => statsWin.show());
```

---

## DATA MODELS

### Routine Block
```js
{
  id: 'string',          // nanoid or uuid
  label: 'string',       // "DSA Practice · A2Z"
  start: 'HH:MM',        // 24-hour: "09:00"
  end:   'HH:MM',        // "11:00"
  category: 'study' | 'fitness' | 'sport' | 'health' | 'skill' | 'dev',
  days: [1,2,3,4,5]      // 0=Sun...6=Sat. Omit = every day.
}
```

### Floating Task
```js
{
  id: 'string',
  text: 'string',
  done: false,
  createdAt: 'ISO-string',
  completedAt: 'ISO-string | null',
}
// Stored in electron-store under: tasks["YYYY-MM-DD"]
```

### Daily Log (auto-saved on app close or midnight)
```js
// store.logs["YYYY-MM-DD"]
{
  tasksTotal: 8,
  tasksDone: 5,
  completionPct: 62,
}
```

### electron-store Root Schema
```js
{
  routine: [...],            // Array of RoutineBlock
  tasks: {
    "2026-06-16": [...],     // Array of Task
  },
  logs: {
    "2026-06-15": { tasksTotal: 8, tasksDone: 7, completionPct: 87 },
  },
  settings: {
    hotkey: "Ctrl+Shift+W",
    windowX: null,
    windowY: null,
  }
}
```

---

## DEFAULT ROUTINE SEED DATA (data/routine.js)

Pre-load this so the app works on first launch:

```js
export const DEFAULT_ROUTINE = [
  { id:'r1',  label:'Morning Run + Stretch',  start:'06:00', end:'06:45', category:'fitness' },
  { id:'r2',  label:'Breakfast + Oats',       start:'07:00', end:'07:30', category:'health'  },
  { id:'r3',  label:'DSA Practice · A2Z',     start:'09:00', end:'11:00', category:'study'   },
  { id:'r4',  label:'Mining Engg. Study',     start:'11:30', end:'13:00', category:'study'   },
  { id:'r5',  label:'Lunch + Rest',           start:'13:00', end:'14:00', category:'health'  },
  { id:'r6',  label:'English Communication',  start:'14:30', end:'15:30', category:'skill'   },
  { id:'r7',  label:'Football Practice',      start:'16:00', end:'17:30', category:'sport'   },
  { id:'r8',  label:'Evening Cooldown',       start:'17:30', end:'18:00', category:'fitness' },
  { id:'r9',  label:'Dinner + Downtime',      start:'19:30', end:'20:30', category:'health'  },
  { id:'r10', label:'LifeOS / Dev Work',      start:'21:00', end:'22:30', category:'dev'     },
  { id:'r11', label:'Sleep Prep',             start:'23:00', end:'23:30', category:'health'  },
];
```

---

## UTILITY FUNCTIONS (utils/time.js)

```js
export const toMin = (t) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

export const fmt12 = (d) => {
  let h = d.getHours(), m = d.getMinutes();
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2,'0')} ${ap}`;
};

export const fmtDate = (d) => {
  const days   = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
};

export const fmtDateKey = (d) =>
  `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

export const fmtTime = (t) => {
  const [h, m] = t.split(':').map(Number);
  const ap = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2,'0')} ${ap}`;
};

export const minsLeft = (end, now) => {
  const diff = toMin(end) - (now.getHours() * 60 + now.getMinutes());
  if (diff <= 0) return 'Ending now';
  if (diff >= 60) return `${Math.floor(diff / 60)}h ${diff % 60}m left`;
  return `${diff}m left`;
};

export const blockProgress = (block, now) => {
  const s = toMin(block.start), e = toMin(block.end);
  const c = now.getHours() * 60 + now.getMinutes();
  return Math.min(100, Math.max(0, Math.round((c - s) / (e - s) * 100)));
};

export const getCurrentBlock = (routine, now) => {
  const nm = now.getHours() * 60 + now.getMinutes();
  return routine.find(b => toMin(b.start) <= nm && nm < toMin(b.end)) || null;
};

export const getUpcoming = (routine, now, count = 4) => {
  const nm = now.getHours() * 60 + now.getMinutes();
  return routine.filter(b => toMin(b.start) > nm).slice(0, count);
};
```

---

## COMPONENT SPECIFICATIONS

### TitleBar.jsx
```
- Three macOS-style dots: #ff5f57 / #febc2e / #28c840
- Center: app name in font-mono 10px tracking-[0.18em] uppercase color #272727
- Right: "STATS" button — toggles Stats window via window.tracker.openStats()
- Entire bar is draggable via CSS: -webkit-app-region: drag
- Buttons NOT draggable: -webkit-app-region: no-drag
- Height: 36px, border-bottom: 0.5px solid #181818
```

### LiveClock.jsx
```
- Left: time in fmt12() → font-mono 22px font-semibold text-w-text tracking-[-1px]
- Right: date in fmtDate() + "NITRR · 2026" → font-mono 10px text-#3a3a3a uppercase text-right
- Updates every second via useClock() hook
- border-bottom: 0.5px solid #181818
- padding: 10px 14px 9px
```

### CurrentBlock.jsx
Props: { block, now }
```
- If block exists:
  - Container: bg-w-surface border-0.5px border-w-border border-l-[2.5px] border-l-w-accent
  - border-radius: 0 6px 6px 0 (sharp left, rounded right)
  - CSS animation: glow pulse 2.5s ease-in-out infinite
    @keyframes glow {
      0%,100% { box-shadow: -3px 0 10px rgba(77,142,255,0.1); }
      50%      { box-shadow: -3px 0 22px rgba(77,142,255,0.3); }
    }
  - Block name: font-sans 13px font-medium text-w-text mb-[3px]
  - Time range: font-mono 10px text-[#454545] mb-[8px]
  - Progress bar: 2px track bg-w-raised, fill bg-w-accent, border-radius 1px
  - Time remaining: font-mono 9px text-w-accent text-right mt-[5px]
  - margin: 2px 10px 8px

- If no block:
  - Dashed border card: border-0.5px dashed border-w-border, border-radius 6px
  - Text: "No active block · free time" font-sans 11px text-w-faint text-center
  - padding: 12px, margin: 2px 10px 8px
```

### UpcomingList.jsx
Props: { routine, now }
```
- Show next 4 blocks after current time
- Each row (48px padding area): flex items-center gap-[9px] px-[8px] py-[5px]
  hover:bg-w-surface border-radius 5px
- Colored dot: 5×5px circle, color from CAT_COLOR[block.category]
- Time: fmtTime(block.start) → font-mono 10px text-[#404040] min-w-[42px]
- Name: font-sans 11px text-[#aaa] flex-1 truncate
- If no upcoming blocks: show "No more blocks today" in text-w-faint
```

### TaskList.jsx
Props: { tasks, onToggle, onAdd }
```
- Each task row: flex items-center gap-[8px] px-[6px] py-[5px] rounded-[5px]
  cursor-pointer hover:bg-w-surface

- Custom checkbox (NOT HTML input):
  - 13×13px div, border-[1.5px] border-[#2a2a2a] rounded-[3px]
  - Done state: bg-w-green border-w-green, show ✓ in black 9px font-bold
  - Framer Motion: animate scale 0.85→1 on toggle, duration 0.12s

- Task text:
  - Not done: font-sans 11px text-[#bbb]
  - Done: font-sans 11px text-[#333] line-through

- "Add task..." row at bottom:
  - 13×13px dashed border box as icon
  - On click: show inline input field below the list
  - Input: bg-w-surface border-w-border rounded text-w-text text-[11px] px-2 py-1
  - On Enter: add task + clear input
  - On Escape: cancel
```

### DayProgress.jsx
Props: { done, total }
```
- Footer bar: border-top 0.5px solid #181818, padding 8px 14px 10px
- Row: flex justify-between mb-[5px]
  - Left: "DAY PROGRESS" → font-mono 9px text-w-faint uppercase tracking-[0.15em]
  - Right: "{done}/{total} · {pct}%" → font-mono 11px text-[#888]
- Progress bar: 2px track bg-[#1a1a1a], fill bg-w-green, rounded, transition width 0.35s
```

### StatsPanel.jsx (Stats Window)
```
Two tabs: TODAY | WEEK
Active tab: text-w-accent border-bottom 2px solid w-accent
Inactive: text-[#2e2e2e], hover text-[#888]

TODAY TAB:
- 2-column grid of stat cards (bg-w-surface border-w-border rounded-[8px] p-[12px]):
  - Card 1: "{done}/{total}" in font-mono 20px font-semibold text-w-green
             "TASKS DONE" label → font-mono 9px text-[#303030] uppercase tracking-[0.15em]
  - Card 2: "{pct}%" in font-mono 20px text-w-accent
             "COMPLETION" label
- Day progress bar (3px, green) below the grid
- Task list: each row shows ✓ (green) or ○ (#282828) + task name

WEEK TAB:
- Title: "THIS WEEK · MMM YYYY" → font-mono 9px text-[#282828] uppercase
- 7 rows (Mon–Sun), each:
  - Header row: day name (left) + "X/Y" count (right)
  - 5px bar below
  - Bar colors:
    - ≥80% done → #22c55e (green)
    - <80% done → #383838 (muted)
    - today → #4d8eff (accent blue)
    - future → 0% width (empty track)
  - "← today" badge next to today's day name in 8px text-w-accent
```

---

## ANIMATIONS (Framer Motion)

```js
// Widget open/show
const widgetVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.18, ease: 'easeOut' } }
};

// Stats panel open
const statsVariants = {
  hidden: { opacity: 0, x: 12 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.2, ease: 'easeOut' } }
};

// Task checkbox toggle
const checkVariants = {
  tap: { scale: 0.85, transition: { duration: 0.12 } }
};
```

---

## VITE CONFIG (vite.config.js)

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
  },
});
```

---

## PACKAGE.JSON SCRIPTS

```json
{
  "main": "electron/main.js",
  "scripts": {
    "dev": "concurrently \"vite\" \"wait-on http://localhost:5173 && cross-env NODE_ENV=development electron .\"",
    "build": "vite build",
    "dist": "npm run build && electron-builder"
  }
}
```

---

## ELECTRON-BUILDER CONFIG (electron-builder.yml)

```yaml
appId: com.sumeet.trackeros
productName: TrackerOS
directories:
  buildResources: assets
  output: release
files:
  - dist/**/*
  - electron/**/*
  - node_modules/**/*
win:
  target: nsis
  icon: assets/icon.ico
nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
```

---

## CHECKLIST FOR ANTIGRAVITY

Build in this order:

1. [ ] Scaffold Electron + React + Vite project
2. [ ] Configure Tailwind with custom dark color palette
3. [ ] Create electron/main.js with two BrowserWindows (main + stats)
4. [ ] Set up preload.js context bridge with all IPC channels
5. [ ] Set up system tray with tray.js
6. [ ] Register Ctrl+Shift+W global shortcut
7. [ ] Build utils/time.js with all helper functions
8. [ ] Seed electron-store with DEFAULT_ROUTINE on first launch
9. [ ] Build TitleBar component (draggable, macOS dots, STATS button)
10. [ ] Build LiveClock component (real-time, every 1 second)
11. [ ] Build CurrentBlock component (accent glow animation)
12. [ ] Build UpcomingList component (category dots, mono time)
13. [ ] Build TaskList component (custom checkbox, inline add)
14. [ ] Build DayProgress footer
15. [ ] Wire App.jsx with all components in correct layout
16. [ ] Build StatsPanel with Today + Week tabs
17. [ ] Connect StatsPanel to daily log data from electron-store
18. [ ] Add Framer Motion transitions for open/close
19. [ ] Save window position on drag, restore on relaunch
20. [ ] Build and test with `npm run dist`

---

## IMPORTANT RULES FOR ANTIGRAVITY

- Do NOT use HTML `<input type="checkbox">` — use a custom div-based checkbox with click handler
- Do NOT add any gradients, blur effects, or shadows (except the glow keyframe on CurrentBlock)
- Use `font-mono` (JetBrains Mono) for ALL times, numbers, labels, and section headers
- Use `font-sans` (Inter) ONLY for task names and block names
- The accent color (#4d8eff) appears in EXACTLY four places: current block border glow, active progress bar, today's week bar, active tab underline
- Tasks auto-save to electron-store whenever the tasks array changes (debounce 300ms)
- Logs auto-save at midnight (setInterval check every minute) and on app quit
- The Stats window opens relative to the Main widget (mainWin.getPosition() + offset)
- Both windows use `transparent: true` and `frame: false` — the background color comes from the React component's root div (#0d0d0d with border-radius 10px)

