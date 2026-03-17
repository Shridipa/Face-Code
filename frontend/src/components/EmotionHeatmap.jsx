import React from 'react';
import { motion } from 'framer-motion';

const EMOTIONS = ['Happy', 'Neutral', 'Confused', 'Frustrated', 'Stressed'];
const COLORS = {
  Happy: 'bg-green-500',
  Neutral: 'bg-fc-primary',
  Confused: 'bg-purple-500',
  Frustrated: 'bg-fc-danger',
  Stressed: 'bg-fc-warning'
};

export default function EmotionHeatmap() {
  // Generating dummy data for the grid (7 days x 24 hours or just a sample)
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const grid = Array.from({ length: 5 }, () => Array.from({ length: 14 }, () => Math.random()));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 overflow-x-auto pb-4 scrollbar-hide">
        <div className="flex flex-col gap-2 min-w-[600px]">
          {EMOTIONS.map((emotion, rowIndex) => (
            <div key={emotion} className="flex items-center gap-4">
              <span className="w-20 text-[10px] font-bold text-gray-500 uppercase text-right tracking-tighter">
                {emotion}
              </span>
              <div className="flex-1 flex gap-1">
                {grid[rowIndex].map((val, colIndex) => (
                  <motion.div
                    key={`${rowIndex}-${colIndex}`}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: val }}
                    transition={{ delay: (rowIndex * 14 + colIndex) * 0.01 }}
                    className={`h-6 flex-1 rounded-sm ${COLORS[emotion]}`}
                    style={{ opacity: 0.1 + val * 0.9 }}
                    title={`${emotion} level: ${Math.round(val * 100)}%`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex items-center justify-between text-[10px] font-bold text-gray-500 uppercase tracking-widest px-24">
         <span>Last 14 Sessions</span>
         <div className="flex items-center gap-2">
            <span>Low intensity</span>
            <div className="flex gap-0.5">
               <div className="w-2 h-2 rounded-sm bg-gray-800" />
               <div className="w-2 h-2 rounded-sm bg-fc-primary opacity-30" />
               <div className="w-2 h-2 rounded-sm bg-fc-primary opacity-60" />
               <div className="w-2 h-2 rounded-sm bg-fc-primary" />
            </div>
            <span>High</span>
         </div>
      </div>
    </div>
  );
}
