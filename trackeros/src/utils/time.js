export const toMin = (t) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

export const fmt12 = (d) => {
  let h = d.getHours();
  const m = d.getMinutes();
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, '0')} ${ap}`;
};

export const fmtDate = (d) => {
  const days   = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
                  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
};

export const fmtDateKey = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const fmtTime = (t) => {
  const [h, m] = t.split(':').map(Number);
  const ap = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ap}`;
};

export const minsLeft = (end, now) => {
  const diff = toMin(end) - (now.getHours() * 60 + now.getMinutes());
  if (diff <= 0) return 'Ending now';
  if (diff >= 60) return `${Math.floor(diff / 60)}h ${diff % 60}m left`;
  return `${diff}m left`;
};

export const blockProgress = (block, now) => {
  const s = toMin(block.start);
  const e = toMin(block.end);
  const c = now.getHours() * 60 + now.getMinutes();
  return Math.min(100, Math.max(0, Math.round(((c - s) / (e - s)) * 100)));
};

export const isCurrentBlock = (block, now) => {
  const c = now.getHours() * 60 + now.getMinutes();
  return toMin(block.start) <= c && c < toMin(block.end);
};

export const getCurrentBlock = (routine, now) => {
  const nm = now.getHours() * 60 + now.getMinutes();
  return routine.find((b) => toMin(b.start) <= nm && nm < toMin(b.end)) || null;
};

export const getUpcoming = (routine, now, count = 4) => {
  const nm = now.getHours() * 60 + now.getMinutes();
  return routine.filter((b) => toMin(b.start) > nm).slice(0, count);
};
