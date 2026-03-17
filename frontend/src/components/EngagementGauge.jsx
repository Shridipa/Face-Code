import React from 'react';
import { motion } from 'framer-motion';

export default function EngagementGauge({ percentage = 0, emotion = 'neutral' }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  const getColor = () => {
    if (percentage >= 80) return '#22C55E'; // High Focus
    if (percentage >= 50) return '#F59E0B'; // Moderate
    return '#EF4444'; // Distracted
  };

  const getLabel = () => {
    if (percentage >= 80) return 'High Focus';
    if (percentage >= 50) return 'Moderate Focus';
    return 'Low Focus';
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-40 h-40">
        <svg className="w-full h-full transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-fc-border"
          />
          {/* Progress circle */}
          <motion.circle
            cx="80"
            cy="80"
            r={radius}
            stroke={getColor()}
            strokeWidth="8"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: "easeOut" }}
            fill="transparent"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span 
            key={percentage}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-3xl font-black text-white"
          >
            {Math.round(percentage)}%
          </motion.span>
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">
            Engagement
          </span>
        </div>
      </div>
      <div className="mt-4 flex flex-col items-center gap-1">
        <div className="text-sm font-bold text-white">{getLabel()}</div>
        <div className="text-[10px] text-gray-400 capitalize">Mode: {emotion}</div>
      </div>
    </div>
  );
}
