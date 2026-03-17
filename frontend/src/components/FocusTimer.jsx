import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const RADIUS = 44;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function FocusTimer({ seconds = 20, onComplete }) {
  const [remaining, setRemaining] = useState(seconds);
  const intervalRef = useRef(null);

  useEffect(() => {
    setRemaining(seconds);
    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          if (onComplete) onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [seconds, onComplete]);

  const progress = remaining / seconds;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  return (
    <div className="focus-timer-wrap">
      <svg width="110" height="110" viewBox="0 0 110 110">
        {/* Background ring */}
        <circle
          cx="55" cy="55" r={RADIUS}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="6"
        />
        {/* Progress ring */}
        <motion.circle
          cx="55" cy="55" r={RADIUS}
          fill="none"
          stroke="#818CF8"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={strokeDashoffset}
          style={{ transform: 'rotate(-90deg)', transformOrigin: '55px 55px' }}
          transition={{ duration: 0.9, ease: 'linear' }}
        />
      </svg>
      <div className="focus-timer-number">
        {remaining > 0 ? remaining : '🚀'}
      </div>
    </div>
  );
}
