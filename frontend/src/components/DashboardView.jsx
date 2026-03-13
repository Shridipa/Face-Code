import React, { useEffect, useState } from 'react';
import { 
  Flame, Clock, Star, Activity, 
  Target, Cpu, TrendingUp
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

const AnimatedNumber = ({ value, suffix = '' }) => {
  // Initialize to value so it doesn't need a synchronous jump to end if unchanged
  const [count, setCount] = useState(parseFloat(value) || 0);
  
  useEffect(() => {
    let start = count;
    const end = parseFloat(value) || 0;
    if (start === end) {
      return;
    }
    const duration = 1200;
    let startTime = null;
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const current = Math.min((progress / duration) * end, end);
      setCount(current);
      if (progress < duration) requestAnimationFrame(animate);
      else setCount(end);
    };
    requestAnimationFrame(animate);
  }, [value, count]);
  
  // Format based on whether it's an integer or float
  const displayVal = Number.isInteger(parseFloat(value)) ? Math.floor(count) : count.toFixed(1);
  return <span className="value">{displayVal}{suffix}</span>;
};

const DashboardView = ({ stats, liveConfidence, liveEmotion }) => {
  const { completions, emotion_distribution, topics } = stats;

  const topicEntries = Object.entries(topics || {}).sort((a,b) => b[1] - a[1]);
  
  // Recharts Data config
  const emotionData = Object.entries(emotion_distribution || {}).map(([name, value]) => ({ name, value }));
  const COLORS = {
    happy: '#10b981', neutral: '#8892b0', sad: '#6366f1', 
    angry: '#ef4444', fear: '#f59e0b', surprise: '#e0b0ff', disgust: '#8b5cf6'
  };
  const EMOJIS = {
    happy: '🙂', neutral: '😐', sad: '😢', 
    angry: '😡', fear: '😨', surprise: '😲', disgust: '🤢'
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>FaceCode Analytics 📊</h1>
      </header>

      {/* Hero Section: Primary Metrics */}
      <div className="hero-metrics">
        <div className="glass-card hero-widget">
          <div className="widget-icon"><Flame size={24} color="var(--warning)"/></div>
          <div className="widget-info">
            <AnimatedNumber value={completions?.streak || 0} />
            <span className="widget-label">Current Streak</span>
          </div>
        </div>
        <div className="glass-card hero-widget">
          <div className="widget-icon"><Star size={24} color="var(--lavender)"/></div>
          <div className="widget-info">
            <AnimatedNumber value={completions?.total_solved || 0} />
            <span className="widget-label">Total Solved</span>
          </div>
        </div>
        <div className="glass-card hero-widget">
          <div className="widget-icon"><Clock size={24} color="#3b82f6"/></div>
          <div className="widget-info">
             <AnimatedNumber value={completions?.avg_time || 0} suffix="s" />
             <span className="widget-label">Average Time</span>
          </div>
        </div>
        <div className="glass-card hero-widget">
          <div className="widget-icon"><TrendingUp size={24} color="var(--success)"/></div>
          <div className="widget-info">
            <AnimatedNumber value={92} suffix="%" />
            <span className="widget-label">Efficiency</span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid layout-restructure">
        {/* Skill & Topic Mastery Heatmap */}
        <div className="glass-card topic-mastery-panel">
          <div className="pane-title"><Target size={18} color="var(--teal)"/> Topic Mastery Heatmap</div>
          {topicEntries.length > 0 ? (
            <div className="heatmap-grid">
              {topicEntries.map(([topic, rate]) => {
                const pct = Math.round(rate * 100);
                let heatClass = 'heat-weak';
                if (pct >= 80) heatClass = 'heat-strong';
                else if (pct >= 50) heatClass = 'heat-moderate';

                return (
                  <div key={topic} className={`heatmap-cell ${heatClass}`}>
                    <span className="heat-topic">{topic}</span>
                    <span className="heat-score">{pct}%</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-msg">Waiting for sufficient challenge data...</div>
          )}
        </div>

        {/* Secondary Groups: Emotional & Engagement */}
        <div className="secondary-panels">
          <div className="glass-card emotion-panel">
            <div className="pane-title"><Activity size={18} color="var(--lavender)"/> Emotional Profile</div>
            <div className="recharts-wrapper">
              {emotionData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={emotionData}
                      cx="50%" cy="50%"
                      innerRadius={50} outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {emotionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[entry.name.toLowerCase()] || '#8884d8'} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                 <div className="empty-msg" style={{height: 200, display:'flex', alignItems:'center', justifyContent:'center'}}>No emotion recorded yet</div>
              )}
            </div>
            <div className="emotion-legend">
               {emotionData.map(e => (
                 <div key={e.name} className="legend-item">
                    <span>{EMOJIS[e.name.toLowerCase()] || '❓'}</span>
                    <span className="legend-lbl">{e.name}</span>
                 </div>
               ))}
            </div>
          </div>

          <div className="glass-card engagement-panel">
             <div className="pane-title"><Cpu size={18} color="var(--teal)"/> Engagement Summary</div>
             
             <div className="engage-stat">
                <div className="ind-header">
                  <span>Live Focus Level</span>
                  <strong>{liveConfidence || 0}%</strong>
                </div>
                <div className="progress-bar tall-bar">
                  <div className="progress-fill" style={{ width:`${liveConfidence || 0}%`, background:'var(--teal)' }}/>
                </div>
             </div>

             <div className="engage-stat mt-4">
                <div className="ind-header">
                  <span>Current State</span>
                  <span className={`state-badge state-${liveEmotion || 'neutral'}`}>
                    {EMOJIS[(liveEmotion || 'neutral').toLowerCase()] || '😐'} {(liveEmotion || 'neutral').toUpperCase()}
                  </span>
                </div>
             </div>
          </div>
        </div>
      </div>

      <footer className="dashboard-footer text-center">
        <div className="timestamp">Last Synced: {new Date().toLocaleTimeString()}</div>
        <div className="branding mt-2">
           <span className="logo-icon inline-app-icon">🧠</span> FaceCode — Next-Gen Adaptive Learning
        </div>
      </footer>
    </div>
  );
};

export default DashboardView;
