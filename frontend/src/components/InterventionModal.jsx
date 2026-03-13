import React from 'react';
import { AlertCircle, HelpCircle } from 'lucide-react';

const InterventionModal = ({ onAccept, onDecline }) => {
  return (
    <div className="modal-overlay">
      <div className="intervention-modal">
        <div className="modal-icon">
          <AlertCircle size={48} color="#f59e0b" />
        </div>
        <h2>Take a deep breath?</h2>
        <p>
          I've noticed you've been showing signs of stress or fear for a while now. 
          Sometimes it's better to tackle a slightly easier challenge to regain your flow.
        </p>
        <div className="modal-question">
          <HelpCircle size={18} /> Would you like to switch to an easier problem?
        </div>
        <div className="modal-actions">
          <button className="btn-modal-secondary" onClick={onDecline}>Keep Trying</button>
          <button className="btn-modal-primary" onClick={onAccept}>Yes, Switch Port</button>
        </div>
      </div>
    </div>
  );
};

export default InterventionModal;
