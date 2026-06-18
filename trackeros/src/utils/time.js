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
  let diff = toMin(end) - (now.getHours() * 60 + now.getMinutes());
  if (diff < 0) diff += 24 * 60;
  if (diff === 0) return 'Ending now';
  if (diff >= 60) return `${Math.floor(diff / 60)}h ${diff % 60}m left`;
  return `${diff}m left`;
};

export const blockProgress = (block, now) => {
  const s = toMin(block.start);
  let e = toMin(block.end);
  let c = now.getHours() * 60 + now.getMinutes();
  
  if (s > e) {
    e += 24 * 60;
    if (c < s) c += 24 * 60;
  }
  
  return Math.min(100, Math.max(0, Math.round(((c - s) / (e - s)) * 100)));
};

export const isCurrentBlock = (block, now) => {
  const c = now.getHours() * 60 + now.getMinutes();
  const s = toMin(block.start);
  const e = toMin(block.end);
  
  if (s > e) {
    return c >= s || c < e;
  }
  return s <= c && c < e;
};

export const getCurrentBlock = (routine, now) => {
  return routine.find(b => isCurrentBlock(b, now)) || null;
};

export const getUpcoming = (routine, now, count = 4) => {
  const nm = now.getHours() * 60 + now.getMinutes();
  return routine.filter((b) => toMin(b.start) > nm).slice(0, count);
};

export const getISOWeekStr = (d) => {
  const target = new Date(d);
  const day = target.getDay(); // 0 is Sunday, 1 is Monday...
  target.setDate(target.getDate() - day);
  return `W-${fmtDateKey(target)}`;
};

export const getDueStatus = (dueDate) => {
  if (!dueDate) return null;
  const now = new Date();
  const todayStr = fmtDateKey(now);
  if (dueDate === todayStr) return { text: 'Due today', color: '#f1fa8c' };
  
  const due = new Date(dueDate);
  now.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  
  const diffTime = due - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return { text: `${Math.abs(diffDays)}d overdue`, color: '#ff5f57' };
  } else if (diffDays === 1) {
    return { text: 'Due tomorrow', color: '#8be9fd' };
  } else {
    return { text: `Due in ${diffDays}d`, color: '#6272a4' };
  }
};

