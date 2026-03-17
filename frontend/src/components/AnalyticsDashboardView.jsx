import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar, Cell
} from 'recharts';
import { Activity, Clock, History, Brain, MousePointer2 } from 'lucide-react';
import EmotionHeatmap from './EmotionHeatmap';
import EmotionTimeline from './EmotionTimeline';

const COLORS = {
  primary: '#6366F1',
  accent: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  purple: '#8B5CF6',
  border: '#1F2937'
};

const EMOTION_MAP = {
  happy: { emoji: '😊', label: 'Engaged', color: 'text-fc-accent' },
  neutral: { emoji: '😐', label: 'Neutral', color: 'text-gray-400' },
  angry: { emoji: '😡', label: 'Angry', color: 'text-fc-danger' },
  sad: { emoji: '😢', label: 'Sad', color: 'text-blue-400' },
  fear: { emoji: '😨', label: 'Stressed', color: 'text-fc-warning' },
  surprise: { emoji: '😲', label: 'Surprised', color: 'text-purple-400' },
};

export default function AnalyticsDashboardView({ stats }) {
  const { completions = { history: [] } } = stats || {};

  // Mock engagement data
  const engagementData = [
    { time: '10:00', focus: 75, engagement: 60, frustration: 10 },
    { time: '10:15', focus: 85, engagement: 80, frustration: 5 },
    { time: '10:30', focus: 90, engagement: 85, frustration: 2 },
    { time: '10:45', focus: 70, engagement: 75, frustration: 20 },
    { time: '11:00', focus: 95, engagement: 90, frustration: 0 },
  ];

  // Mock solve time data
  const solveTimeData = [
    { name: 'Two Sum', time: 68, difficulty: 'Easy' },
    { name: 'Island Count', time: 120, difficulty: 'Medium' },
    { name: 'LRU Cache', time: 340, difficulty: 'Hard' },
    { name: 'Bin Search', time: 45, difficulty: 'Easy' },
    { name: 'Merge Lists', time: 85, difficulty: 'Easy' },
  ];

  // Problem history timeline data (from stats or fallback)
  const history = completions.history?.length > 0 ? completions.history : [
    { title: 'Two Sum', time: 68, emotion: 'happy', difficulty: 'Easy', date: '2 mins ago' },
    { title: 'Longest Substring', time: 120, emotion: 'neutral', difficulty: 'Medium', date: '15 mins ago' },
    { title: 'Binary Search', time: 45, emotion: 'happy', difficulty: 'Easy', date: '1 hour ago' },
    { title: 'Three Sum', time: 310, emotion: 'fear', difficulty: 'Medium', date: 'Yesterday' },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col gap-8 h-full overflow-y-auto scrollbar-hide">
      <header className="flex flex-col gap-1">
        <h2 className="text-3xl flex items-center gap-3">
          Performance Insights <Brain className="text-fc-primary" size={24} />
        </h2>
        <p className="text-gray-500 text-sm font-medium">Historical analysis of your coding behavior and performance.</p>
      </header>

      {/* 1️⃣ ENGAGEMENT TRENDS */}
      <div className="fc-card p-6 flex flex-col gap-8">
        <div className="flex justify-between items-center">
           <div className="flex flex-col gap-1">
             <h3 className="text-lg font-bold flex items-center gap-2"><Activity size={18} className="text-fc-primary" /> Engagement Trends</h3>
             <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Focus vs Frustration</span>
           </div>
           <div className="flex gap-4">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-fc-primary"/> <span className="text-[10px] font-bold text-gray-400">Focus</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-fc-danger"/> <span className="text-[10px] font-bold text-gray-400">Frustration</span></div>
           </div>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={engagementData}>
              <defs>
                <linearGradient id="colorFocus" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.2}/>
                  <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorFrustration" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.danger} stopOpacity={0.2}/>
                  <stop offset="95%" stopColor={COLORS.danger} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
              <XAxis dataKey="time" stroke="#6B7280" fontSize={10} axisLine={false} tickLine={false} dy={10} />
              <YAxis stroke="#6B7280" fontSize={10} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '12px', fontSize: '12px' }}
                itemStyle={{ fontSize: '12px' }}
              />
              <Area type="monotone" dataKey="focus" stroke={COLORS.primary} strokeWidth={3} fillOpacity={1} fill="url(#colorFocus)" />
              <Area type="monotone" dataKey="frustration" stroke={COLORS.danger} strokeWidth={2} fillOpacity={1} fill="url(#colorFrustration)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 2️⃣ EMOTION HEATMAP */}
        <div className="fc-card p-6 flex flex-col gap-8">
           <h3 className="text-lg font-bold flex items-center gap-2"><MousePointer2 size={18} className="text-fc-accent" /> Emotion Heatmap</h3>
           <EmotionHeatmap />
        </div>

        {/* 3️⃣ SOLVE TIMES */}
        <div className="fc-card p-6 flex flex-col gap-8">
          <h3 className="text-lg font-bold flex items-center gap-2"><Clock size={18} className="text-purple-400" /> Solve Time vs Difficulty</h3>
          <div className="h-64 w-full">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={solveTimeData}>
                   <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                   <XAxis dataKey="name" stroke="#6B7280" fontSize={10} axisLine={false} tickLine={false} />
                   <YAxis stroke="#6B7280" fontSize={10} axisLine={false} tickLine={false} label={{ value: 'Seconds', angle: -90, position: 'insideLeft', style: { fill: '#6B7280', fontSize: 10 } }} />
                   <Tooltip 
                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                    contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '12px', fontSize: '12px' }}
                   />
                   <Bar dataKey="time" radius={[4, 4, 0, 0]}>
                      {solveTimeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.difficulty === 'Hard' ? COLORS.danger : (entry.difficulty === 'Medium' ? COLORS.warning : COLORS.accent)} />
                      ))}
                   </Bar>
                </BarChart>
             </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 4️⃣ PROBLEM COMPLETION HISTORY */}
      <div className="fc-card p-6 flex flex-col gap-6 mb-8">
        <h3 className="text-lg font-bold flex items-center gap-2"><History size={18} className="text-fc-primary" /> Completion Timeline</h3>
        <div className="flex flex-col gap-4 overflow-y-auto max-h-96 pr-2">
           {history.map((item, idx) => {
             const e = EMOTION_MAP[item.emotion?.toLowerCase()] || EMOTION_MAP.neutral;
             return (
               <div key={idx} className="flex items-center justify-between p-4 bg-gray-800 bg-opacity-40 rounded-xl border border-fc-border hover:border-gray-600 transition-colors group">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-900 border border-gray-700 text-xl">
                        {e.emoji}
                     </div>
                     <div className="flex flex-col">
                        <span className="font-bold text-white group-hover:text-fc-primary transition-colors">{item.title}</span>
                        <div className="flex items-center gap-2 text-[10px] font-medium text-gray-500 uppercase tracking-widest">
                           <span className={item.difficulty === 'Hard' ? 'text-fc-danger' : (item.difficulty === 'Medium' ? 'text-fc-warning' : 'text-fc-accent')}>{item.difficulty}</span>
                           <span>•</span>
                           <span>{item.time}s solve</span>
                           <span>•</span>
                           <span className={e.color}>{e.label}</span>
                        </div>
                     </div>
                  </div>
                  <div className="text-xs font-medium text-gray-500">
                     {item.date}
                  </div>
               </div>
             );
           })}
        </div>
      </div>

      {/* Emotion Journey Timeline */}
      <div style={{
        background: 'var(--glass, rgba(255,255,255,0.03))',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 16,
        padding: '1.5rem',
        marginTop: '1.5rem',
      }}>
        <div className="pane-title" style={{ marginBottom: '1.4rem' }}>
          <span style={{ fontSize: '1.2rem' }}>🧭</span>
          Session Emotion Journey
        </div>
        <p style={{ fontSize: '0.8rem', color: '#8b949e', marginBottom: '1.2rem' }}>
          A timeline of your emotional state during the last coding session. Milestone events are marked.
        </p>
        <EmotionTimeline />
      </div>
    </div>
  );
}
