<div align="center">

# TrackerOS

**A Windows 11 productivity widget — your personal discipline engine.**

[![Platform](https://img.shields.io/badge/platform-Windows%2011-0078D6?style=flat-square&logo=windows)](https://github.com/SumeetNayak-NITRR/trackeros)
[![Built with Electron](https://img.shields.io/badge/built%20with-Electron-47848F?style=flat-square&logo=electron)](https://electronjs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://reactjs.org)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)

TrackerOS sits quietly on your desktop, guiding you through every hour of your day. No bloat, no distractions — just pure focus.

</div>

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🗓️ **Daily Routine** | Build reusable time-block templates for Weekday, Weekend, etc. |
| ⚡ **Live Block Tracker** | See your current block, upcoming schedule, and a real-time progress bar |
| 🎯 **Goal System** | Outcomes → Focus Areas → Daily Blocks. Track progress automatically |
| 📊 **Stats Panel** | 7-day heatmap, category time distribution, streaks, and completion rates |
| 📝 **Block Micro-Journal** | Log a 1-line note + emoji rating after every block |
| 🔄 **Weekly Review Ritual** | 4-screen Sunday check-in — update goals, set focus, write your weekly intention |
| 🚀 **Morning Briefing** | A daily toast showing your streak, upcoming blocks, and this week's intention |
| 💾 **Export/Import** | Backup and share your entire setup as a single JSON file |
| ⏱️ **Pomodoro Timer** | Built-in 25/5 Pomodoro with ambient soundscapes (Lo-Fi, Rain, White Noise) |
| 🔔 **System Notifications** | Native Windows alerts at the start and 5 min before the end of each block |
| 📌 **Mini Mode** | Collapse to a tiny persistent bar that never breaks your focus |
| ⌨️ **Global Hotkey** | `Ctrl+Shift+W` to show/hide the widget from anywhere |

---

## 📸 Screenshots

<table>
  <tr>
    <td align="center"><b>Main Widget</b></td>
    <td align="center"><b>Stats Panel</b></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/widget.png" width="260" alt="Main Widget"/></td>
    <td><img src="docs/screenshots/stats.png" width="360" alt="Stats Panel"/></td>
  </tr>
  <tr>
    <td align="center"><b>Goals System</b></td>
    <td align="center"><b>Onboarding</b></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/goals.png" width="360" alt="Goals"/></td>
    <td><img src="docs/screenshots/onboarding.png" width="260" alt="Onboarding"/></td>
  </tr>
</table>

---

## 🚀 Getting Started

### Download & Install

1. Go to the [**Releases**](https://github.com/SumeetNayak-NITRR/trackeros/releases) page
2. Download the latest `TrackerOS Setup x.x.x.exe`
3. Run the installer (Windows may show a SmartScreen warning — click *More Info* → *Run Anyway*)
4. TrackerOS starts automatically and lives in your system tray

> **First launch**: An onboarding guide will walk you through setting up your first schedule template and goals.

---

## 🛠️ Build from Source

### Prerequisites
- [Node.js 20+](https://nodejs.org)
- Windows 10/11

### Setup

```bash
# Clone the repository
git clone https://github.com/SumeetNayak-NITRR/trackeros.git
cd trackeros

# Install dependencies
npm install

# Start development server (hot-reload)
npm run dev

# Build production installer
npm run dist
```

The installer will be generated at `release/TrackerOS Setup x.x.x.exe`.

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Shell | [Electron](https://electronjs.org) 36 |
| UI | [React](https://reactjs.org) 18 + [Vite](https://vitejs.dev) |
| Animations | [Framer Motion](https://www.framer.com/motion/) |
| Styling | TailwindCSS + Vanilla CSS variables |
| Persistence | [electron-store](https://github.com/sindresorhus/electron-store) |
| Auto-update | [electron-updater](https://www.electron.build/auto-update) |

---

## 📖 How It Works

### The Daily Loop
1. **Morning**: TrackerOS opens and prompts you to confirm today's schedule from your template
2. **Morning Briefing**: See your streak 🔥, upcoming blocks, and this week's intention
3. **During the day**: The widget shows your current block and auto-advances as time passes
4. **Block done**: Mark it done → a Micro-Journal popup asks for a quick rating + note
5. **Evening**: Review your completed vs skipped blocks in the Stats panel

### The Goal System
```
Outcome  →  "Crack GATE 2026" (numeric target: 85%)
  Focus  →  "Complete DBMS Module" (this week's priority)
  Block  →  "DSA Practice" (linked to Focus, auto-tracks progress)
```
Every time you mark a linked block as Done, TrackerOS automatically increments your goal progress.

### Weekly Review (Sundays)
TrackerOS automatically triggers a 4-screen ritual every Sunday:
1. **Debrief** — See your completion rate, heatmap, and journal highlights
2. **Goals** — Update your numeric measurements (weight, LeetCode count, etc.)
3. **Focus** — Pick next week's priority for each goal
4. **Intention** — Write one sentence for the week ahead

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes and commit: `git commit -m "feat: add your feature"`
4. Push and open a Pull Request

### Project Structure

```
trackeros/
├── electron/          # Main process (main.js, preload.js, tray.js)
├── src/
│   ├── components/    # React UI components
│   ├── hooks/         # Custom React hooks
│   └── utils/         # Time, schedule utilities
├── assets/            # Icons and build resources
└── electron-builder.yml
```

---

## 📄 License

MIT © [Sumeet Nayak](https://github.com/SumeetNayak-NITRR)

---

<div align="center">
  Built with ❤️ for students and self-disciplined builders.
  <br/>
  <sub>TrackerOS — Stay on track, every day.</sub>
</div>
