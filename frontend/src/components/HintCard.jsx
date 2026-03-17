import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, X, Sparkles } from 'lucide-react';

export default function HintCard({ hint, onClose, visible, onViewAll }) {
  return (
    <AnimatePresence>
      {visible && hint && (
        <motion.div
          initial={{ opacity: 0, y: -20, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -20, height: 0 }}
          className="overflow-hidden mb-4"
        >
          <div className="bg-fc-card border border-fc-warning border-opacity-30 rounded-xl p-4 shadow-2xl relative bg-opacity-60 backdrop-blur-md">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-fc-warning">
                <Sparkles size={16} />
                <span className="text-[10px] font-bold uppercase tracking-widest">AI Adaptive Hint</span>
              </div>
              <button 
                onClick={onClose}
                className="p-1 hover:bg-white hover:bg-opacity-10 rounded-full text-gray-400 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
            
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-lg bg-fc-warning bg-opacity-10 flex items-center justify-center text-fc-warning flex-shrink-0">
                 <Lightbulb size={18} />
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium text-gray-200 leading-relaxed">
                  {hint}
                </p>
                <div className="flex items-center justify-between mt-1">
                  <div className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">
                    Pro-Tip: Try implementing a hash map for O(n) lookup.
                  </div>
                  <button 
                    onClick={onViewAll}
                    className="text-[10px] font-extrabold text-fc-warning hover:underline uppercase tracking-widest"
                  >
                    View All Hints →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
