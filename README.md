<div align="center">


# Tracker

**Your daily routine, structured.**

A minimal Windows 11 desktop widget to track your routine blocks, tasks, and long-term goals — all in one place.

</div>

---

## What is Tracker?

Tracker is a lightweight Windows desktop widget that answers three questions at a glance:

- **What should I be doing right now?**
- **What's coming up next?**
- **How am I progressing toward my goals?**

It lives quietly in your system tray, opens with a hotkey, and never gets in your way. Built for students, athletes, and anyone who wants their day structured without the noise of a full productivity suite.

---

## Features

**Core Widget**
- 🕐 Live clock with current date
- 📦 Routine time blocks — shows the active block with a live progress bar and time remaining
- 📋 Upcoming block list — see the next 4 blocks at a glance
- ✅ Floating task list — add, check off, and carry over tasks daily
- 📊 Day progress bar — X/Y tasks done at the bottom

**Routine Management**
- 🗓 Weekday / Weekend / Custom schedule templates
- ⚡ Auto-loads the right template every morning — no manual switching
- ✏️ Full block editor — add, edit, reorder, and delete blocks
- 📤 Export & import templates as JSON — share your routine with friends

**Goals — North Star Framework**
- 🎯 Link any block to a long-term goal
- 📈 Track numeric outcomes (e.g. Portfolio Projects: 2/5)
- 📝 Track text-based commitments (e.g. "No second servings after 8 PM")
- 🔗 Visual chain: North Star → Outcome → Focus → Action

**Stats**
- 📅 Today tab — tasks done, completion %, day progress
- 📆 Week tab — 28-day activity heatmap, time distribution donut chart, weekly summary
- 💡 Week Pulse Strip — 7-day completion bars at a glance

**Focus & Productivity**
- 🍅 Pomodoro timer built into every block
- 🎵 Ambient soundscapes — Lofi, Rain, White Noise
- 📝 Block Micro-Journal — log an emoji + one-liner after every completed block
- ☀️ Morning Briefing — daily summary card on first launch

**System**
- 🖥 Minimizes to system tray — never clutters your taskbar
- ⌨️ Global hotkey `Ctrl+Shift+W` — show/hide from anywhere
- 🚀 Launch at startup — optional, toggle in settings
- 🔔 Desktop notifications — block start alerts + 5-min warnings
- 💾 All data stored locally — nothing leaves your machine

---

## Installation

### Download (Recommended)

1. Go to [**Releases**](https://github.com/SumeetNayak-NITRR/tracker/releases/latest)
2. Download `Tracker-Setup-1.0.0.exe`
3. Run the installer
4. Tracker appears in your system tray — press `Ctrl+Shift+W` to open it

> **Note:** Windows SmartScreen may show a warning on first launch since the app isn't code-signed yet. Click **More info → Run anyway** to proceed.

---

## Getting Started

1. **First launch** — the onboarding guide walks you through everything in ~2 minutes
2. **Set up your routine** — add your daily blocks (or pick a template to start)
3. **Add today's tasks** — floating tasks for things that don't have a fixed time
4. **Link a goal** *(optional)* — connect blocks to your North Star via the block editor
5. **Press `Ctrl+Shift+W`** anytime to toggle the widget

### Tips
- The widget **auto-minimizes** when you click away — or pin it with the 📌 button
- Mark blocks **Done** to log them to your stats and trigger the Micro-Journal
- Use **Export** in Settings → General to share your routine template with friends

---

## Building from Source

```bash
# Clone the repo
git clone https://github.com/SumeetNayak-NITRR/tracker.git
cd tracker

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build the Windows installer
npm run dist
```

**Requirements:** Node.js 18+, Windows 10/11

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Electron](https://electronjs.org) |
| Frontend | [React 18](https://react.dev) + [Vite](https://vitejs.dev) |
| Styling | [Tailwind CSS](https://tailwindcss.com) |
| Animations | [Framer Motion](https://www.framer.com/motion) |
| Storage | [electron-store](https://github.com/sindresorhus/electron-store) (local JSON) |
| Packaging | [electron-builder](https://www.electron.build) |

---

## Contributing

Contributions are welcome. If you find a bug or have a feature suggestion, open an issue. If you want to contribute code, fork the repo and open a pull request.

---

## License

MIT © [Sumeet Nayak](https://github.com/SumeetNayak-NITRR)

---

<div align="center">

Built with ☕ during engineering college at NIT Raipur

⭐ Star the repo if Tracker helps you stay on track

</div>
