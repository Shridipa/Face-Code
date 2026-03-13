import React, { useEffect, useState, useRef } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import api from '../api';

/**
 * Ultra-robust Analytics that completely bypasses ResponsiveContainer.
 * Only renders when dimensions are positively confirmed > 50px.
 */
export default function UserJourneyTrend({ isDark }) {
  const [data, setData] = useState([{ x: 0, v: 0.5 }, { x: 1, v: 0.5 }]);
  const [dims, setDims] = useState(null); // start as null
  const containerRef = useRef(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/api/analytics_data');
        const pts = (res.data?.confidence_trend?.values ?? [])
          .slice(-30)
          .map((v, i) => ({ x: i, v: Number(v) || 0 }));
        if (pts.length >= 2) setData(pts);
      } catch (e) {
        console.warn("Analytics fetch failed", e);
      }
    };

    const observer = new ResizeObserver((entries) => {
      if (!entries.length) return;
      const { width, height } = entries[0].contentRect;
      // Only set dims if we have a real layout
      if (width > 50) {
        setDims({ width: Math.floor(width), height: Math.floor(height || 72) });
      }
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    fetchStats();
    const iv = setInterval(fetchStats, 5000);
    return () => {
      observer.disconnect();
      clearInterval(iv);
    };
  }, []);

  const stroke = isDark ? '#60a5fa' : '#3b82f6';
  const fill = isDark ? '#60a5fa' : '#3b82f6';

  return (
    <div 
      ref={containerRef} 
      className="analytics-mount-root"
      style={{ 
        height: 72, 
        width: '100%', 
        minHeight: 72, 
        background: 'transparent',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {dims && dims.width > 50 ? (
        <AreaChart 
          width={dims.width} 
          height={dims.height} 
          data={data} 
          margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
        >
          <defs>
            <linearGradient id="aGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={fill} stopOpacity={0.25} />
              <stop offset="95%" stopColor={fill} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="x" hide />
          <YAxis domain={[0, 1]} hide />
          <Tooltip
            contentStyle={{
              background: isDark ? '#1c2128' : '#fff',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontSize: '10px',
              padding: '4px 8px',
            }}
            labelStyle={{ display: 'none' }}
            formatter={(v) => [`${Math.round(v * 100)}%`, 'Engagement']}
          />
          <Area
            type="monotone"
            dataKey="v"
            stroke={stroke}
            fill="url(#aGrad)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      ) : (
        <div style={{ height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: 'var(--text-muted)' }}>
          Preparing analytics...
        </div>
      )}
    </div>
  );
}
