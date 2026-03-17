import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DEMO_STEPS } from './DemoOverlay';

export default function DemoTimeline({ currentStep, onJump }) {
  return (
    <div className="demo-timeline">
      <div className="demo-timeline-track">
        {/* Progress fill */}
        <motion.div
          className="demo-timeline-fill"
          initial={{ width: 0 }}
          animate={{ width: `${(currentStep / (DEMO_STEPS.length - 1)) * 100}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {DEMO_STEPS.map((step, i) => {
        const isPast = i < currentStep;
        const isCurrent = i === currentStep;
        return (
          <motion.button
            key={step.id}
            className={`demo-step-node ${isCurrent ? 'active' : ''} ${isPast ? 'past' : ''}`}
            onClick={() => onJump(i)}
            title={step.label}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            animate={isCurrent ? { scale: [1, 1.2, 1] } : { scale: 1 }}
            transition={isCurrent ? { duration: 1.5, repeat: Infinity } : {}}
          >
            <span className="demo-step-emoji">{step.icon}</span>
            <span className="demo-step-label">{step.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
