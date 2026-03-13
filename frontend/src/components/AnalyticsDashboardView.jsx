import React, { useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, ZAxis
} from 'recharts';
import { Target, Activity, MoveUpRight, Zap, Target as TargetIcon } from 'lucide-react';

const COLORS = {
  blue: '#00BFA6',
  green: '#10b981',
  yellow: '#f59e0b',
  red: '#ef4444',
  purple: '#C3AED6',
  navy: '#0A192F',
  white: '#F9FAFB'
};

const EMOTION_COLORS = {
  happy: COLORS.green,
  neutral: '#8892b0',
  angry: COLORS.red,
  sad: COLORS.yellow,
  fear: COLORS.yellow,
  surprise: COLORS.purple
};

const EMOTION_EMOJIS = {
  happy: '🙂', neutral: '😐', angry: '😡', sad: '😢', fear: '😨', surprise: '😲'
};

const PROGRESS_RINGS = {
  circumference: 2 * Math.PI * 40
};

export default function AnalyticsDashboardView({ stats }) {
  const { completions = 0, current_streak = 0, emotion_distribution = {} } = stats || {};

  // Dummy efficiency trend data since we don't have historical points
  const efficiencyData = [
    { name: 'Mon', completionTime: 45, accuracy: 80 },
    { name: 'Tue', completionTime: 40, accuracy: 82 },
    { name: 'Wed', completionTime: 38, accuracy: 85 },
    { name: 'Thu', completionTime: 35, accuracy: 90 },
    { name: 'Fri', completionTime: 30, accuracy: 95 },
  ];

  const emotionData = useMemo(() => {
    return Object.entries(emotion_distribution).map(([key, val]) => ({
      name: key,
      value: val,
      fill: EMOTION_COLORS[key] || EMOTION_COLORS.neutral,
      emoji: EMOTION_EMOJIS[key] || '😐'
    })).sort((a,b) => b.value - a.value);
  }, [emotion_distribution]);

  const streakPercent = Math.min((current_streak / 30) * 100, 100);
  const ringOffset = PROGRESS_RINGS.circumference - (streakPercent / 100) * PROGRESS_RINGS.circumference;

  return (
    <div className="analytics-container fade-in">
      <div className="analytics-header">
        <h2>Advanced Analytics</h2>
        <p className="subtitle">Deep Dive into Your Learning Patterns</p>
      </div>

      <div className="analytics-grid">
        
        {/* EFFICIENCY TRENDS */}
        <div className="analytics-card efficiency-panel">
          <div className="card-header">
            <h3>Efficiency Trends</h3>
            <Activity size={18} color={COLORS.blue} />
          </div>
          <p className="card-desc">Time vs Accuracy over the last 5 active days.</p>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={efficiencyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#8892b0" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" stroke="#8892b0" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke="#8892b0" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(10, 25, 47, 0.9)', border: '1px solid rgba(0,191,166,0.3)', borderRadius: '8px' }}
                  itemStyle={{ color: COLORS.white }}
                />
                <Line yAxisId="left" type="monotone" dataKey="completionTime" name="Time (mins)" stroke={COLORS.blue} strokeWidth={3} dot={{ r: 4, fill: COLORS.navy, stroke: COLORS.blue, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                <Line yAxisId="right" type="monotone" dataKey="accuracy" name="Accuracy (%)" stroke={COLORS.purple} strokeWidth={3} dot={{ r: 4, fill: COLORS.navy, stroke: COLORS.purple, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* STREAK RING */}
        <div className="analytics-card streak-panel">
          <div className="card-header">
            <h3>Streak Analysis</h3>
            <Zap size={18} color={COLORS.yellow} />
          </div>
          <div className="streak-circle-wrapper">
            <svg className="radial-chart-svg" viewBox="0 0 100 100" style={{ height: '200px' }}>
              <circle className="radial-bg" cx="50" cy="50" r="40" />
              <circle 
                className="radial-fill progress-ring-circle" 
                cx="50" cy="50" r="40" 
                style={{ 
                  strokeDasharray: PROGRESS_RINGS.circumference,
                  strokeDashoffset: ringOffset,
                  stroke: COLORS.yellow
                }} 
              />
            </svg>
            <div className="ring-label-center">
              <span className="big-num">{current_streak}</span>
              <span className="small-txt">Days</span>
            </div>
          </div>
          <div className="streak-stats">
            <div className="stat-pill"><span className="stat-val">{completions}</span> Total Solved</div>
            <div className="stat-pill"><span className="stat-val">30</span> 1-Mo Target</div>
          </div>
        </div>

        {/* EMOTIONAL PROFILE */}
        <div className="analytics-card emotion-panel-alt">
          <div className="card-header">
            <h3>Emotional Insights</h3>
            <TargetIcon size={18} color={COLORS.purple} />
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={200}>
               <PieChart>
                 <Pie
                    data={emotionData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                 >
                   {emotionData.map((ent, idx) => (
                     <Cell key={`cell-${idx}`} fill={ent.fill} />
                   ))}
                 </Pie>
                 <Tooltip 
                    formatter={(val, name, props) => [`${val}%`, props.payload.emoji + ' ' + name]} 
                    contentStyle={{ backgroundColor: 'rgba(10, 25, 47, 0.9)', border: `1px solid ${COLORS.purple}`, borderRadius: '8px' }}
                 />
               </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="emotion-legend">
            {emotionData.map((e, idx) => (
              <div key={idx} className="legend-item" style={{ borderColor: e.fill }}>
                <span>{e.emoji}</span> <span className="legend-lbl">{e.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ENGAGEMENT SUMMARY */}
        <div className="analytics-card engagement-summary">
          <div className="card-header">
            <h3>Area Engagement</h3>
            <MoveUpRight size={18} color={COLORS.green} />
          </div>
          <div className="engagement-bars">
            <div className="engage-stat">
              <div className="ind-header">
                <span className="ind-label">Sustained Focus</span>
                <strong>High (85%)</strong>
              </div>
              <div className="ind-bar tall-bar">
                <div className="ind-fill" style={{ width: '85%', background: COLORS.blue }}></div>
              </div>
            </div>
            
            <div className="engage-stat">
              <div className="ind-header">
                <span className="ind-label">Emotional Stability</span>
                <strong>Moderate (60%)</strong>
              </div>
              <div className="ind-bar tall-bar">
                <div className="ind-fill" style={{ width: '60%', background: COLORS.purple }}></div>
              </div>
            </div>
            
            <div className="engage-stat">
              <div className="ind-header">
                <span className="ind-label">Cognitive Load</span>
                <strong>Optimal (40%)</strong>
              </div>
              <div className="ind-bar tall-bar">
                <div className="ind-fill" style={{ width: '40%', background: COLORS.green }}></div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
