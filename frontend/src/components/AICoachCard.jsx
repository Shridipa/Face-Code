import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Lightbulb, Zap, Heart, X } from 'lucide-react';

const CATEGORY_CONFIG = {
  strategy: {
    icon: Lightbulb,
    color: '#818CF8',
    bg: 'rgba(129,140,248,0.08)',
    border: 'rgba(129,140,248,0.25)',
    label: 'Strategy Hint',
  },
  motivation: {
    icon: Heart,
    color: '#22C55E',
    bg: 'rgba(34,197,94,0.08)',
    border: 'rgba(34,197,94,0.25)',
    label: 'Keep Going!',
  },
  efficiency: {
    icon: Zap,
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.25)',
    label: 'Optimize',
  },
};

export default function AICoachCard({ message, category = 'strategy', onDismiss }) {
  const cfg = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.strategy;
  const Icon = cfg.icon;

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          className="ai-coach-card"
          style={{
            background: cfg.bg,
            border: `1px solid ${cfg.border}`,
            boxShadow: `0 0 18px ${cfg.color}22`,
          }}
          initial={{ opacity: 0, x: 40, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 40, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        >
          <div className="ai-coach-header">
            <div className="ai-coach-icon-wrap" style={{ background: `${cfg.color}18`, border: `1px solid ${cfg.color}40` }}>
              <Bot size={14} style={{ color: cfg.color }} />
            </div>
            <div>
              <div className="ai-coach-title">AI Coding Coach</div>
              <div className="ai-coach-badge" style={{ color: cfg.color }}>
                <Icon size={10} /> {cfg.label}
              </div>
            </div>
            {onDismiss && (
              <button onClick={onDismiss} className="ai-coach-dismiss">
                <X size={12} />
              </button>
            )}
          </div>
          <motion.p
            className="ai-coach-message"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {message}
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
