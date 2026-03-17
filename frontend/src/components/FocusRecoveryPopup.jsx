import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, X } from 'lucide-react';
import FocusTimer from './FocusTimer';

export default function FocusRecoveryPopup({ onIgnore, onComplete }) {
  const [phase, setPhase] = useState('prompt'); // 'prompt' | 'timer' | 'done'

  const handleStart = () => setPhase('timer');
  const handleTimerDone = () => setPhase('done');
  const handleContinue = () => { if (onComplete) onComplete(); };

  return (
    <div className="focus-overlay">
      <motion.div
        className="focus-popup"
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 30 }}
        transition={{ type: 'spring', stiffness: 240, damping: 24 }}
      >
        {phase === 'prompt' && (
          <>
            <div className="focus-popup-icon">
              <Zap size={30} color="#818CF8" />
            </div>
            <h2 className="focus-popup-title">Focus Recovery</h2>
            <p className="focus-popup-body">
              It looks like you've been away for a bit or your engagement has dropped.
              A quick 20-second reset can help you get back in the zone.
            </p>
            <p className="focus-popup-hint">
              Take a deep breath and re-read the problem statement.
            </p>
            <div className="focus-popup-actions">
              <button className="focus-btn-primary" onClick={handleStart}>
                Start Focus Reset
              </button>
              <button className="focus-btn-secondary" onClick={onIgnore}>
                <X size={14} /> Ignore
              </button>
            </div>
          </>
        )}

        {phase === 'timer' && (
          <>
            <h2 className="focus-popup-title">Refocus Timer</h2>
            <p className="focus-popup-body" style={{ marginBottom: '1.5rem' }}>
              Close your eyes, breathe deeply, then re-read the problem.
            </p>
            <FocusTimer seconds={20} onComplete={handleTimerDone} />
          </>
        )}

        {phase === 'done' && (
          <>
            <div className="focus-popup-icon" style={{ fontSize: '2.5rem' }}>🚀</div>
            <h2 className="focus-popup-title">Ready to Continue?</h2>
            <p className="focus-popup-body">
              Great reset! You've cleared your mind. Now go crack that problem!
            </p>
            <div className="focus-popup-actions">
              <button className="focus-btn-primary" onClick={handleContinue}>
                Back to Coding
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
