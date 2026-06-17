/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{jsx,js}', './index.html'],
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
  plugins: [],
};
