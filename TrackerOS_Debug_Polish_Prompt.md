# TrackerOS — Debug & Polish Prompt
## Stats Pipeline Fix + Mini Widget Polish + General Improvements
### Paste this into Antigravity as-is

---

## PART 1 — STATS DATA PIPELINE DIAGNOSIS

### Context
The Stats window shows an empty 28-day heatmap and "No time logged yet" even though the main widget shows an active block with Day Progress at 50%. This means data is being written somewhere the Stats reader doesn't look, or isn't being written at all.

### Diagnostic Instructions for Antigravity

```
Investigate the TrackerOS codebase and answer these questions before making any changes:

1. Find the "Done" and "Skip" button click handlers for the current block.
   - What function do they call?
   - Does that function write to electron-store, or only update local React state?

2. Find the electron-store schema. List every top-level key currently in use
   (e.g. tasks, logs, routine, settings, history, activity).

3. Find the StatsPanel / heatmap / donut chart components.
   - What store key(s) do they read from?
   - Do the WRITE key (from step 1) and the READ key (from step 3) match exactly,
     including date key format?

4. Check the date key format used in BOTH the writer and the reader:
   - Is it generated with `new Date().toISOString().split('T')[0]` (this returns
     UTC date, which can be WRONG for local time near midnight)?
   - Or with a local-time formatter like `fmtDateKey()`?
   - If these differ between writer and reader, that IS the bug.

5. Check whether marking a block "Done" or "Skip" writes anything beyond the
   task's own done:true flag. Specifically: does it record category, duration,
   and timestamp anywhere a heatmap/donut chart could later aggregate?

6. Check whether the Stats window re-fetches data every time it opens, or only
   once on first mount (stale data bug if it's cached at mount time).

Report findings before fixing.
```

### The Fix (apply once diagnosis confirms the gap)

You need a dedicated **activity log writer**, separate from the tasks/routine state, that fires every time a block is completed or skipped.

```js
// electron/store-schema.js — add this if missing
// store.activity["YYYY-MM-DD"] = [
//   { blockId, category, label, duration_min, status: 'done' | 'skipped', completedAt }
// ]

function logBlockActivity(store, block, status) {
  const dateKey = fmtDateKey(new Date()); // MUST use local time, not UTC
  const dayLog = store.get(`activity.${dateKey}`, []);
  dayLog.push({
    blockId: block.id,
    category: block.category,
    label: block.label,
    duration_min: toMin(block.end) - toMin(block.start),
    status, // 'done' | 'skipped'
    completedAt: new Date().toISOString(),
  });
  store.set(`activity.${dateKey}`, dayLog);
}
```

```js
// IPC handler — call this from the Done/Skip button handlers
ipcMain.on('log-block-activity', (_, block, status) => {
  logBlockActivity(store, block, status);
});
```

```js
// preload.js — expose it
contextBridge.exposeInMainWorld('tracker', {
  // ...existing exports
  logActivity: (block, status) => ipcRenderer.send('log-block-activity', block, status),
});
```

```js
// In the Done/Skip button handler (CurrentBlock.jsx)
const handleDone = () => {
  window.tracker.logActivity(currentBlock, 'done');
  // ...existing done logic
};
const handleSkip = () => {
  window.tracker.logActivity(currentBlock, 'skipped');
  // ...existing skip logic
};
```

```js
// StatsPanel — heatmap data builder, reads from activity not tasks
async function buildHeatmapData(days = 28) {
  const today = new Date();
  const cells = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = fmtDateKey(d);
    const dayActivity = await window.tracker.getActivity(key); // new IPC call
    const doneCount = dayActivity.filter(a => a.status === 'done').length;
    cells.push({ date: key, count: doneCount, intensity: Math.min(doneCount / 5, 1) });
  }
  return cells;
}

// Time Distribution donut — group by category
function buildCategoryDistribution(activityList) {
  const totals = {};
  activityList.filter(a => a.status === 'done').forEach(a => {
    totals[a.category] = (totals[a.category] || 0) + a.duration_min;
  });
  return totals; // { study: 120, fitness: 45, ... }
}
```

### Critical Date-Key Rule
Every place in the codebase that generates a date key for storage MUST use the exact same function. Search the whole codebase for `toISOString().split('T')[0]` and `getFullYear()` — if you find both patterns used in different files, unify them all to a single shared `fmtDateKey()` from utils, imported everywhere. This single inconsistency is the #1 most likely cause of the empty-stats bug.

### Stats Window Refresh Rule
The Stats window must re-fetch activity data every time it becomes visible (`show` event on the BrowserWindow, or `useEffect` triggered on a visibility prop), not just once on mount — otherwise it'll show stale or empty data after the first load.

---

## PART 2 — MINI WIDGET INTERACTION POLISH

### Current State (from your screenshots)
The mini widget shows a circular progress ring with time remaining, and on hover reveals Done/Skip/Pomodoro quick actions. This is already a strong pattern — these are refinements, not a rebuild.

### Polish Checklist

```
1. RING ANIMATION
   - The circular progress ring should animate via stroke-dashoffset, not by
     re-rendering the SVG path on every tick.
   - Use: stroke-dasharray = circumference, stroke-dashoffset = circumference * (1 - progress)
   - Transition: `transition: stroke-dashoffset 1s linear` so it sweeps smoothly
     instead of jumping every second.
   - Verify the ring color matches block category (not always blue/green).

2. HOVER REVEAL TIMING
   - Quick actions (Done/Skip/Pomodoro) should fade+scale in over 120-150ms,
     not appear instantly — instant pop-ins feel broken, not snappy.
   - Use Framer Motion: { opacity: 0, scale: 0.9 } → { opacity: 1, scale: 1 }
   - Add a 80ms hover delay before showing actions (prevents flicker when
     cursor passes over the widget without intent to interact).

3. AUTO-COLLAPSE ON BLUR
   - Verify the collapse-to-mini transition has a debounce of at least 200ms
     after blur fires — otherwise quick alt-tabbing causes visible flicker
     as it expands and immediately collapses.
   - The collapse animation itself should match the expand animation duration
     (currently check if these are asymmetric — expand fast, collapse slow
     reads as laggy).

4. DRAG + SNAP BEHAVIOR
   - Confirm position is saved to electron-store on `dragend`, not on every
     `drag` event (performance + avoids excessive disk writes).
   - Add edge-snapping: if the widget is dragged within 20px of any screen
     edge, snap to that edge on release.
   - On multi-monitor setups, validate the saved position is still on-screen
     at launch — if the monitor was disconnected, fall back to a default
     corner position instead of spawning off-screen invisibly.

5. EXPAND BUTTON
   - The "Expand Widget" tooltip (visible in your screenshot) is good UX —
     keep it, but verify it has a slight delay (500ms) before showing, like
     native Windows tooltips, rather than appearing instantly on hover.

6. CLICK-THROUGH PROTECTION
   - Ensure clicking Done/Skip in the mini widget does NOT also trigger the
     expand action — these need separate event handlers with
     `e.stopPropagation()` on the action buttons.
```

---

## PART 3 — GENERAL WIDGET IMPROVEMENTS

### Performance

```
1. CLOCK RE-RENDER ISOLATION
   - The live clock ticks every second. If LiveClock is not isolated as its
     own component with its own state, every 1-second tick will re-render
     the ENTIRE widget tree (CurrentBlock, TaskList, everything) — this is
     wasteful and can cause visible jank.
   - Fix: LiveClock should be the ONLY component with the setInterval. Wrap
     sibling components in React.memo() so they don't re-render on clock tick.

2. PROGRESS BAR RECALCULATION
   - blockProgress() recalculates every render — fine at this scale, but
     verify it's not also recalculating on every keystroke if a task input
     is focused (check for missing dependency arrays in useEffect/useMemo).
```

### Reliability

```
3. MIDNIGHT ROLLOVER
   - Test: what happens if the widget is open and left running across
     midnight? Does "today's tasks" correctly roll to the new date without
     requiring an app restart? Add a check: every minute, compare the
     current date key to the last-known date key; if changed, trigger a
     full data refresh (new day's tasks, new day's routine view).

4. UNDONE TASK CARRYOVER (verify this doesn't double-carry)
   - Confirm carried-over tasks are visually marked (e.g. a small "from
     yesterday" tag) so they're distinguishable from fresh tasks.
   - Confirm the carryover logic runs exactly ONCE per day transition —
     check there's no risk of a task being carried over multiple times if
     the app restarts several times in one day.

5. NOTIFICATION PERMISSIONS
   - On first launch, explicitly request Windows notification permission
     and show a fallback message in-app if denied, rather than silently
     failing to notify for block starts.

6. EXPORT/IMPORT VALIDATION
   - Before importing a JSON backup, validate its shape (check for required
     keys: routine, tasks, settings) and show an error toast if the file is
     malformed, rather than crashing or silently corrupting the store.

7. SETTINGS → HOTKEY REBINDING
   - Verify that rebinding the global hotkey unregisters the OLD hotkey
     before registering the new one (`globalShortcut.unregister()` first) —
     otherwise both hotkeys may remain active simultaneously.
```

### Polish / Nice-to-haves

```
8. EMPTY STATES
   - Stats window currently shows "Not enough block data for a weekly
     summary" — good, keep this pattern everywhere data is sparse, including
     the heatmap (show a subtle "Start logging to see your activity" hint
     instead of just blank gray cells).

9. STREAK COUNTER EDGE CASE
   - Confirm what counts as a "streak day" — is it ANY task done, or a
     minimum completion percentage? Define this explicitly (e.g. ≥50% of
     scheduled blocks completed) so the streak logic is consistent and the
     user understands what breaks it.

10. POMODORO + BLOCK INTERACTION
    - Confirm what happens if a Pomodoro timer is still running when its
      parent block's end time passes — does it auto-stop, keep running into
      the next block, or prompt the user? Define this explicitly rather than
      leaving it as undefined behavior.
```

---

## PART 4 — FINAL PROMPT TO RUN IN ANTIGRAVITY

```
Review the TrackerOS codebase against the following checklist and fix issues
in this exact order:

STEP 1 — Diagnose the stats pipeline by answering the 6 diagnostic questions
in Part 1 of this document. Report findings before changing any code.

STEP 2 — Based on the diagnosis, implement the activity-log writer pattern
from Part 1: a dedicated `activity.{dateKey}` store namespace, written on
every Done/Skip action, read by the heatmap and donut chart. Unify all
date-key generation across the codebase to one shared local-time function.

STEP 3 — Make the Stats window re-fetch activity data every time it becomes
visible, not just on first mount.

STEP 4 — Apply the mini widget polish items from Part 2: smooth ring
animation via stroke-dashoffset, 120-150ms fade+scale on hover actions,
200ms debounce on auto-collapse, drag-end-only position saves with edge
snapping, and click-through protection on action buttons.

STEP 5 — Apply the reliability fixes from Part 3: isolate the live clock
into its own component wrapped with React.memo on siblings, add midnight
rollover detection, verify carryover runs once per day transition, add
notification permission handling, validate import JSON shape, and fix
hotkey rebinding to unregister before re-registering.

After each step, run the app and verify the specific behavior before moving
to the next step. Do not batch all fixes into one untested commit.
```

