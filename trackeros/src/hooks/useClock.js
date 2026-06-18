import { useState, useEffect } from 'react';

let globalNow = new Date();
let listeners = new Set();
let clockInterval = null;

function startClock() {
  if (clockInterval) return;
  clockInterval = setInterval(() => {
    globalNow = new Date();
    listeners.forEach(fn => fn(globalNow));
  }, 1000);
}

function stopClock() {
  if (clockInterval && listeners.size === 0) {
    clearInterval(clockInterval);
    clockInterval = null;
  }
}

/**
 * Returns a live Date object that updates every second.
 * Optimized to run only a single shared interval across all components.
 */
export function useClock() {
  const [now, setNow] = useState(globalNow);

  useEffect(() => {
    listeners.add(setNow);
    startClock();
    return () => {
      listeners.delete(setNow);
      stopClock();
    };
  }, []);

  return now;
}
