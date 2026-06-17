/**
 * Schedule utility functions
 */

/** Convert "HH:MM" to total minutes */
export function toMin(t) {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

/** Convert total minutes back to "HH:MM" */
export function fromMin(m) {
  const h = Math.floor(m / 60) % 24;
  const min = m % 60;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

/** Block duration in minutes */
export function blockDuration(block) {
  return toMin(block.end) - toMin(block.start);
}

/**
 * Detect overlapping block pairs.
 * Returns an array of { a, b } pairs (by index) that conflict.
 */
export function detectConflicts(blocks) {
  const conflicts = new Set();
  for (let i = 0; i < blocks.length; i++) {
    for (let j = i + 1; j < blocks.length; j++) {
      const aStart = toMin(blocks[i].start);
      const aEnd   = toMin(blocks[i].end);
      const bStart = toMin(blocks[j].start);
      const bEnd   = toMin(blocks[j].end);
      // Overlap: one starts before the other ends
      if (aStart < bEnd && bStart < aEnd) {
        conflicts.add(i);
        conflicts.add(j);
      }
    }
  }
  return conflicts; // Set of conflicting indices
}

/**
 * Suggest a start time for a new block based on the last block's end time.
 * Returns "HH:MM" string or "09:00" if no blocks.
 */
export function suggestNextStart(blocks) {
  if (!blocks || blocks.length === 0) return '09:00';
  const sorted = [...blocks].sort((a, b) => toMin(a.start) - toMin(b.start));
  return sorted[sorted.length - 1].end;
}

/**
 * Returns the 3-letter day key (Mon, Tue, ...) for a given Date.
 */
export function getDayKey(date = new Date()) {
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
}

/**
 * Sort blocks chronologically by start time.
 */
export function sortBlocks(blocks) {
  return [...blocks].sort((a, b) => toMin(a.start) - toMin(b.start));
}
