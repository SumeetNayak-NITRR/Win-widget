export const DEFAULT_TEMPLATES = {
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

// Kept for fallback/migrations
export const DEFAULT_ROUTINE = DEFAULT_TEMPLATES.Weekday;

export const CAT_COLOR = {
  study:   '#4d8eff',
  fitness: '#22c55e',
  sport:   '#f97316',
  skill:   '#a78bfa',
  health:  '#f59e0b',
  dev:     '#06b6d4',
};
