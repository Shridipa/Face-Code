import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const EMOTION_MAP = {
  happy:    { label: '😊 Focused',     color: '#22C55E' },
  neutral:  { label: '😐 Neutral',     color: '#6366F1' },
  angry:    { label: '😡 Frustrated',  color: '#EF4444' },
  sad:      { label: '😢 Struggling',  color: '#60A5FA' },
  fear:     { label: '😰 Anxious',     color: '#F59E0B' },
  surprise: { label: '😲 Surprised',   color: '#818CF8' },
  disgust:  { label: '😤 Annoyed',     color: '#C084FC' },
};

export default function EngagementMeter({ confidence = 50, emotion = 'neutral' }) {
  const r = 42;
  const circ = 2 * Math.PI * r;
  const offset = circ - (confidence / 100) * circ;
  
  const color = confidence >= 70 ? '#22C55E'
              : confidence >= 40 ? '#F59E0B'
              : '#EF4444';

  const emotionInfo = EMOTION_MAP[emotion] || EMOTION_MAP.neutral;

  return (
    <div className="engagement-meter">
      <div className="em-circle-wrap">
        <svg viewBox="0 0 100 100" className="em-svg" aria-label={`Engagement ${confidence}%`}>
          {/* Track */}
          <circle
            cx={50} cy={50} r={r}
            fill="none"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth={8}
          />
          {/* Progress */}
          <motion.circle
            cx={50} cy={50} r={r}
            fill="none"
            stroke={color}
            strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
          />
          {/* Glow filter */}
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
        </svg>
        <div className="em-center">
          <motion.div
            className="em-pct"
            key={confidence}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            style={{ color }}
          >
            {confidence}%
          </motion.div>
          <div className="em-label">Engagement</div>
        </div>
      </div>
      <motion.div
        className="em-emotion-badge"
        key={emotion}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        style={{
          color: emotionInfo.color,
          borderColor: emotionInfo.color + '40',
          background: emotionInfo.color + '12',
        }}
      >
        {emotionInfo.label}
      </motion.div>
    </div>
  );
}
