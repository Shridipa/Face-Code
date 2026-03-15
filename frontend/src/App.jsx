import React, { useState, useEffect, useCallback } from 'react';
import {
  Play, Brain, SkipForward, Sun, Moon, CheckCircle,
  Code2, Terminal as TermIcon, TrendingUp, Zap, List, X, BarChart3,
  LayoutDashboard, Swords, PieChart, Settings, Menu
} from 'lucide-react';
import api from './api';
import './App.css';
import WebcamFeed    from './components/WebcamFeed';
import CodeEditor    from './components/CodeEditor';
import UserJourneyTrend from './components/Analytics';
import QuestionPanel from './components/QuestionPanel';
import DashboardView from './components/DashboardView';
import AnalyticsDashboardView from './components/AnalyticsDashboardView';
import SettingsView from './components/SettingsView';
import InterventionModal from './components/InterventionModal';

export default function App() {
  const [problem,      setProblem]      = useState(null);
  const [code,         setCode]         = useState('# 🧠 FaceCode — Adaptive AI Coding Platform\n# Click a question from the list OR start typing!\n\n');
  const [output,       setOutput]       = useState('Ready to compile...');
  const [outStatus,    setOutStatus]    = useState('idle');
  const [hints,        setHints]        = useState([]);
  const [cpm,          setCpm]          = useState(0);
  const [confidence,   setConfidence]   = useState(50);
  const [emotion,      setEmotion]      = useState('neutral');
  const [isRunning,    setIsRunning]    = useState(false);
  const [isLlm,        setIsLlm]        = useState(false);
  const [theme,        setTheme]        = useState('light');
  const [totalSolved,  setTotalSolved]  = useState(0);
  const [avgTime,      setAvgTime]      = useState(0);

  // Test execution state
  const [testResults,  setTestResults]  = useState([]);
  const [hasRun,       setHasRun]       = useState(false);
  const [runtimeMs,    setRuntimeMs]    = useState(null);

  // Comparison state
  const [prevMetrics,  setPrevMetrics]  = useState(null); 

  // LeetCode panel state
  const [showPanel,    setShowPanel]    = useState(false);   // show/hide
  const [activeDiff,   setActiveDiff]   = useState('easy'); // which tab

  // New features state
  const [view,          setView]          = useState('workspace'); // workspace | dashboard | analytics | settings
  const [sidebarOpen,   setSidebarOpen]   = useState(false);
  const [dbStats,       setDbStats]       = useState({});
  const [negativeTimer, setNegativeTimer] = useState(0); // seconds
  const [showIntervention, setShowIntervention] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    api.get('/api/start_session')
      .then(r => setProblem(r.data.problem))
      .catch(console.error);

    const fetchStats = () => {
      api.get('/api/analytics_data')
        .then(r => {
          setDbStats(r.data);
          setTotalSolved(r.data.completions?.total_solved || 0);
          setAvgTime(r.data.completions?.avg_time || 0);
        })
        .catch(() => {});
    };

    fetchStats();
    // Optimize real-time data synchronization: Poll every 2 seconds instead of 10
    const iv = setInterval(fetchStats, 2000);
    return () => clearInterval(iv);
  }, []);

  /* ── When user clicks a LeetCode question, load it into the problem card ── */
  const handleSelectQuestion = useCallback(async (q) => {
    setOutput('📡 Loading full problem description...');
    setOutStatus('idle');
    setTestResults([]);
    setHasRun(false);
    setRuntimeMs(null);
    try {
      const res = await api.get(`/api/question/${q.titleSlug}`);
      setProblem({
        id:          q.titleSlug,
        title:       q.title,
        description: res.data.content || `Difficulty: ${q.difficulty} | No description available.`,
        difficulty:  q.difficulty.toLowerCase(),
      });
      setCode(`# ${q.title}\n# https://leetcode.com/problems/${q.titleSlug}/\n\n`);
      setOutput('New LeetCode problem loaded. Start coding!');
    } catch (err) {
      console.error('Failed to fetch question content:', err);
      setProblem({
        id:          q.titleSlug,
        title:       q.title,
        description: `Difficulty: ${q.difficulty} | Error loading full description.\n\nSolve it here: https://leetcode.com/problems/${q.titleSlug}/`,
        difficulty:  q.difficulty.toLowerCase(),
      });
      setOutput('⚠️  Loaded without full description.');
      setOutStatus('error');
    }
    setHints([]);
    setShowPanel(false);   // collapse panel after selection
  }, []);

  const handleTelemetry = useCallback((data) => {
    if (data.confidence !== undefined) setConfidence(Math.round(data.confidence * 100));
    if (data.emotion)    setEmotion(data.emotion);
    if (data.auto_hint)  setHints(h => h.includes(data.auto_hint) ? h : [...h, data.auto_hint]);

    // Stress Detection: check if negative
    const isNegative = ['angry', 'fear', 'sad', 'stressed', 'confused'].includes(data.emotion);
    if (isNegative) {
      setNegativeTimer(t => t + 2.5); // Telemetry usually fires every ~2.5s in WebcamFeed
    } else {
      setNegativeTimer(0);
    }
  }, []);

  // Monitor stress timer (7 mins = 420s)
  useEffect(() => {
    if (negativeTimer >= 420 && !showIntervention) {
      setShowIntervention(true);
      setNegativeTimer(0); // Reset after trigger
    }
  }, [negativeTimer, showIntervention]);

  const runCode = async () => {
    if (!problem) return;
    setIsRunning(true);
    setOutput('⚙️  Running your code against test cases...');
    setOutStatus('idle');
    setTestResults([]);
    try {
      const tags = problem.tags ? problem.tags.map(t => t.name) : [];
      const r = await api.post('/api/run_code', {
        problem_id: problem.id, code, is_submit: false,
        difficulty: problem.difficulty || 'easy', tags,
        description: problem.description || '',
      });
      setOutput(r.data.output);
      setOutStatus(r.data.success ? 'success' : 'error');
      setTestResults(r.data.test_results || []);
      setRuntimeMs(r.data.runtime_ms ?? null);
      setHasRun(true);
    } catch {
      setOutput('⚠️  Execution failed. Is the backend running?');
      setOutStatus('error');
    } finally { setIsRunning(false); }
  };

  const submitCode = async () => {
    if (!problem) return;
    if (!hasRun) {
      setOutput('⚠️  Please click Run first to validate your code before submitting!');
      setOutStatus('error');
      return;
    }
    setIsRunning(true);
    setOutput('📡 Submitting and syncing results...');
    setOutStatus('idle');

    try {
      const tags = problem.tags ? problem.tags.map(t => t.name) : [];
      const payload = {
        problem_id: problem.id, code, is_submit: true,
        difficulty: problem.difficulty || 'easy', tags,
        description: problem.description || '',
      };
      const r = await api.post('/api/run_code', payload);
      
      setOutput(r.data.output);
      setOutStatus(r.data.success ? 'success' : 'error');
      setTestResults(r.data.test_results || []);
      setRuntimeMs(r.data.runtime_ms ?? null);

      if (r.data.success) {
        setPrevMetrics({
          title:   problem.title,
          cpm:     cpm,
          emotion: emotion,
          time:    `${r.data.runtime_ms ?? '?'}ms`,
        });
        // Immediate transition to next question
        skipProblem();
      }
    } catch (err) {
      console.error('[FaceCode] Submission failed:', err);
      const msg = err.response?.data?.detail || err.message || 'Unknown Error';
      setOutput(`❌ Submission failed: ${msg}`);
      setOutStatus('error');
    } finally {
      setIsRunning(false);
    }
  };

  const askMentor = async () => {
    if (!problem) return;
    setIsLlm(true);
    try {
      const r = await api.post('/api/request_llm_hint', {
        title: problem.title, description: problem.description, code
      });
      setHints(h => [...h, r.data.hint]);
    } catch {
      setHints(h => [...h, 'AI Mentor temporarily unavailable.']);
    } finally { setIsLlm(false); }
  };

  const skipProblem = async () => {
    try {
      const r = await api.post('/api/get_next_problem');
      setProblem(r.data.problem);
      setCode(`# 🧠 Next Challenge: ${r.data.problem.title}\n# Write your solution here...\n\n`);
      setOutput('New problem loaded! Performance comparison activated.'); 
      setOutStatus('idle'); 
      setHints([]);
    } catch { 
      setOutput('Could not fetch next adaptive challenge.'); 
      setOutStatus('error'); 
    }
  };

  const diff       = problem?.difficulty?.toLowerCase() ?? 'easy';
  const confColor  = confidence >= 70 ? '#10b981' : confidence >= 40 ? '#f59e0b' : '#ef4444';

  if (!problem) return (
    <div className="loader-screen">
      <div className="loader-spin"/>
      <p>Initializing FaceCode Engine...</p>
    </div>
  );

  return (
    <div className="app-layout">
      {/* ── COLLAPSIBLE SIDEBAR ── */}
      <aside className={`global-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-brand">
          <div className="logo-icon">🧠</div>
          {sidebarOpen && <span className="logo-name">FaceCode</span>}
          <button className="btn-toggle-sidebar" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu size={18} />
          </button>
        </div>
        <nav className="sidebar-nav">
          <button className={`nav-item ${view === 'dashboard' ? 'active' : ''}`} onClick={() => setView('dashboard')} title="Dashboard">
            <LayoutDashboard size={20}/>
            {sidebarOpen && <span>Dashboard</span>}
          </button>
          <button className={`nav-item ${view === 'workspace' ? 'active' : ''}`} onClick={() => setView('workspace')} title="Challenges">
            <Swords size={20}/>
            {sidebarOpen && <span>Challenges</span>}
          </button>
          <button className={`nav-item ${view === 'analytics' ? 'active' : ''}`} onClick={() => setView('analytics')} title="Analytics">
            <PieChart size={20}/>
            {sidebarOpen && <span>Analytics</span>}
          </button>
          <button className={`nav-item ${view === 'settings' ? 'active' : ''}`} onClick={() => setView('settings')} title="Settings">
            <Settings size={20}/>
            {sidebarOpen && <span>Settings</span>}
          </button>
        </nav>
      </aside>

      {/* ── MAIN CONTENT AREA ── */}
      <div className="main-content-area">
        <header className="topbar sticky-topbar">
          <div className="diff-tabs">
            {['Easy','Medium','Hard'].map(d => {
              const key = d.toLowerCase();
              const isActive = showPanel && activeDiff === key;
              return (
                <button
                  key={d}
                  className={`diff-tab ${key} ${(diff === key && !showPanel && view === 'workspace') || isActive ? 'active' : ''}`}
                  onClick={() => {
                    setView('workspace');
                    if (activeDiff === key && showPanel) {
                      setShowPanel(false);
                    } else {
                      setActiveDiff(key);
                      setShowPanel(true);
                    }
                  }}
                >
                  {d}
                </button>
              );
            })}
          </div>

          <div className="topbar-actions">
            <div className="telemetry-compact tooltip" title="Real-time Performance (CPM & Focus %)">
              <span className="tel-item"><Zap size={14} color="var(--warning)"/> {cpm} CPM</span>
              <span className="tel-item" style={{ color:confColor }}><TrendingUp size={14}/> {confidence}%</span>
            </div>
            <button className="icon-btn tooltip" title="Toggle Theme" onClick={() => setTheme(theme==='light'?'dark':'light')}>
              {theme === 'light' ? <Moon size={16}/> : <Sun size={16}/>}
            </button>
            <button className="btn-skip tooltip" title="Skip to Next Problem" onClick={skipProblem}>
              <SkipForward size={14}/> Skip
            </button>
          </div>
        </header>

        {view === 'dashboard' && (
          <DashboardView stats={dbStats} liveConfidence={confidence} liveEmotion={emotion} onBack={() => setView('workspace')} />
        )}
        {view === 'analytics' && (
          <AnalyticsDashboardView stats={dbStats} />
        )}
        {view === 'settings' && (
          <SettingsView theme={theme} toggleTheme={() => setTheme(theme==='light'?'dark':'light')} onBack={() => setView('dashboard')} />
        )}
        {view === 'workspace' && (
        <div className="body-grid" style={{ gridTemplateColumns: showPanel ? '260px 280px 1fr 300px' : '280px 1fr 300px' }}>
        
        {/* LEFT: Overall Stats & Feedback */}
        <aside className="sidebar left">
          <WebcamFeed
            onTelemetryUpdate={handleTelemetry}
            currentProblemId={problem.id}
            activeCpm={cpm}
          />
          <div className="progress-section">
            <div className="progress-label">
              <span>Current Engagement</span>
              <span style={{ fontWeight:700, color:confColor }}>{confidence}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width:`${confidence}%`, background:confColor }}/>
            </div>
          </div>
          <div className="section-pad">
            <div className="stats-row">
              <div className="stat-pill"><div className="stat-val">{totalSolved}</div><div className="stat-lbl">Solved</div></div>
              <div className="stat-pill"><div className="stat-val">{avgTime}s</div><div className="stat-lbl">Avg Time</div></div>
            </div>
          </div>
          <div className="divider"/>
          <div className="section-pad">
            <div className="section-header">Engagement Trend</div>
            <UserJourneyTrend isDark={theme==='dark'}/>
          </div>
        </aside>

        {/* LeetCode Drawer */}
        {showPanel && (
          <aside className="leetcode-drawer">
            <div className="drawer-head">
              <span className="section-header">Library</span>
              <button onClick={() => setShowPanel(false)} className="btn-close"><X size={16}/></button>
            </div>
            <QuestionPanel selectedDiff={activeDiff} onSelectQuestion={handleSelectQuestion} />
          </aside>
        )}

        {/* CENTER: Main Workspace */}
        <main className="editor-column">
          {/* Comparison Bar */}
          {prevMetrics && (
            <div className="comparison-bar">
              <div className="comp-chip">
                <span className="comp-lbl">CPM Evolution</span>
                <span className="comp-val">
                  {cpm} <span className={cpm >= prevMetrics.cpm ? 'text-success' : 'text-error'}>
                    {cpm >= prevMetrics.cpm ? '↑' : '↓'}
                  </span>
                </span>
              </div>
              <div className="comp-chip">
                <span className="comp-lbl">Time to Beat</span>
                <span className="comp-val">{prevMetrics.time}</span>
              </div>
              <div className="comp-info">Last Solved: {prevMetrics.title}</div>
            </div>
          )}

          <div className="problem-panel">
            <div className="section-header">Challenge</div>
            <h2 className="problem-title">{problem.title}</h2>
            <div 
              className="problem-desc" 
              dangerouslySetInnerHTML={{ __html: problem.description }}
            />
          </div>

          <div className="editor-container">
            <div className="editor-toolbar">
              <div className="file-tab"><Code2 size={13}/> solution.py</div>
              <div className="toolbar-btns">
                <button className="btn-secondary" onClick={runCode} disabled={isRunning}><Play size={13}/> Run</button>
                <button
                  className="btn-primary"
                  onClick={submitCode}
                  disabled={isRunning}
                  title={!hasRun ? 'Run your code first before submitting' : ''}
                  style={{ opacity: hasRun ? 1 : 0.55 }}
                >
                  <CheckCircle size={13}/> {isRunning ? 'Processing...' : 'Submit Code'}
                </button>
              </div>
            </div>
            <div className="monaco-box">
              <CodeEditor 
                key={problem.id} 
                code={code} 
                setCode={setCode} 
                onCpmChange={setCpm} 
                isDark={theme==='dark'}
              />
            </div>
          </div>

          <div className="terminal">
            <div className="terminal-head"><TermIcon size={12}/> Console Output
              {runtimeMs !== null && (
                <span style={{ marginLeft: 'auto', fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                  ⚡ {runtimeMs} ms
                </span>
              )}
            </div>
            <div className={`terminal-body ${outStatus}`}>{output}</div>

            {/* Per-test-case result rows */}
            {testResults.length > 0 && (
              <div className="test-results-grid">
                {testResults.map((tc, i) => (
                  <div
                    key={i}
                    className="test-case-row"
                    style={{
                      display: 'flex', flexWrap: 'wrap', gap: '4px 12px',
                      padding: '6px 10px',
                      borderLeft: `3px solid ${tc.passed ? '#10b981' : '#ef4444'}`,
                      background: tc.passed ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)',
                      borderRadius: '0 4px 4px 0',
                      marginTop: 4,
                      fontSize: '0.72rem',
                      fontFamily: 'monospace',
                    }}
                  >
                    <span style={{ fontWeight: 700, color: tc.passed ? '#10b981' : '#ef4444' }}>
                      {tc.passed ? '✅' : '❌'} Case {i + 1}
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>{tc.label}</span>
                    {!tc.passed && (
                      <>
                        <span style={{ color: '#f59e0b' }}>Expected: <b>{tc.expected}</b></span>
                        <span style={{ color: '#ef4444' }}>Got: <b>{tc.got}</b></span>
                        {tc.error && <span style={{ color: '#ef4444', opacity: 0.8 }}>Err: {tc.error.split('\n').slice(-1)[0]}</span>}
                      </>
                    )}
                    <span style={{ color: 'var(--text-muted)', marginLeft: 'auto' }}>{tc.runtime_ms} ms</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>

        {/* RIGHT: Permanent AI Hints */}
        <aside className="hints-sidebar">
          <div className="section-pad">
            <div className="section-header" style={{ display:'flex', alignItems:'center', gap:6 }}>
              <Brain size={14}/> AI Adaptive Hints
            </div>
            <div className="hints-scroll">
              {hints.length === 0 ? (
                <div className="hints-empty">
                  <div className="hint-icon">🚀</div>
                  <p>AI Mentor is analyzing your approach...</p>
                  <span>Hints will appear here if you hesitate or run into syntax issues.</span>
                </div>
              ) : (
                hints.map((h, i) => (
                  <div className="premium-hint" key={i}>
                    <div className="hint-idx">HINT {i+1}</div>
                    <div className="hint-content">{h}</div>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="sidebar-footer">
            <button className="btn-ask-ai" onClick={askMentor} disabled={isLlm}>
              {isLlm ? <div className="loader-tiny"/> : <Brain size={16}/>}
              Request Guidance
            </button>
          </div>
        </aside>

        </div>
      )}

      {showIntervention && (
        <InterventionModal 
          onAccept={() => {
            setShowIntervention(false);
            setActiveDiff('easy');
            skipProblem();
          }} 
          onDecline={() => setShowIntervention(false)} 
        />
      )}
      </div>
    </div>
  );
}
