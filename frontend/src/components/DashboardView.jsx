import React, { useEffect, useState } from 'react';
import { 
  Award, Clock, Star, Activity, 
  ChevronLeft, Target, Cpu, TrendingUp
} from 'lucide-react';

const ProgressRing = ({ radius, stroke, progress, color }) => {
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <svg height={radius * 2} width={radius * 2}>
      <circle
        className="progress-ring-circle-bg"
        stroke="rgba(255,255,255,0.05)"
        fill="transparent"
        strokeWidth={stroke}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
      />
      <circle
        className="progress-ring-circle"
        stroke={color}
        fill="transparent"
        strokeWidth={stroke}
        strokeDasharray={circumference + ' ' + circumference}
        style={{ strokeDashoffset }}
        strokeLinecap="round"
        r={normalizedRadius}
        cx={radius}
        cy={radius}
      />
    </svg>
  );
};

const DashboardView = ({ stats, liveConfidence, liveEmotion, onBack }) => {
  const [animate, setAnimate] = useState(false);
  const { completions, emotion_distribution, topics } = stats;

  useEffect(() => {
    const timer = setTimeout(() => setAnimate(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const topicEntries = Object.entries(topics || {}).sort((a,b) => b[1] - a[1]);
  const strongTopics = topicEntries.filter(([, r]) => r >= 0.6);
  const weakTopics = topicEntries.filter(([, r]) => r < 0.6);
  const emotionEntries = Object.entries(emotion_distribution || {});

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>FaceCode Analytics 📊</h1>
        <button onClick={onBack} className="btn-back">
          <ChevronLeft size={18} /> Back to IDE
        </button>
      </header>

      <div className="dashboard-grid">
        {/* Performance Metrics Section */}
        <div className="glass-card metric-widget">
          <div className="card-icon-wrapper"><Award size={20}/></div>
          <div className="ring-container">
            <ProgressRing radius={45} stroke={4} progress={animate ? 75 : 0} color="var(--teal)" />
            <div className="ring-label">{completions?.streak || 0}</div>
          </div>
          <h3>Current Streak</h3>
        </div>

        <div className="glass-card metric-widget">
          <div className="card-icon-wrapper"><Star size={20}/></div>
          <div className="ring-container">
             <ProgressRing radius={45} stroke={4} progress={animate ? 90 : 0} color="var(--lavender)" />
             <div className="ring-label">{completions?.total_solved || 0}</div>
          </div>
          <h3>Total Solved</h3>
        </div>

        <div className="glass-card metric-widget">
          <div className="card-icon-wrapper"><Clock size={20}/></div>
          <div className="ring-container">
             <ProgressRing radius={45} stroke={4} progress={animate ? 60 : 0} color="#3b82f6" />
             <div className="ring-label" style={{fontSize: '1rem'}}>{completions?.avg_time || 0}s</div>
          </div>
          <h3>Average Time</h3>
        </div>

        <div className="glass-card metric-widget">
          <div className="card-icon-wrapper"><TrendingUp size={20}/></div>
          <div className="value">92%</div>
          <h3>Efficiency</h3>
        </div>

        {/* Topic Mastery Map (Replaces Difficulty Map) */}
        <div className="glass-card skill-panel" style={{ gridColumn: 'span 2' }}>
          <div className="pane-title"><Target size={18} color="var(--teal)"/> Topic Mastery Map</div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginTop: '15px' }}>
            {/* Strong Topics */}
            <div>
              <h4 style={{ color: 'var(--success)', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={16} /> Strong Topics
              </h4>
              <div className="skill-grid" style={{ gridTemplateColumns: '1fr', gap: '15px' }}>
                {strongTopics.length > 0 ? strongTopics.map(([topic, rate]) => (
                  <div key={topic} className="skill-item">
                    <div className="skill-info">
                      <span className="skill-name">{topic}</span>
                      <span className="skill-percent">{Math.round(rate * 100)}%</span>
                    </div>
                    <div className="skill-bar">
                      <div className="skill-fill" style={{ width: animate ? `${rate * 100}%` : '0%', background: `var(--teal)` }} />
                    </div>
                  </div>
                )) : <div className="empty-msg">No decisive data yet. Keep solving!</div>}
              </div>
            </div>

            {/* Needs Improvement */}
            <div>
              <h4 style={{ color: 'var(--warning)', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={16} /> Areas to Improve
              </h4>
              <div className="skill-grid" style={{ gridTemplateColumns: '1fr', gap: '15px' }}>
                {weakTopics.length > 0 ? weakTopics.map(([topic, rate]) => (
                  <div key={topic} className="skill-item">
                    <div className="skill-info">
                      <span className="skill-name">{topic}</span>
                      <span className="skill-percent">{Math.round(rate * 100)}%</span>
                    </div>
                    <div className="skill-bar">
                      <div className="skill-fill" style={{ width: animate ? `${Math.max(10, rate * 100)}%` : '0%', background: `var(--lavender)` }} />
                    </div>
                  </div>
                )) : <div className="empty-msg">No weak areas detected!</div>}
              </div>
            </div>
          </div>
        </div>

        {/* Emotional Profile Panel */}
        <div className="glass-card emotion-panel">
          <div className="pane-title"><Activity size={18} color="var(--lavender)"/> Emotional Profile</div>
          <div className="emotion-profile">
            {emotionEntries.sort((a,b) => b[1] - a[1]).slice(0, 4).map(([emo, count]) => (
              <div key={emo} className="emotion-capsule">
                 <span className="emo-icon">{emo === 'happy' ? '😊' : emo === 'sad' ? '😢' : '😐'}</span>
                 <span className="emo-name">{emo}</span>
                 <span className="emo-pct">{count} ticks</span>
              </div>
            ))}
          </div>
        </div>

        {/* Engagement Summary */}
        <div className="glass-card engagement-panel">
           <div className="pane-title"><Cpu size={18} color="var(--teal)"/> Engagement Summary</div>
           <div className="engagement-indicators">
              <div className="indicator">
                 <div className="ind-label">Live Focus ({liveConfidence || 0}%)</div>
                 <div className="ind-bar"><div className="ind-fill" style={{width: `${liveConfidence || 0}%`, background: 'var(--teal)'}}/></div>
              </div>
              <div className="indicator">
                 <div className="ind-label">Current State ({liveEmotion || 'neutral'})</div>
                 <div className="ind-bar"><div className="ind-fill" style={{width: `${['happy', 'neutral'].includes(liveEmotion) ? 85 : 40}%`, background: 'var(--lavender)'}}/></div>
              </div>
           </div>
        </div>
      </div>

      <footer className="dashboard-footer">
        <div className="timestamp">Cycle {new Date().toLocaleTimeString()}</div>
        <div className="branding">FaceCode Adaptive Engine v2.5</div>
      </footer>
    </div>
  );
};

export default DashboardView;
