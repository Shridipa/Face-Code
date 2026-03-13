import React, { useState } from 'react';
import { User, Bell, Shield, Monitor, Moon, Sun, Eye, Contrast } from 'lucide-react';

export default function SettingsView({ theme, toggleTheme }) {
  const [highContrast, setHighContrast] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [dataSharing, setDataSharing] = useState(false);

  // Toggle internal high-contrast state and update the DOM
  const handleContrastToggle = () => {
    const newVal = !highContrast;
    setHighContrast(newVal);
    if (newVal) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
  };

  return (
    <div className="settings-container fade-in">
      <div className="settings-header">
        <h2>Platform Settings</h2>
        <p className="subtitle">Manage your account, preferences, and accessibility.</p>
      </div>

      <div className="settings-grid">
        
        {/* Profile Settings */}
        <section className="settings-card" aria-label="Profile Settings">
          <div className="card-header">
            <h3><User size={18} color="var(--teal)" /> Account Profile</h3>
          </div>
          <div className="settings-list">
            <div className="setting-item">
              <div className="setting-info">
                <label htmlFor="display-name">Display Name</label>
                <span className="setting-desc">How you appear to the AI Mentor.</span>
              </div>
              <input id="display-name" type="text" className="setting-input" defaultValue="FaceCode User" />
            </div>
            <div className="setting-item">
              <div className="setting-info">
                <label>Email Address</label>
                <span className="setting-desc">Primary contact for notifications.</span>
              </div>
              <span className="setting-static-text">student@example.com</span>
            </div>
          </div>
        </section>

        {/* Display & Accessibility */}
        <section className="settings-card" aria-label="Display and Accessibility Settings">
          <div className="card-header">
            <h3><Eye size={18} color="var(--lavender)" /> Display & Accessibility</h3>
          </div>
          <div className="settings-list">
            <div className="setting-item interactive">
              <div className="setting-info">
                <label id="theme-label">Interface Theme</label>
                <span className="setting-desc">Switch between Light and Dark mode.</span>
              </div>
              <button 
                className="btn-toggle" 
                aria-labelledby="theme-label"
                onClick={toggleTheme}
              >
                {theme === 'light' ? <><Moon size={16}/> Dark Mode</> : <><Sun size={16}/> Light Mode</>}
              </button>
            </div>
            
            <div className="setting-item interactive">
              <div className="setting-info">
                <label id="contrast-label">High Contrast Mode</label>
                <span className="setting-desc">Improves readability for visually impaired users.</span>
              </div>
              <label className="toggle-switch" aria-labelledby="contrast-label">
                <input type="checkbox" checked={highContrast} onChange={handleContrastToggle} />
                <span className="slider round"></span>
              </label>
            </div>
          </div>
        </section>

        {/* Preferences */}
        <section className="settings-card" aria-label="Application Preferences">
          <div className="card-header">
            <h3><Monitor size={18} color="var(--blue)" /> Platform Preferences</h3>
          </div>
          <div className="settings-list">
            <div className="setting-item interactive">
              <div className="setting-info">
                <label id="notif-label">Push Notifications</label>
                <span className="setting-desc">Receive alerts for streaks and AI interventions.</span>
              </div>
              <label className="toggle-switch" aria-labelledby="notif-label">
                <input type="checkbox" checked={notifications} onChange={() => setNotifications(!notifications)} />
                <span className="slider round"></span>
              </label>
            </div>
          </div>
        </section>

        {/* Privacy & Security */}
        <section className="settings-card" aria-label="Privacy and Security">
          <div className="card-header">
            <h3><Shield size={18} color="var(--warning)" /> Privacy & Security</h3>
          </div>
          <div className="settings-list">
            <div className="setting-item interactive">
              <div className="setting-info">
                <label id="data-label">Anonymous Data Sharing</label>
                <span className="setting-desc">Help us improve the AI by sharing usage patterns.</span>
              </div>
              <label className="toggle-switch" aria-labelledby="data-label">
                <input type="checkbox" checked={dataSharing} onChange={() => setDataSharing(!dataSharing)} />
                <span className="slider round"></span>
              </label>
            </div>
            <div className="setting-item">
              <button className="btn-danger">Clear Telemetry Data</button>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
