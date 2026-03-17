import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Lightbulb, X } from 'lucide-react';

const TOAST_ICONS = {
  success: <CheckCircle size={16} color="#22C55E" />,
  error: <XCircle size={16} color="#EF4444" />,
  hint: <Lightbulb size={16} color="#F59E0B" />,
  info: <Lightbulb size={16} color="#6366F1" />,
};

const TOAST_COLORS = {
  success: '#22C55E',
  error: '#EF4444',
  hint: '#F59E0B',
  info: '#6366F1',
};

export default function Toast({ toasts, onRemove }) {
  return (
    <div className="toast-portal">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            className="toast-item"
            style={{ borderLeftColor: TOAST_COLORS[toast.type] || '#6366F1' }}
            initial={{ opacity: 0, x: 80, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.9 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="toast-icon">{TOAST_ICONS[toast.type] || TOAST_ICONS.info}</div>
            <div className="toast-body">
              {toast.title && <div className="toast-title">{toast.title}</div>}
              <div className="toast-msg">{toast.message}</div>
            </div>
            <button className="toast-close" onClick={() => onRemove(toast.id)}>
              <X size={12} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* Hook to use toasts */
export function useToast() {
  const [toasts, setToasts] = React.useState([]);
  
  const addToast = React.useCallback((type, message, title) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message, title }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const removeToast = React.useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
}
