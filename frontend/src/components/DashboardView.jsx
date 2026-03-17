import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Flame, Clock, Star, Activity, 
  Target, Cpu, TrendingUp, Sparkles
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import EngagementGauge from './EngagementGauge';
import AnimatedCounter from './AnimatedCounter';

const StatCard = ({ icon: Icon, label, value, suffix, colorClass }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="fc-card p-6 flex flex-col items-center justify-center text-center gap-2"
  >
    <div className={`p-3 rounded-2xl ${colorClass} bg-opacity-10 text-xl mb-2`}>
      <Icon size={24} className={colorClass.replace('bg-', 'text-')} />
    </div>
    <div className="text-3xl font-black text-white">
      <AnimatedCounter value={value} suffix={suffix} />
    </div>
    <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">
      {label}
    </div>
  </motion.div>
);

const DashboardView = ({ stats, liveConfidence, liveEmotion }) => {
  const { completions, emotion_distribution, topics } = stats;

  // Derive emotion color and label
  const emotionConfig = {
    happy: { label: 'Engaged', color: '#22C55E', shadow: 'shadow-green-500/20' },
    neutral: { label: 'Neutral', color: '#6366F1', shadow: 'shadow-fc-primary/20' },
    angry: { label: 'Frustrated', color: '#EF4444', shadow: 'shadow-red-500/20' },
    fear: { label: 'Stressed', color: '#F59E0B', shadow: 'shadow-fc-warning/20' },
    sad: { label: 'Sad', color: '#6366F1', shadow: 'shadow-fc-primary/20' },
    surprise: { label: 'Surprised', color: '#8b5cf6', shadow: 'shadow-purple-500/20' },
    disgust: { label: 'Distracted', color: '#EF4444', shadow: 'shadow-red-500/20' },
  };

  const currentEmotion = (liveEmotion || 'neutral').toLowerCase();
  const e = emotionConfig[currentEmotion] || emotionConfig.neutral;

  // Dummy CPM data for demonstration - in a real app this would come from props history
  const cpmData = useMemo(() => [
    { time: '10m', cpm: 25 },
    { time: '8m', cpm: 45 },
    { time: '6m', cpm: 38 },
    { time: '4m', cpm: 52 },
    { time: '2m', cpm: 60 },
    { time: 'Now', cpm: Math.max(stats.cpm || 0, 40) },
  ], [stats.cpm]);

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col gap-8 overflow-y-auto h-full scrollbar-hide">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl flex items-center gap-3">
          Session Dashboard <Sparkles className="text-fc-warning" size={24} />
        </h1>
        <p className="text-gray-500 text-sm font-medium">Real-time health of your coding flow.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1️⃣ SESSION OVERVIEW CARD */}
        <motion.div 
          className={`lg:col-span-2 fc-card p-8 flex items-center justify-between relative overflow-hidden transition-shadow duration-500 ${e.shadow} shadow-2xl`}
          animate={{ borderColor: e.color }}
          transition={{ duration: 1 }}
        >
          <div className="flex flex-col gap-6 relative z-10">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Session Health</span>
              <h2 className="text-2xl font-black">Active Stream</h2>
            </div>
            
            <div className="flex gap-12">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-gray-500">Emotion State</span>
                <motion.div 
                  key={currentEmotion}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-3 text-xl font-bold"
                  style={{ color: e.color }}
                >
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: e.color }} />
                  {e.label}
                </motion.div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-gray-500">Confidence</span>
                <div className="text-xl font-bold text-white flex items-center gap-2">
                   <Target size={16} className="text-fc-primary" /> {liveConfidence || 0}%
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-gray-500">Focus Score</span>
                <div className="text-xl font-bold text-white flex items-center gap-2">
                   <Activity size={16} className="text-fc-accent" /> {completions?.accuracy || 92}%
                </div>
              </div>
            </div>
          </div>
          
          <div className="hidden sm:block absolute right-[-20px] top-[-20px] opacity-10 pointer-events-none">
             <Cpu size={200} />
          </div>

          {/* Animated Background Glow */}
          <motion.div 
            className="absolute right-0 top-0 w-64 h-64 blur-[100px] rounded-full opacity-20 pointer-events-none"
            animate={{ background: e.color, opacity: [0.1, 0.2, 0.1] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        </motion.div>

        {/* 4️⃣ ENGAGEMENT GAUGE */}
        <div className="fc-card p-8 flex items-center justify-center">
          <EngagementGauge percentage={liveConfidence || 0} emotion={currentEmotion} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 3️⃣ PROBLEM STATS */}
        <StatCard 
          icon={Star} 
          label="Problems Solved" 
          value={completions?.total_solved || 0} 
          colorClass="bg-fc-primary" 
        />
        <StatCard 
          icon={Clock} 
          label="Avg Solve Time" 
          value={completions?.avg_time || 0} 
          suffix="s"
          colorClass="bg-blue-500" 
        />
        <StatCard 
          icon={Flame} 
          label="Current Streak" 
          value={completions?.streak || 0} 
          colorClass="bg-fc-warning" 
        />
        <StatCard 
          icon={TrendingUp} 
          label="Engagement Score" 
          value={liveConfidence || 0} 
          suffix="%"
          colorClass="bg-fc-accent" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* 2️⃣ CPM TREND GRAPH */}
        <div className="lg:col-span-2 fc-card p-6 flex flex-col gap-6">
          <div className="flex justify-between items-center">
             <h3 className="text-lg font-bold flex items-center gap-2"><TrendingUp size={18} className="text-fc-primary"/> Coding Pace (CPM)</h3>
             <span className="text-[10px] font-bold text-gray-500 uppercase">Live Trend</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cpmData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCpm" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis 
                  dataKey="time" 
                  stroke="#6B7280" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  dy={10}
                />
                <YAxis 
                  stroke="#6B7280" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  label={{ value: 'CPM', angle: -90, position: 'insideLeft', style: { fill: '#6B7280', fontSize: 10, fontWeight: 'bold' } }}
                />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '12px', fontSize: '12px' }}
                  itemStyle={{ color: '#6366F1', fontWeight: 'bold' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="cpm" 
                  stroke="#6366F1" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorCpm)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Topic Breakdown (previously Mastery Panel) */}
        <div className="fc-card p-6 flex flex-col gap-6 overflow-hidden">
          <h3 className="text-lg font-bold flex items-center gap-2"><Target size={18} className="text-fc-accent"/> Top Skills</h3>
          <div className="flex flex-col gap-4">
             {Object.entries(topics || {}).sort((a,b) => b[1] - a[1]).slice(0, 5).map(([topic, rate]) => (
               <div key={topic} className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-gray-400 capitalize">{topic}</span>
                    <span className="text-fc-accent">{Math.round(rate * 100)}%</span>
                  </div>
                  <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.round(rate * 100)}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full bg-fc-accent bg-opacity-80"
                    />
                  </div>
               </div>
             ))}
             {Object.keys(topics || {}).length === 0 && (
               <div className="text-center py-12 text-sm text-gray-600">No telemetry data found.</div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
