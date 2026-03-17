import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Camera, TrendingDown } from 'lucide-react';
import WebcamFeed from './WebcamFeed';
import EngagementMeter from './EngagementMeter';
import AICoachCard from './AICoachCard';

const EMOTION_GLOW = {
  happy:   '#22C55E',
  neutral: '#6366F1',
  angry:   '#EF4444',
  sad:     '#60A5FA',
  fear:    '#F59E0B',
  surprise:'#818CF8',
  disgust: '#C084FC',
};

const EMOTION_EMOJI = {
  happy:   '😊',
  neutral: '😐',
  angry:   '😡',
  sad:     '😢',
  fear:    '😰',
  surprise:'😲',
  disgust: '😒',
};

export default function AIInsightPanel({
  emotion,
  confidence,
  currentProblemId,
  activeCpm,
  onTelemetryUpdate,
  coachMessage,
  coachCategory,
  onDismissCoach,
  emotionHistory = [],
}) {
  const glowColor = EMOTION_GLOW[emotion] || '#6366F1';

  return (
    <aside className="ai-panel">
      {/* Camera Section */}
      <div className="ai-section">
        <div className="ai-section-title">
          <Camera size={13} />
          Live Emotion Feed
        </div>
        <motion.div
          className="cam-card"
          animate={{ boxShadow: `0 0 24px ${glowColor}33, 0 0 4px ${glowColor}22` }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
        >
          <WebcamFeed
            onTelemetryUpdate={onTelemetryUpdate}
            currentProblemId={currentProblemId}
            activeCpm={activeCpm}
          />
        </motion.div>
      </div>

      {/* Engagement Meter */}
      <div className="ai-section">
        <div className="ai-section-title">
          <Brain size={13} />
          Engagement Level
        </div>
        <EngagementMeter confidence={confidence} emotion={emotion} />
      </div>

      {/* Emotion Trend Row */}
      {emotionHistory.length > 0 && (
        <div className="ai-section">
          <div className="ai-section-title">
            <TrendingDown size={13} />
            Emotion Trend
          </div>
          <div className="emotion-trend-row">
            {emotionHistory.slice(-5).map((e, i) => (
              <span
                key={i}
                className="emotion-trend-emoji"
                title={e}
                style={{ opacity: 0.4 + (i / 5) * 0.6 }}
              >
                {EMOTION_EMOJI[e] || '😐'}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* AI Coach Card */}
      {coachMessage && (
        <div className="ai-section">
          <AICoachCard
            message={coachMessage}
            category={coachCategory}
            onDismiss={onDismissCoach}
          />
        </div>
      )}
    </aside>
  );
}
