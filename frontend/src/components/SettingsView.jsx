import React, { useState } from 'react';
import { 
  User, Bell, Shield, Monitor, Moon, Sun, 
  Eye, Contrast, Camera, Laptop, BellRing, Settings 
} from 'lucide-react';
import { motion } from 'framer-motion';

const SettingCard = ({ icon: Icon, title, description, children }) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="fc-card p-6 flex flex-col gap-6"
  >
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-lg bg-fc-primary bg-opacity-10 text-fc-primary">
        <Icon size={20} />
      </div>
      <div className="flex flex-col">
        <h3 className="text-lg font-bold">{title}</h3>
        <p className="text-xs text-gray-500 font-medium">{description}</p>
      </div>
    </div>
    <div className="flex flex-col gap-4">
      {children}
    </div>
  </motion.div>
);

const ToggleRow = ({ label, description, checked, onChange, icon: Icon }) => (
  <div className="flex items-center justify-between py-2">
    <div className="flex items-center gap-3">
      {Icon && <Icon size={16} className="text-gray-500" />}
      <div className="flex flex-col">
        <span className="text-sm font-bold text-gray-200">{label}</span>
        {description && <span className="text-[10px] text-gray-500">{description}</span>}
      </div>
    </div>
    <button 
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-5 rounded-full transition-colors duration-200 focus:outline-none ${checked ? 'bg-fc-primary' : 'bg-gray-700'}`}
    >
      <motion.div 
        animate={{ x: checked ? 22 : 2 }}
        className="absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm"
      />
    </button>
  </div>
);

export default function SettingsView({ theme, toggleTheme }) {
  const [highContrast, setHighContrast] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [hintsAlerts, setHintsAlerts] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [privacyMode, setPrivacyMode] = useState(false);

  const handleContrastToggle = (val) => {
    setHighContrast(val);
    if (val) document.body.classList.add('high-contrast');
    else document.body.classList.remove('high-contrast');
  };

  return (
    <div className="p-8 max-w-5xl mx-auto flex flex-col gap-8 h-full overflow-y-auto scrollbar-hide">
      <header className="flex flex-col gap-1">
        <h2 className="text-3xl flex items-center gap-3">
          Platform Settings <Settings size={24} className="text-fc-primary" />
        </h2>
        <p className="text-gray-500 text-sm font-medium">Manage your workspace preferences and accessibility options.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Profile Settings */}
        <SettingCard 
          icon={User} 
          title="Account Profile" 
          description="How you appear to the AI Mentor."
        >
          <div className="flex flex-col gap-2">
             <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Display Name</label>
             <input 
              type="text" 
              defaultValue="FaceCode User"
              className="bg-gray-800 border border-fc-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-fc-primary transition-colors"
             />
          </div>
          <div className="flex flex-col gap-1">
             <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Email Address</label>
             <span className="text-sm text-gray-400 px-1">student@example.com</span>
          </div>
        </SettingCard>

        {/* Display & Accessibility */}
        <SettingCard 
          icon={Eye} 
          title="Display & Accessibility" 
          description="Visual preferences and readability."
        >
          <ToggleRow 
            label="Dark Mode" 
            icon={Moon}
            checked={theme === 'dark'} 
            onChange={toggleTheme} 
          />
          <ToggleRow 
            label="High Contrast" 
            icon={Contrast}
            description="WCAG compliant readability"
            checked={highContrast} 
            onChange={handleContrastToggle} 
          />
        </SettingCard>

        {/* AI Camera Settings */}
        <SettingCard 
          icon={Camera} 
          title="Camera & Privacy" 
          description="Manage emotion detection and webcam."
        >
          <ToggleRow 
            label="Emotion Detection" 
            checked={cameraEnabled} 
            onChange={setCameraEnabled} 
          />
          <ToggleRow 
            label="Privacy Mode" 
            description="Blur background during sessions"
            checked={privacyMode} 
            onChange={setPrivacyMode} 
          />
        </SettingCard>

        {/* Notification Settings */}
        <SettingCard 
          icon={BellRing} 
          title="Notifications" 
          description="Stay updated with hints and alerts."
        >
          <ToggleRow 
            label="Hint Notifications" 
            checked={hintsAlerts} 
            onChange={setHintsAlerts} 
          />
          <ToggleRow 
            label="Session Alerts" 
            checked={notifications} 
            onChange={setNotifications} 
          />
        </SettingCard>
        
        <div className="md:col-span-2 flex justify-end gap-3 mt-4">
           <button className="fc-btn-secondary text-sm">Reset to Defaults</button>
           <button className="fc-btn-primary text-sm px-8">Save Changes</button>
        </div>
      </div>
    </div>
  );
}
