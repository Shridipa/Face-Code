import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb } from 'lucide-react';

export default function HintButton({ onClick, emotion = 'neutral', disabled = false }) {
  const getGlowColor = () => {
    const e = emotion.toLowerCase();
    if (['angry', 'fear', 'disgust', 'sad'].includes(e)) return 'shadow-fc-danger animate-pulse'; // strongly recommended
    if (['neutral', 'surprise'].includes(e)) return 'shadow-fc-warning'; // recommended
    return 'shadow-fc-accent'; // optional
  };

  const getColorClass = () => {
    const e = emotion.toLowerCase();
    if (['angry', 'fear', 'disgust', 'sad'].includes(e)) return 'text-fc-danger border-fc-danger bg-fc-danger bg-opacity-10';
    if (['neutral', 'surprise'].includes(e)) return 'text-fc-warning border-fc-warning bg-fc-warning bg-opacity-10';
    return 'text-fc-accent border-fc-accent bg-fc-accent bg-opacity-10';
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      disabled={disabled}
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-1.5 rounded-lg border text-xs font-bold transition-all shadow-lg ${getGlowColor()} ${getColorClass()} disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      <Lightbulb size={14} />
      <span>Get Hint</span>
    </motion.button>
  );
}
