import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../api';

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [dbStats, setDbStats] = useState({});
  const location = useLocation();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Fetch telemetry stats periodically so they are available application-wide
  useEffect(() => {
    const fetchStats = () => {
      api.get('/api/analytics_data')
        .then(r => setDbStats(r.data))
        .catch(() => {});
    };

    const iv = setInterval(fetchStats, 5000);
    fetchStats();
    return () => clearInterval(iv);
  }, []);

  // Determine active view from URL path
  const path = location.pathname;
  let activeView = 'workspace'; // Default to practice/workspace
  if (path.includes('dashboard')) activeView = 'dashboard';
  if (path.includes('analytics')) activeView = 'analytics';
  if (path.includes('settings')) activeView = 'settings';

  return (
    <div className={`practice-root ${theme}`}>
      <Sidebar 
         open={sidebarOpen} 
         activeView={activeView} 
         onToggle={() => setSidebarOpen(!sidebarOpen)} 
      />
      <Outlet context={{ theme, setTheme, dbStats }} />
    </div>
  );
}
