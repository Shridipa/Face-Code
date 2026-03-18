import React from 'react';
import { AlertCircle, HelpCircle, ArrowDown } from 'lucide-react';
import { motion } from 'framer-motion';

const InterventionModal = ({ onAccept, onDecline }) => {
  return (
    <div className="modal-overlay">
      <motion.div 
        className="intervention-modal border-fc-warning border-opacity-30"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
      >
        <div className="modal-icon bg-fc-warning bg-opacity-10 p-4 rounded-full mb-4">
          <AlertCircle size={48} className="text-fc-warning" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Feeling Stuck?</h2>
        <p className="text-gray-400 text-sm mb-6 text-center">
          I've noticed you've been showing signs of stress or frustration. 
          Sometimes it's better to tackle an easier challenge to regain your flow!
        </p>
        
        <div className="bg-gray-900 rounded-xl p-4 mb-6 border border-gray-800 flex items-center justify-center gap-3">
           <div className="text-sm font-extrabold text-fc-warning uppercase tracking-widest bg-fc-warning bg-opacity-10 px-3 py-1 rounded-lg border border-fc-warning border-opacity-20 flex items-center gap-2">
              <ArrowDown size={12} />
              Switch to Easier
           </div>
        </div>

        <div className="modal-actions w-full flex gap-3">
          <button className="flex-1 py-3 px-4 rounded-xl bg-gray-800 text-gray-400 font-bold hover:bg-gray-700 transition-all" onClick={onDecline}>
            Keep Trying
          </button>
          <button className="flex-1 py-3 px-4 rounded-xl bg-fc-warning text-white font-bold hover:bg-opacity-90 shadow-lg shadow-fc-warning/20 transition-all" onClick={onAccept}>
            Yes, Switch Problem
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default InterventionModal;
