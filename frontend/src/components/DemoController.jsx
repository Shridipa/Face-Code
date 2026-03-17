import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sliders, ChevronDown, ChevronUp, Play, Pause } from 'lucide-react';

const EMOTIONS = [
  { key: 'happy',   label: '🙂 Focused',    color: '#22C55E' },
  { key: 'neutral', label: '😐 Neutral',     color: '#818CF8' },
  { key: 'angry',   label: '😡 Frustrated',  color: '#EF4444' },
  { key: 'fear',    label: '😰 Anxious',     color: '#F59E0B' },
  { key: 'sad',     label: '😢 Confused',    color: '#60A5FA' },
];

export default function DemoController({
  demoMode,
  onToggleDemo,
  onSetEmotion,
  onTriggerHint,
  onTriggerCoach,
  onTriggerFocus,
  onSolve,
  currentEmotion,
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="demo-controller">
      {/* Header */}
      <button
        className={`demo-ctrl-toggle ${demoMode ? 'active' : ''}`}
        onClick={() => { setOpen(o => !o); onToggleDemo(); }}
      >
        {demoMode ? <Pause size={14} /> : <Play size={14} />}
        <span>{demoMode ? 'Demo ON' : 'Demo Mode'}</span>
        <Sliders size={12} style={{ marginLeft: 4, opacity: 0.6 }} />
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="demo-ctrl-panel"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.2 }}
          >
            <div className="demo-ctrl-section-title">Simulate Emotion</div>
            <div className="demo-ctrl-emotions">
              {EMOTIONS.map(e => (
                <button
                  key={e.key}
                  className={`demo-emotion-btn ${currentEmotion === e.key ? 'selected' : ''}`}
                  style={currentEmotion === e.key ? { borderColor: e.color, color: e.color, background: `${e.color}18` } : {}}
                  onClick={() => onSetEmotion(e.key)}
                >
                  {e.label}
                </button>
              ))}
            </div>

            <div className="demo-ctrl-section-title" style={{ marginTop: 12 }}>Simulate Events</div>
            <div className="demo-ctrl-events">
              <button className="demo-event-btn hint" onClick={onTriggerHint}>
                💡 Trigger Hint
              </button>
              <button className="demo-event-btn coach" onClick={onTriggerCoach}>
                🤖 AI Coach
              </button>
              <button className="demo-event-btn focus" onClick={onTriggerFocus}>
                ⚡ Focus Drop
              </button>
              <button className="demo-event-btn solve" onClick={onSolve}>
                🎉 Solve Problem
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
