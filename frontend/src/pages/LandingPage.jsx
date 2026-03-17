import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Zap, TrendingUp, Play, ChevronRight, Code2, Eye, Lightbulb, Sparkles, MousePointer2, Terminal, BarChart3, ArrowUp } from 'lucide-react';
import FaceCodeLogo from '../components/FaceCodeLogo';
import './LandingPage.css';

const FLOATING_CARDS = [
  { id: 1, icon: '😊', label: 'Engaged', color: '#22C55E', delay: 0 },
  { id: 2, icon: '😡', label: 'Frustrated', color: '#EF4444', delay: 1.2 },
  { id: 3, icon: '💡', label: 'Hint Generated', color: '#6366F1', delay: 2.4 },
];

const FEATURES = [
  {
    icon: <Eye size={24} />, 
    title: 'Emotion Detection',
    desc: 'Real-time facial emotion detection to understand coder frustration and engagement levels.',
    color: '#6366F1',
    bg: 'rgba(99,102,241,0.1)',
  },
  {
    icon: <Brain size={24} />, 
    title: 'Adaptive Hint System',
    desc: 'Hints appear dynamically when the system detects confusion or struggle in real time.',
    color: '#22C55E',
    bg: 'rgba(34,197,94,0.1)',
  },
  {
    icon: <TrendingUp size={24} />, 
    title: 'Engagement Analytics',
    desc: 'Track focus levels and coding engagement during every problem solving session.',
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.1)',
  },
];

const HOW_STEPS = [
  {
    icon: <MousePointer2 size={24} />,
    title: 'Connect & Select',
    desc: 'Grant camera access and choose from 500+ problems across 5 languages.'
  },
  {
    icon: <Terminal size={24} />,
    title: 'Code with AI',
    desc: 'Write your solution. Our AI monitors your focus and frustration in real-time.'
  },
  {
    icon: <BarChart3 size={24} />,
    title: 'Adapt & Conquer',
    desc: 'Receive adaptive hints if you struggle, and track your emotional growth over time.'
  }
];

const CODE_LINES = [
  { text: 'class Solution:', color: '#6366F1' },
  { text: '    def twoSum(self, nums, target):', color: '#e6edf3' },
  { text: '        seen = {}', color: '#e6edf3' },
  { text: '        for i, v in enumerate(nums):', color: '#e6edf3' },
  { text: '            if target - v in seen:', color: '#22C55E' },
  { text: '                return [seen[target-v], i]', color: '#22C55E' },
  { text: '            seen[v] = i', color: '#e6edf3' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setVisibleLines(v => v < CODE_LINES.length ? v + 1 : v);
    }, 400);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="landing-page">
      {/* Animated background grid */}
      <div className="landing-grid-bg" />

      {/* Header */}
      <motion.header 
        className="landing-header"
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div className="landing-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <FaceCodeLogo size={32} />
          <span className="logo-text">FaceCode</span>
        </div>
        <nav className="landing-nav">
          <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Home</a>
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
          <button className="landing-nav-btn" onClick={() => navigate('/practice')}>
            Start Coding <ChevronRight size={14} />
          </button>
        </nav>
      </motion.header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-left">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <div className="hero-badge">
              <Zap size={13} color="#F59E0B" />
              AI-Powered Coding Platform
            </div>
            <h1 className="hero-title">
              <span className="hero-title-main">FaceCode</span>
              <span className="hero-title-sub">Emotion-Aware AI Coding Platform</span>
            </h1>
            <p className="hero-desc">
              Solve coding problems while AI analyzes engagement, frustration, and focus 
              to provide adaptive hints in real time.
            </p>
            <div className="hero-ctas">
              <motion.button
                className="cta-primary"
                onClick={() => navigate('/practice')}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
              >
                <Play size={16} fill="currentColor" />
                Start Practicing
              </motion.button>
              <motion.button
                className="cta-secondary"
                onClick={() => navigate('/demo')}
                whileHover={{ scale: 1.04, backgroundColor: 'rgba(255,255,255,0.05)' }}
                whileTap={{ scale: 0.97 }}
              >
                <Sparkles size={16} className="text-fc-warning" />
                View Demo
              </motion.button>
            </div>
            <div className="hero-stats">
              <div className="hero-stat"><span className="hero-stat-num">500+</span><span>Problems</span></div>
              <div className="hero-stat-divider" />
              <div className="hero-stat"><span className="hero-stat-num">7</span><span>Emotions Tracked</span></div>
              <div className="hero-stat-divider" />
              <div className="hero-stat"><span className="hero-stat-num">Real-time</span><span>AI Analysis</span></div>
            </div>
          </motion.div>
        </div>

        <div className="hero-right">
          {/* Code animation card */}
          <motion.div
            className="hero-code-card"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
          >
            <div className="code-card-header">
              <div className="code-dots">
                <div className="dot dot-red" />
                <div className="dot dot-yellow" />
                <div className="dot dot-green" />
              </div>
              <div className="code-card-title"><Code2 size={12} /> solution.py</div>
            </div>
            <div className="code-card-body">
              {CODE_LINES.map((line, i) => (
                <AnimatePresence key={i}>
                  {visibleLines > i && (
                    <motion.div
                      className="code-line"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                      style={{ color: line.color }}
                    >
                      <span className="line-num">{i + 1}</span>
                      <span>{line.text}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              ))}
            </div>
          </motion.div>

          {/* Floating Emotion Cards */}
          {FLOATING_CARDS.map((card) => (
            <motion.div
              key={card.id}
              className="floating-card"
              style={{
                top: card.id === 1 ? '10%' : card.id === 2 ? '55%' : '80%',
                right: card.id === 1 ? '-5%' : card.id === 2 ? '-12%' : '5%',
                borderColor: card.color + '55',
              }}
              initial={{ opacity: 0, scale: 0.6, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }}
              transition={{
                opacity: { delay: card.delay + 0.8, duration: 0.5 },
                scale: { delay: card.delay + 0.8, duration: 0.5 },
                y: { delay: card.delay + 1.3, duration: 3, repeat: Infinity, ease: 'easeInOut' },
              }}
            >
              <span className="float-icon">{card.icon}</span>
              <span className="float-label" style={{ color: card.color }}>{card.label}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <motion.div
          className="features-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="features-title">Built for Coders Who Want to Improve</h2>
          <p className="features-subtitle">AI that adapts to how you feel, not just how you code.</p>
        </motion.div>
        <div className="feature-cards">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              className="feature-card"
              style={{ '--card-color': f.color, '--card-bg': f.bg }}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              whileHover={{ translateY: -6, transition: { duration: 0.2 } }}
            >
              <div className="feature-icon-wrap">{f.icon}</div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.div 
          className="section-footer-cta"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
        >
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="back-to-top-btn">
            <ArrowUp size={14} /> Back to Home
          </button>
        </motion.div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="how-it-works-section">
        <motion.div
          className="how-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="features-title">Master the Platform in Seconds</h2>
          <p className="features-subtitle">A seamless journey from opening the tab to mastering a new algorithm.</p>
        </motion.div>
        
        <div className="how-grid">
          {HOW_STEPS.map((step, i) => (
            <motion.div
              key={i}
              className="how-step-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.2 }}
            >
              <div className="step-num">{i + 1}</div>
              <div className="how-icon-box">{step.icon}</div>
              <h3 className="how-step-title">{step.title}</h3>
              <p className="how-step-desc">{step.desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.div 
          className="section-footer-cta"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
        >
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="back-to-top-btn">
            <ArrowUp size={14} /> Back to Home
          </button>
        </motion.div>
      </section>

      {/* CTA Banner */}
      <motion.section
        className="cta-banner"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
      >
        <h2>Ready to code smarter?</h2>
        <p>Join the AI-powered coding platform that adapts to your emotions.</p>
        <motion.button
          className="cta-primary"
          onClick={() => navigate('/practice')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
        >
          <Play size={16} fill="currentColor" />
          Start Practicing Free
        </motion.button>
      </motion.section>

      <footer className="landing-footer">
        <p>© 2026 FaceCode. Emotion-Aware AI Coding Platform.</p>
      </footer>
    </div>
  );
}
