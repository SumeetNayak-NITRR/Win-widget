import { useState, useEffect, useCallback, useRef } from 'react';
import { fmtDateKey } from '../utils/time';

/**
 * CRUD hook for today's floating tasks.
 * Auto-saves to electron-store with 300ms debounce.
 */
export function useTaskStore() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const dateKey = fmtDateKey(new Date());
  const debounceRef = useRef(null);
  const isInitialLoad = useRef(true);

  // Load tasks on mount
  useEffect(() => {
    const load = async () => {
      try {
        const stored = await window.tracker.getTasks(dateKey);
        setTasks(stored || []);
      } catch (e) {
        console.error('Failed to load tasks:', e);
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [dateKey]);

  // Auto-save with 300ms debounce whenever tasks change
  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      window.tracker.saveTasks(dateKey, tasks).catch(console.error);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [tasks, dateKey]);

  const addTask = useCallback((text) => {
    if (!text.trim()) return;
    
    let dueTime = null;
    let cleanText = text.trim();
    
    // Parse time (e.g. "14:00")
    const timeMatch = cleanText.match(/\b([01]?[0-9]|2[0-3]):([0-5][0-9])\b/);
    if (timeMatch) {
      dueTime = timeMatch[0];
    }

    const newTask = {
      id: `t_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      text: cleanText,
      dueTime,
      done: false,
      createdAt: new Date().toISOString(),
      completedAt: null,
    };
    
    setTasks((prev) => {
      const arr = [...prev, newTask];
      return arr.sort((a, b) => {
        if (a.done !== b.done) return a.done ? 1 : -1;
        if (a.dueTime && b.dueTime) return a.dueTime.localeCompare(b.dueTime);
        if (a.dueTime) return -1;
        if (b.dueTime) return 1;
        return 0;
      });
    });
  }, []);

  const toggleTask = useCallback((id) => {
    setTasks((prev) => {
      const arr = prev.map((t) =>
        t.id === id ? { ...t, done: !t.done, completedAt: !t.done ? new Date().toISOString() : null } : t
      );
      return arr.sort((a, b) => {
        if (a.done !== b.done) return a.done ? 1 : -1;
        if (a.dueTime && b.dueTime) return a.dueTime.localeCompare(b.dueTime);
        if (a.dueTime) return -1;
        if (b.dueTime) return 1;
        return 0;
      });
    });
  }, []);

  const removeTask = useCallback((id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { tasks, loading, addTask, toggleTask, removeTask };
}
