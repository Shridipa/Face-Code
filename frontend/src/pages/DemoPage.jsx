import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import FaceCodeLogo from '../components/FaceCodeLogo';
import {
  Play, Brain, CheckCircle, Code2, Terminal as TermIcon,
  Zap, TrendingUp, Lightbulb, Bot, X, Sparkles
} from 'lucide-react';
import DemoOverlay, { STEP_CONFIGS } from '../components/DemoOverlay';
import DemoTimeline from '../components/DemoTimeline';
import DemoController from '../components/DemoController';
import AICoachCard from '../components/AICoachCard';
import FocusRecoveryPopup from '../components/FocusRecoveryPopup';
import '../App.css';

const DEMO_PROBLEM = {
  title: 'Two Sum',
  difficulty: 'easy',
  description: `<p>Given an array of integers <code>nums</code> and an integer <code>target</code>, return <em>indices of the two numbers that add up to target</em>.</p>
<p><strong>Example 1:</strong><br/>
<code>Input: nums = [2,7,11,15], target = 9</code><br/>
<code>Output: [0,1]</code><br/>
Explanation: nums[0] + nums[1] = 2 + 7 = 9</p>
<p><strong>Constraints:</strong></p>
<ul>
  <li>2 ≤ nums.length ≤ 10⁴</li>
  <li>-10⁹ ≤ nums[i] ≤ 10⁹</li>
  <li>Only one valid answer exists.</li>
</ul>`,
};

const DEMO_HINTS = [
  'Think about storing numbers as you iterate. What data structure gives O(1) lookups?',
  'For each number x, check if (target - x) exists in your stored values.',
  'A hashmap where keys = numbers and values = their indices gives you O(n) overall.',
];

const DEMO_CODE = `class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        seen = {}
        for i, num in enumerate(nums):
            complement = target - num
            if complement in seen:
                return [seen[complement], i]
            seen[num] = i`;

const EMOTION_GLOW = {
  happy:   '#22C55E',
  neutral: '#6366F1',
  angry:   '#EF4444',
  sad:     '#60A5FA',
  fear:    '#F59E0B',
};

const EMOTION_EMOJI = {
  happy: '😊', neutral: '😐', angry: '😡', sad: '😢', fear: '😰',
};

// Confetti emitter
const CONFETTI_ITEMS = Array.from({ length: 60 }, (_, i) => ({
  id: i,
  x: (i * 1.67) % 100, // deterministic spread
  color: ['#6366F1', '#22C55E', '#F59E0B', '#EF4444', '#818CF8', '#60A5FA'][i % 6],
  delay: (i * 0.04) % 0.8,
  size: 6 + (i % 4) * 2,
  duration: 2.5 + (i % 5) * 0.3,
}));

function Confetti() {
  return (
    <div className="confetti-container">
      {CONFETTI_ITEMS.map(c => (
        <motion.div
          key={c.id}
          style={{ left: `${c.x}%`, background: c.color, width: c.size, height: c.size, borderRadius: 2 }}
          className="confetti-piece"
          initial={{ y: -20, opacity: 1, rotate: 0 }}
          animate={{ y: '100vh', opacity: 0, rotate: 1080 }}
          transition={{ duration: c.duration, delay: c.delay, ease: 'easeIn' }}
        />
      ))}
    </div>
  );
}

export default function DemoPage() {
  const navigate = useNavigate();
  const [step, setStep]                 = useState(0);
  const [demoMode, setDemoMode]         = useState(true);
  const [emotion, setEmotion]           = useState('neutral');
  const [engagement, setEngagement]     = useState(60);
  const [hints, setHints]               = useState([]);
  const [showCoach, setShowCoach]       = useState(false);
  const [coachCategory, setCoachCategory] = useState('strategy');
  const [showFocus, setShowFocus]       = useState(false);
  const [solved, setSolved]             = useState(false);
  const glow                            = EMOTION_GLOW[emotion] || '#6366F1';
  const stepCfg                         = STEP_CONFIGS[step];

  // Sync emotion + engagement from step config
  useEffect(() => {
    if (stepCfg) {
      const nextEmotion = stepCfg.emotion || 'neutral';
      const nextEngagement = stepCfg.engagement || 60;
      if (emotion !== nextEmotion) setEmotion(nextEmotion);
      if (engagement !== nextEngagement) setEngagement(nextEngagement);
    }
  }, [step, stepCfg, emotion, engagement]);

  const nextStep = useCallback(() => {
    if (step >= STEP_CONFIGS.length - 1) {
      navigate('/dashboard');
      return;
    }
    setStep(s => s + 1);
  }, [step, navigate]);

  const jumpToStep = useCallback((i) => setStep(i), []);

  // Demo controller actions
  const handleSetEmotion   = (e) => { setEmotion(e); };
  const handleTriggerHint  = () => setHints(DEMO_HINTS);
  const handleTriggerCoach = () => { setShowCoach(true); setCoachCategory('strategy'); };
  const handleTriggerFocus = () => { setEngagement(22); setEmotion('sad'); setShowFocus(true); };
  const handleSolve        = () => { setSolved(true); setEmotion('happy'); setEngagement(87); };

  return (
    <div className="demo-page">
      {/* ==== TOPBAR ==== */}
      <header className="demo-topbar">
        <div className="demo-topbar-left cursor-pointer" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <div className="logo-icon flex items-center justify-center">
            <FaceCodeLogo size={24} />
          </div>
          <span className="logo-name">FaceCode</span>
          <span className="demo-mode-badge">DEMO MODE</span>
        </div>

        <div className="demo-topbar-center">
          <motion.div
            className="demo-tel-chip"
            animate={{ borderColor: glow, color: glow }}
            transition={{ duration: 0.4 }}
          >
            {EMOTION_EMOJI[emotion]} {emotion.charAt(0).toUpperCase() + emotion.slice(1)}
          </motion.div>
          <motion.div
            className="demo-tel-chip"
            animate={{ color: engagement > 50 ? '#22C55E' : '#EF4444' }}
          >
            <TrendingUp size={12} /> {engagement}% Engagement
          </motion.div>
          <div className="demo-tel-chip">
            <Zap size={12} style={{ color: '#F59E0B' }} /> 42 CPM
          </div>
        </div>

        <div className="demo-topbar-right">
          <DemoController
            demoMode={demoMode}
            onToggleDemo={() => setDemoMode(m => !m)}
            onSetEmotion={handleSetEmotion}
            onTriggerHint={handleTriggerHint}
            onTriggerCoach={handleTriggerCoach}
            onTriggerFocus={handleTriggerFocus}
            onSolve={handleSolve}
            currentEmotion={emotion}
          />
        </div>
      </header>

      {/* ==== MAIN WORKSPACE ==== */}
      <div className="demo-workspace">

        {/* —— LEFT: Problem + Editor —— */}
        <main className="demo-center">

          {/* Problem Panel */}
          <motion.div
            className={`problem-panel demo-highlight-${stepCfg?.highlight === 'problem' ? 'active' : ''}`}
            animate={stepCfg?.highlight === 'problem' ? { boxShadow: `0 0 0 2px #6366F1, 0 0 30px #6366F130` } : { boxShadow: 'none' }}
          >
            <div className="problem-header">
              <div>
                <h2 className="problem-title">{DEMO_PROBLEM.title}</h2>
                <div className="problem-meta">
                  <span className="diff-badge easy">Easy</span>
                  <span className="tag-chip">Array</span>
                  <span className="tag-chip">Hash Table</span>
                </div>
              </div>
            </div>
            <div className="problem-desc" dangerouslySetInnerHTML={{ __html: DEMO_PROBLEM.description }} />
          </motion.div>

          {/* Code Editor (static demo) */}
          <div className="editor-container">
            <div className="editor-toolbar flex items-center justify-between px-4 py-2">
              <div className="flex items-center gap-3">
                <Code2 size={14} className="text-indigo-400" />
                <span className="text-xs font-bold text-gray-300">Python 3</span>
                <span className="text-[10px] text-gray-600 font-bold">AUTOSAVED</span>
              </div>
              <div className="flex items-center gap-2">
                <motion.button
                  className={`btn-secondary text-xs flex items-center gap-1.5 ${stepCfg?.highlight === 'hint-btn' ? 'demo-pulse-btn' : ''}`}
                  animate={stepCfg?.highlight === 'hint-btn' ? {
                    boxShadow: ['0 0 0 0 #F59E0B00', '0 0 0 8px #F59E0B30', '0 0 0 0 #F59E0B00'],
                    borderColor: '#F59E0B',
                  } : {}}
                  transition={{ duration: 1.2, repeat: Infinity }}
                  onClick={handleTriggerHint}
                >
                  <Lightbulb size={12} /> Get Hint
                </motion.button>
                <button className="btn-secondary text-xs flex items-center gap-1.5">
                  <Play size={12} /> Run
                </button>
                <button className="btn-primary text-xs flex items-center gap-1.5">
                  <CheckCircle size={12} /> Submit
                </button>
              </div>
            </div>
            <div className="monaco-box" style={{ background: '#0d1117', padding: '16px 20px', minHeight: 220, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem', color: '#c9d1d9', lineHeight: 1.7, overflowX: 'auto' }}>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                <span style={{ color: '#79c0ff' }}>class </span>
                <span style={{ color: '#d2a8ff' }}>Solution</span>
                <span style={{ color: '#c9d1d9' }}>:</span>{'\n'}
                {'    '}
                <span style={{ color: '#79c0ff' }}>def </span>
                <span style={{ color: '#d2a8ff' }}>twoSum</span>
                <span style={{ color: '#c9d1d9' }}>(self, nums, target):</span>{'\n'}
                {'        '}
                <span style={{ color: '#8b949e' }}># Your solution here</span>{'\n'}
                {'        '}
                <span style={{ color: '#79c0ff' }}>seen </span>
                <span style={{ color: '#ff7b72' }}>= </span>
                <span style={{ color: '#c9d1d9' }}>{'{}'}</span>{'\n'}
                {'        '}
                <span style={{ color: '#79c0ff' }}>for </span>
                <span style={{ color: '#c9d1d9' }}>i, num </span>
                <span style={{ color: '#ff7b72' }}>in </span>
                <span style={{ color: '#c9d1d9' }}>enumerate(nums):</span>{'\n'}
                {'            '}
                <span style={{ color: '#ffa657' }}>complement </span>
                <span style={{ color: '#ff7b72' }}>= </span>
                <span style={{ color: '#c9d1d9' }}>target </span>
                <span style={{ color: '#ff7b72' }}>- </span>
                <span style={{ color: '#c9d1d9' }}>num</span>{'\n'}
                {'            '}
                <span style={{ color: '#79c0ff' }}>if </span>
                <span style={{ color: '#c9d1d9' }}>complement </span>
                <span style={{ color: '#ff7b72' }}>in </span>
                <span style={{ color: '#c9d1d9' }}>seen:</span>{'\n'}
                {'                '}
                <span style={{ color: '#79c0ff' }}>return </span>
                <span style={{ color: '#c9d1d9' }}>[seen[complement], i]</span>{'\n'}
                {'            '}
                <span style={{ color: '#c9d1d9' }}>seen[num] </span>
                <span style={{ color: '#ff7b72' }}>= </span>
                <span style={{ color: '#c9d1d9' }}>i</span>
              </pre>
            </div>

            {/* Terminal / Hints */}
            <div className="terminal">
              <div className="terminal-head">
                <TermIcon size={12} /> Console
                {hints.length > 0 && (
                  <span style={{ marginLeft: 8, background: '#6366F150', color: '#818CF8', borderRadius: 4, padding: '1px 6px', fontSize: '0.65rem', fontWeight: 700 }}>
                    {hints.length} Hints
                  </span>
                )}
              </div>
              <AnimatePresence>
                {hints.length > 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-3 flex flex-col gap-2 max-h-[180px] overflow-y-auto"
                  >
                    {hints.map((h, i) => (
                      <motion.div
                        key={i}
                        className="ai-hint-card"
                        initial={{ opacity: 0, x: -14 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.15 }}
                      >
                        <div className="ai-hint-badge">Hint {i + 1}</div>
                        <p className="ai-hint-text">{h}</p>
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <div className="terminal-body idle">Ready to run... (Demo Mode)</div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </main>

        {/* —— RIGHT: AI Insight Panel —— */}
        <aside className="demo-ai-panel">
          {/* Camera */}
          <motion.div
            className={`ai-section ${stepCfg?.highlight === 'camera' ? 'demo-section-glow' : ''}`}
            animate={stepCfg?.highlight === 'camera' ? { boxShadow: `0 0 0 2px ${glow}60, 0 0 24px ${glow}30` } : { boxShadow: 'none' }}
            transition={{ duration: 0.4 }}
          >
            <div className="ai-section-title">📸 Live Emotion Feed</div>
            <motion.div
              className="cam-card"
              animate={{ boxShadow: `0 0 24px ${glow}44, 0 0 4px ${glow}22` }}
              transition={{ duration: 1.2, ease: 'easeInOut' }}
              style={{ background: '#0d1117', borderRadius: 10, overflow: 'hidden', aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8, border: `1px solid ${glow}40` }}
            >
              <span style={{ fontSize: '3rem' }}>{EMOTION_EMOJI[emotion]}</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: glow, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {emotion}
              </span>
            </motion.div>
          </motion.div>

          {/* Engagement Meter */}
          <motion.div
            className={`ai-section ${stepCfg?.highlight === 'engagement' ? 'demo-section-glow' : ''}`}
            animate={stepCfg?.highlight === 'engagement' ? { boxShadow: `0 0 0 2px #6366F160, 0 0 24px #6366F130` } : { boxShadow: 'none' }}
          >
            <div className="ai-section-title"><Brain size={13} /> Engagement Level</div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '8px 0' }}>
              <div style={{ position: 'relative', width: 90, height: 90 }}>
                <svg width="90" height="90" viewBox="0 0 90 90">
                  <circle cx="45" cy="45" r="36" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                  <motion.circle
                    cx="45" cy="45" r="36"
                    fill="none"
                    stroke={engagement > 50 ? '#22C55E' : '#EF4444'}
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 36}
                    animate={{ strokeDashoffset: 2 * Math.PI * 36 * (1 - engagement / 100) }}
                    transition={{ duration: 0.8 }}
                    style={{ transform: 'rotate(-90deg)', transformOrigin: '45px 45px' }}
                  />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: 800, color: engagement > 50 ? '#22C55E' : '#EF4444' }}>{engagement}%</span>
                  <span style={{ fontSize: '0.55rem', color: '#484f58', fontWeight: 700, textTransform: 'uppercase' }}>Focus</span>
                </div>
              </div>
              <div style={{ fontSize: '0.72rem', color: engagement > 50 ? '#22C55E' : '#EF4444', fontWeight: 700 }}>
                {engagement > 70 ? '🟢 High Focus' : engagement > 40 ? '🟡 Moderate' : '🔴 Low — needs recovery'}
              </div>
            </div>
          </motion.div>

          {/* AI Coach */}
          <AnimatePresence>
            {showCoach && (
              <motion.div className="ai-section" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="ai-section-title"><Bot size={13} /> AI Coding Coach</div>
                <AICoachCard
                  message="Try breaking the problem into two steps: 1. Store each number's index. 2. Check if the complement exists."
                  category={coachCategory}
                  onDismiss={() => setShowCoach(false)}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Emotion Trend */}
          <div className="ai-section">
            <div className="ai-section-title">📈 Emotion Trend</div>
            <div className="emotion-trend-row">
              {['😊', '😐', '😐', EMOTION_EMOJI[emotion], EMOTION_EMOJI[emotion]].map((e, i) => (
                <span key={i} className="emotion-trend-emoji" style={{ opacity: 0.4 + i * 0.15 }}>{e}</span>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* ==== DEMO STEP OVERLAY CARD ==== */}
      <AnimatePresence>
        {!solved && (
          <div className="demo-float-overlay">
            <DemoOverlay
              step={step}
              onNext={nextStep}
              onClose={() => setSolved(true)}
            />
          </div>
        )}
      </AnimatePresence>

      {/* ==== SUCCESS OVERLAY ==== */}
      <AnimatePresence>
        {solved && (
          <motion.div
            className="demo-success-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <Confetti />
            <motion.div
              className="demo-success-card"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
            >
              <div style={{ fontSize: '3.5rem', marginBottom: 12 }}>🎉</div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#e6edf3', marginBottom: 8 }}>Problem Solved!</h2>
              <div className="demo-success-stats">
                <div className="demo-stat-pill"><span>⏱ Solve Time</span><strong>68s</strong></div>
                <div className="demo-stat-pill"><span>😊 Emotion</span><strong>Focused</strong></div>
                <div className="demo-stat-pill"><span>📊 Engagement</span><strong>87%</strong></div>
              </div>
              <motion.button
                className="focus-btn-primary"
                style={{ marginTop: 24, width: '100%' }}
                onClick={() => navigate('/dashboard')}
                whileHover={{ scale: 1.03 }}
              >
                View Dashboard →
              </motion.button>
              <button
                style={{ marginTop: 10, background: 'none', border: 'none', color: '#484f58', fontSize: '0.8rem', cursor: 'pointer' }}
                onClick={() => { setSolved(false); setStep(0); setHints([]); setShowCoach(false); setEmotion('neutral'); setEngagement(60); }}
              >
                Restart Demo
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==== FOCUS RECOVERY ==== */}
      {showFocus && (
        <FocusRecoveryPopup
          onIgnore={() => setShowFocus(false)}
          onComplete={() => { setShowFocus(false); setEngagement(65); setEmotion('neutral'); }}
        />
      )}

      {/* ==== BOTTOM TIMELINE ==== */}
      <footer className="demo-footer">
        <DemoTimeline currentStep={step} onJump={jumpToStep} />
        <div className="demo-kb-hints">
          <span><kbd>Ctrl</kbd>+<kbd>Enter</kbd> Run</span>
          <span><kbd>Ctrl</kbd>+<kbd>⇧</kbd>+<kbd>Enter</kbd> Submit</span>
        </div>
      </footer>
    </div>
  );
}
