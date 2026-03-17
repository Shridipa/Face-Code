import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Bot, Lightbulb, Zap, CheckCircle, X, ChevronRight, Sparkles } from 'lucide-react';

const DEMO_STEPS = [
  { id: 0, icon: '🚀', label: 'Start' },
  { id: 1, icon: '📸', label: 'Camera' },
  { id: 2, icon: '📊', label: 'Engagement' },
  { id: 3, icon: '💻', label: 'Problem' },
  { id: 4, icon: '😡', label: 'Frustration' },
  { id: 5, icon: '💡', label: 'Hint' },
  { id: 6, icon: '🤖', label: 'Coach' },
  { id: 7, icon: '🎯', label: 'Focus' },
  { id: 8, icon: '🎉', label: 'Solved' },
];

const STEP_CONFIGS = [
  {
    title: 'Welcome to FaceCode Demo 🚀',
    body: 'This platform understands your emotions while you solve coding problems.',
    sub: "Let's walk through how it works.",
    cta: 'Start Demo',
    highlight: null,
    tooltip: null,
    emotion: 'neutral',
    engagement: 60,
  },
  {
    title: 'Step 1: Emotion Detection 📸',
    body: 'FaceCode analyzes your facial expressions in real-time to detect frustration, focus, and confusion.',
    sub: 'The camera panel on the right glows to reflect your detected emotion.',
    cta: 'Next →',
    highlight: 'camera',
    tooltip: '🎥 Live emotion scanning active',
    emotion: 'happy',
    engagement: 72,
  },
  {
    title: 'Step 2: Engagement Tracking 📊',
    body: 'Your focus level is tracked in real-time and displayed as a percentage.',
    sub: 'Watch the engagement meter climb as you get into a flow state.',
    cta: 'Next →',
    highlight: 'engagement',
    tooltip: '📈 Engagement rising...',
    emotion: 'neutral',
    engagement: 65,
  },
  {
    title: 'Step 3: Coding Environment 💻',
    body: 'Solve coding problems just like LeetCode — with full test case support and multi-language execution.',
    sub: 'Run, Submit, and get instant feedback.',
    cta: 'Next →',
    highlight: 'problem',
    tooltip: '⚡ LeetCode-compatible engine',
    emotion: 'neutral',
    engagement: 70,
  },
  {
    title: 'Step 4: Frustration Detected 😡',
    body: 'FaceCode detects when you\'re struggling. Engagement drops, and the system prepares assistance.',
    sub: 'The hint button starts pulsing to draw your attention.',
    cta: 'Next →',
    highlight: 'hint-btn',
    tooltip: '⚠️ Frustration detected — hint ready',
    emotion: 'angry',
    engagement: 28,
  },
  {
    title: 'Step 5: Adaptive Hints 💡',
    body: 'Context-aware hints appear based on the problem and your struggle patterns.',
    sub: 'Hints get progressively more specific as frustration persists.',
    cta: 'Next →',
    highlight: 'hints-panel',
    tooltip: '💡 3 hints unlocked based on emotion state',
    emotion: 'fear',
    engagement: 35,
  },
  {
    title: 'Step 6: AI Coding Coach 🤖',
    body: 'When frustration spikes for several readings, the AI Coach slides in with structured guidance.',
    sub: 'Strategy advice, motivation, and efficiency tips tailored to the problem.',
    cta: 'Next →',
    highlight: 'coach',
    tooltip: '🤖 AI Coach activated after 3 negative readings',
    emotion: 'fear',
    engagement: 38,
  },
  {
    title: 'Step 7: Focus Recovery ⚡',
    body: 'If you go idle for 60s or engagement drops below 30%, the Focus Recovery system triggers.',
    sub: 'A 20-second reset timer helps you mentally reboot before continuing.',
    cta: 'Next →',
    highlight: 'focus',
    tooltip: '🧘 Focus recovery: 20s reset',
    emotion: 'sad',
    engagement: 22,
  },
  {
    title: 'Problem Solved! 🎉',
    body: 'You solved the problem. FaceCode captures the full session summary.',
    sub: 'Solve Time · Emotion · Engagement score all logged for analytics.',
    cta: 'View Dashboard →',
    highlight: 'success',
    tooltip: null,
    emotion: 'happy',
    engagement: 87,
  },
];

export { DEMO_STEPS, STEP_CONFIGS };
export default function DemoOverlay({ step, onNext, onClose, isIntro }) {
  const cfg = STEP_CONFIGS[step] || STEP_CONFIGS[0];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step}
        className="demo-overlay-card"
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -16, scale: 0.97 }}
        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      >
        <button className="demo-overlay-close" onClick={onClose}>
          <X size={14} />
        </button>

        <div className="demo-overlay-step-badge">
          Step {step + 1} / {STEP_CONFIGS.length}
        </div>

        <div className="demo-overlay-icon">
          {DEMO_STEPS[step]?.icon || '🚀'}
        </div>

        <h2 className="demo-overlay-title">{cfg.title}</h2>
        <p className="demo-overlay-body">{cfg.body}</p>
        {cfg.sub && <p className="demo-overlay-sub">{cfg.sub}</p>}

        {cfg.tooltip && (
          <motion.div
            className="demo-tooltip-pill"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            {cfg.tooltip}
          </motion.div>
        )}

        <div className="demo-overlay-actions">
          <motion.button
            className="demo-btn-primary"
            onClick={onNext}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            {cfg.cta} <ChevronRight size={14} />
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
