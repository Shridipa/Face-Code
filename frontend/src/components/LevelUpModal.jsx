import React from 'react';
import { Trophy, ArrowUpRight, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LevelUpModal = ({ currentDifficulty, onAccept, onDecline }) => {
  const nextDiff = currentDifficulty.toLowerCase() === 'easy' ? 'Medium' : 'Hard';
  
  return (
    <div className="modal-overlay">
      <motion.div 
        className="intervention-modal border-fc-primary border-opacity-30"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
      >
        <div className="modal-icon bg-fc-primary bg-opacity-10 p-4 rounded-full mb-4">
          <Trophy size={48} className="text-fc-primary" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Masterful Performance!</h2>
        <p className="text-gray-400 text-sm mb-6 text-center">
          You've conquered this <span className="text-fc-primary font-bold">{currentDifficulty}</span> challenge with great confidence. 
          Ready to push your boundaries?
        </p>
        
        <div className="bg-gray-900 rounded-xl p-4 mb-6 border border-gray-800 flex items-center justify-center gap-4">
           <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">{currentDifficulty}</div>
           <ArrowUpRight size={16} className="text-fc-primary" />
           <div className="text-sm font-extrabold text-fc-primary uppercase tracking-widest bg-fc-primary bg-opacity-10 px-3 py-1 rounded-lg border border-fc-primary border-opacity-20 flex items-center gap-2">
              <Zap size={12} />
              {nextDiff}
           </div>
        </div>

        <div className="modal-actions w-full flex gap-3">
          <button className="flex-1 py-3 px-4 rounded-xl bg-gray-800 text-gray-400 font-bold hover:bg-gray-700 transition-all" onClick={onDecline}>
            Stay on {currentDifficulty}
          </button>
          <button className="flex-1 py-3 px-4 rounded-xl bg-fc-primary text-white font-bold hover:bg-opacity-90 shadow-lg shadow-fc-primary/20 transition-all flex items-center justify-center gap-2" onClick={() => onAccept(nextDiff.toLowerCase())}>
            Challenge Me!
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default LevelUpModal;
