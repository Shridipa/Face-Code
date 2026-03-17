import React, { useMemo } from 'react';
import { motion } from 'framer-motion';


const EMOTION_EMOJI = {
  happy:   { emoji: '😊', color: '#22C55E', label: 'Happy' },
  neutral: { emoji: '😐', color: '#818CF8', label: 'Focused' },
  angry:   { emoji: '😡', color: '#EF4444', label: 'Frustrated' },
  sad:     { emoji: '😢', color: '#60A5FA', label: 'Sad' },
  fear:    { emoji: '😰', color: '#F59E0B', label: 'Anxious' },
  surprise:{ emoji: '😲', color: '#A78BFA', label: 'Surprised' },
  disgust: { emoji: '😒', color: '#C084FC', label: 'Disengaged' },
};

const EVENT_ICONS = {
  'hint':     '💡',
  'submit':   '✅',
  'skip':     '⏭️',
  'solution': '🎉',
};

function formatTime(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function EmotionTimeline({ events = [] }) {
  const now = useMemo(() => Date.now(), []);

  const displayEvents = events.length > 0 ? events : [
    { time: now - 300000, type: 'emotion', emotion: 'neutral', label: 'Session started' },
    { time: now - 240000, type: 'emotion', emotion: 'happy',   label: 'Problem loaded' },
    { time: now - 180000, type: 'emotion', emotion: 'neutral', label: 'Typing' },
    { time: now - 120000, type: 'emotion', emotion: 'fear',    label: 'Stuck on logic' },
    { time: now - 90000,  type: 'hint',    label:  'Hint requested' },
    { time: now - 60000,  type: 'emotion', emotion: 'neutral', label: 'Reconsidering approach' },
    { time: now - 20000,  type: 'submit',  label:  'Code submitted' },
    { time: now,          type: 'solution',label:  'Solution found!' },
  ];

  const sessionStart = displayEvents[0]?.time ?? now;

  return (
    <div className="emotion-timeline">
      <div className="timeline-line" />
      {displayEvents.map((evt, i) => {
        const emotionCfg = evt.emotion ? EMOTION_EMOJI[evt.emotion] : null;
        const evtIcon = evt.type !== 'emotion' ? EVENT_ICONS[evt.type] || '📌' : null;
        const elapsed = evt.time - sessionStart;
        const isNegative = ['angry', 'fear', 'sad', 'disgust'].includes(evt.emotion);

        return (
          <motion.div
            key={i}
            className={`timeline-event ${isNegative ? 'negative' : ''}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06, duration: 0.35 }}
          >
            <div
              className="timeline-dot"
              style={{ background: emotionCfg ? emotionCfg.color : '#6366F1' }}
            />
            <div className="timeline-emoji">
              {emotionCfg ? emotionCfg.emoji : evtIcon}
            </div>
            <div className="timeline-content">
              <span className="timeline-emotion-label">
                {emotionCfg ? emotionCfg.label : evt.label}
              </span>
              {evt.label && emotionCfg && (
                <span className="timeline-event-label">{evt.label}</span>
              )}
            </div>
            <div className="timeline-time">{formatTime(elapsed)}</div>
          </motion.div>
        );
      })}
    </div>
  );
}
