import React from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import SettingsView from '../components/SettingsView';

export default function SettingsPage() {
  const { theme, setTheme } = useOutletContext();
  const navigate = useNavigate();

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');

  return (
    <div className="practice-main">
      <div className="practice-content">
        <SettingsView theme={theme} toggleTheme={toggleTheme} onBack={() => navigate('/practice')} />
      </div>
    </div>
  );
}
