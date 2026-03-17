import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Swords, PieChart, Settings, Menu, X, Brain, Home } from 'lucide-react';
import FaceCodeLogo from './FaceCodeLogo';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', view: 'dashboard', tooltip: 'Live session overview' },
  { icon: Swords,          label: 'Challenges', view: 'workspace', tooltip: 'Coding workspace' },
  { icon: PieChart,        label: 'Analytics', view: 'analytics',  tooltip: 'Performance insights' },
  { icon: Settings,        label: 'Settings', view: 'settings',   tooltip: 'Personalization options' },
];

const Tooltip = ({ text, visible }) => (
  <AnimatePresence>
    {visible && (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -10 }}
        className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded shadow-lg whitespace-nowrap z-50 pointer-events-none border border-gray-700"
      >
        {text}
      </motion.div>
    )}
  </AnimatePresence>
);

export default function Sidebar({ open, onToggle, activeView }) {
  const navigate = useNavigate();
  const [hoveredItem, setHoveredItem] = useState(null);

  return (
    <motion.aside
      className={`relative h-screen bg-fc-card border-r border-fc-border flex flex-col transition-all duration-300 ease-in-out z-40 ${open ? 'w-64' : 'w-16'}`}
      initial={false}
      animate={{ width: open ? 256 : 64 }}
    >
      {/* Brand */}
      <div className="flex items-center justify-between p-4 border-b border-fc-border h-16">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex-shrink-0 flex items-center justify-center">
            <FaceCodeLogo size={28} />
          </div>
          <AnimatePresence>
            {open && (
              <motion.span
                className="text-lg font-extrabold bg-gradient-to-r from-fc-primary to-fc-accent bg-clip-text text-transparent whitespace-nowrap"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                FaceCode
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 flex flex-col gap-1 p-2 overflow-y-auto overflow-x-hidden">
        {NAV_ITEMS.map(({ icon: Icon, label, view, tooltip }) => {
          const isActive = activeView === view;
          return (
            <div key={view} className="relative group">
              <button
                className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all relative ${isActive ? 'bg-fc-primary bg-opacity-10 text-fc-primary' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'}`}
                onClick={() => navigate(view === 'workspace' ? '/practice' : `/${view}`)}
                onMouseEnter={() => !open && setHoveredItem(view)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <div className={`p-1 rounded-lg transition-colors ${isActive ? 'bg-fc-primary text-white shadow-sm' : ''}`}>
                  <Icon size={20} />
                </div>
                {open && (
                  <motion.span
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    className="font-medium text-sm whitespace-nowrap"
                  >
                    {label}
                  </motion.span>
                )}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-fc-primary rounded-l-full"
                  />
                )}
              </button>
              <Tooltip text={tooltip} visible={hoveredItem === view} />
            </div>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="p-2 border-t border-fc-border flex flex-col gap-1">
        <div className="relative group">
          <button
            className="w-full flex items-center gap-3 p-2.5 rounded-xl text-gray-400 hover:bg-red-500 hover:bg-opacity-10 hover:text-red-400 transition-all"
            onClick={() => navigate('/')}
            onMouseEnter={() => !open && setHoveredItem('home')}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <div className="p-1 rounded-lg">
              <Home size={20} />
            </div>
            {open && (
              <motion.span
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                className="font-medium text-sm whitespace-nowrap"
              >
                Back to Home
              </motion.span>
            )}
          </button>
          <Tooltip text="Return to landing page" visible={hoveredItem === 'home'} />
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 px-3 py-2 text-[10px] uppercase tracking-wider font-bold text-fc-accent"
            >
              <Brain size={12} className="animate-pulse" />
              <span>AI Analysis Active</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.aside>
  );
}
