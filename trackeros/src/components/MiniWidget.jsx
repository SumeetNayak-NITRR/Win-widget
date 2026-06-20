import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fmtTime, minsLeft, blockProgress, toMin } from '../utils/time';

export default function MiniWidget({ block, now, onExpand, onUpdateStatus, pomoState, colors }) {
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeoutRef = useRef(null);
  const showTimeoutRef = useRef(null);

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    // 80ms intent delay — prevents flash when mouse passes over
    showTimeoutRef.current = setTimeout(() => setIsHovered(true), 80);
  };

  const handleMouseLeave = () => {
    if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 300);
  };

  useEffect(() => () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
  }, []);

  const pct = block ? blockProgress(block, now) : 0;
  const remaining = block ? minsLeft(block.end, now) : '';
  const qualifiesForPomo = block && (toMin(block.end) - toMin(block.start)) >= 45;

  // Ring uses stroke-dashoffset for smooth CSS animation
  const CIRCUMFERENCE = 100; // using 100 unit path for percentage math simplicity
  const ringColor = (block && colors && colors[block.category]) ? colors[block.category] : 'var(--accent)';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="acrylic-root"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        width: '100%',
        height: '100%',
        background: 'var(--acrylic-base)',
        borderRadius: '12px',
        border: '0.5px solid var(--border-medium)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.55), 0 0 0 0.5px rgba(255,255,255,0.04) inset',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '12px',
        userSelect: 'none',
        position: 'relative',
        overflow: 'hidden',
        WebkitAppRegion: 'drag',
      }}
    >
      {/* Expand Button */}
      <button
        onClick={onExpand}
        style={{
          position: 'absolute',
          top: '6px',
          right: '6px',
          width: '18px',
          height: '18px',
          borderRadius: '4px',
          background: 'rgba(255,255,255,0.05)',
          border: '0.5px solid var(--border-subtle)',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          WebkitAppRegion: 'no-drag',
          zIndex: 20,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        title="Expand Widget"
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 3 21 3 21 9"></polyline>
          <polyline points="9 21 3 21 3 15"></polyline>
          <line x1="21" y1="3" x2="14" y2="10"></line>
          <line x1="3" y1="21" x2="10" y2="14"></line>
        </svg>
      </button>

      {/* Hover overlay quick actions — AnimatePresence for smooth fade+scale */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.13, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(20, 20, 28, 0.92)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              zIndex: 15,
              borderRadius: '12px',
              WebkitAppRegion: 'no-drag',
              pointerEvents: 'auto',
            }}
          >
          {block && block.status !== 'done' && block.status !== 'skipped' ? (
            <>
              <button 
                onClick={(e) => { e.stopPropagation(); onUpdateStatus?.(block.id, 'done'); }}
                className="hover:scale-105 active:scale-95 transition-all flex items-center justify-center font-sans font-medium text-[10px]"
                style={{
                  height: '24px', padding: '0 8px', borderRadius: '12px',
                  background: 'rgba(34, 197, 94, 0.15)', border: '0.5px solid rgba(34, 197, 94, 0.3)',
                  cursor: 'pointer', color: '#6ccb5f', WebkitAppRegion: 'no-drag',
                  display: 'flex', gap: '3px', alignItems: 'center'
                }}
                title="Mark Done"
              >
                ✅ Done
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onUpdateStatus?.(block.id, 'skipped'); }}
                className="hover:scale-105 active:scale-95 transition-all flex items-center justify-center font-sans font-medium text-[10px]"
                style={{
                  height: '24px', padding: '0 8px', borderRadius: '12px',
                  background: 'rgba(239, 68, 68, 0.12)', border: '0.5px solid rgba(239, 68, 68, 0.25)',
                  cursor: 'pointer', color: '#ff5f57', WebkitAppRegion: 'no-drag',
                  display: 'flex', gap: '3px', alignItems: 'center'
                }}
                title="Skip Block"
              >
                ⏭️ Skip
              </button>
              {qualifiesForPomo && pomoState && (
                <button 
                  onClick={(e) => { e.stopPropagation(); pomoState.toggle(); }}
                  className="hover:scale-105 active:scale-95 transition-all flex items-center justify-center font-mono font-medium text-[9px]"
                  style={{
                    height: '24px', padding: '0 8px', borderRadius: '12px',
                    background: pomoState.active ? 'rgba(76, 194, 255, 0.25)' : 'rgba(255, 255, 255, 0.05)', 
                    border: pomoState.active ? '0.5px solid var(--accent)' : '0.5px solid var(--border-subtle)',
                    cursor: 'pointer', color: pomoState.active ? 'var(--accent)' : 'var(--text-secondary)',
                    WebkitAppRegion: 'no-drag',
                    display: 'flex', gap: '3px', alignItems: 'center'
                  }}
                  title="Toggle Pomodoro"
                >
                  ⏱️ {Math.floor(pomoState.timeLeft / 60)}:{(pomoState.timeLeft % 60).toString().padStart(2, '0')}
                </button>
              )}
            </>
          ) : (
            <span className="text-[10px] text-[var(--text-secondary)] font-mono uppercase tracking-wider">
              {block ? `Block is ${block.status}` : 'Free Time'}
            </span>
          )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Luminous top edge */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
        background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 30%, rgba(255,255,255,0.18) 70%, transparent 100%)',
        zIndex: 10, pointerEvents: 'none',
      }} />

      {/* Content */}
      <div className="flex h-full items-center gap-[10px] pl-1">
        {/* SVG Circular Progress Ring — stroke-dashoffset for smooth CSS animation */}
        <div className="relative flex-shrink-0" style={{ width: '28px', height: '28px' }}>
          <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
            {/* Track */}
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3.5"
            />
            {/* Progress — uses strokeDashoffset for smooth animation */}
            {block && (
              <path
                style={{
                  stroke: ringColor,
                  filter: `drop-shadow(0 0 3px ${ringColor}66)`,
                  strokeDasharray: '100',
                  strokeDashoffset: `${100 - pct}`,
                  transition: 'stroke-dashoffset 1s linear',
                }}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none" strokeWidth="3.5" strokeLinecap="round"
              />
            )}
          </svg>
        </div>

        <div className="flex-1 flex flex-col justify-center min-w-0 pr-[18px]">
          <div className="font-sans font-medium truncate" style={{ fontSize: '13px', color: 'var(--text-primary)', marginBottom: '3px' }}>
            {block ? block.label : 'Free Time'}
          </div>
          <div className="flex justify-between items-center gap-1">
            <div className="font-mono truncate" style={{ fontSize: '9px', color: 'var(--text-tertiary)' }}>
              {block ? `${fmtTime(block.start)} – ${fmtTime(block.end)}` : ''}
            </div>
            {block && (
              <div className="font-mono font-medium text-right whitespace-nowrap" style={{ fontSize: '9px', color: 'var(--accent)', flexShrink: 0 }}>
                {remaining}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
