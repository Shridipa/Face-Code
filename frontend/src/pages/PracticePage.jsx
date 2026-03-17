import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Brain, SkipForward, CheckCircle,
  Code2, Terminal as TermIcon, TrendingUp, Zap, X,
  Menu, Sparkles, Save, Book, Library
} from 'lucide-react';
import FaceCodeLogo from '../components/FaceCodeLogo';
import api from '../api';
import '../App.css';
import QuestionPanel from '../components/QuestionPanel';
import CodeEditor from '../components/CodeEditor';
import TestResultPanel from '../components/TestResultPanel';
import InterventionModal from '../components/InterventionModal';
import AIInsightPanel from '../components/AIInsightPanel';
import FocusRecoveryPopup from '../components/FocusRecoveryPopup';
import { useOutletContext } from 'react-router-dom';
import Toast, { useToast } from '../components/Toast';
import HintButton from '../components/HintButton';
import HintCard from '../components/HintCard';



const LANG_OPTIONS = [
  { label: 'Python 3', value: 'python', slug: 'python3' },
  { label: 'JavaScript', value: 'javascript', slug: 'javascript' },
  { label: 'C++', value: 'cpp', slug: 'cpp' },
  { label: 'Java', value: 'java', slug: 'java' },
  { label: 'C', value: 'c', slug: 'c' }
];

const getFallbackCode = (lang, titleSlug) => {
  const funcName = titleSlug.replace(/-/g, '_');
  const templates = {
    python: `class Solution:\n    def ${funcName}(self, nums: List[int], target: int) -> List[int]:\n        # AI generated fallback\n        pass`,
    javascript: `/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nvar ${funcName} = function(nums, target) {\n    // AI generated fallback\n};`,
    cpp: `class Solution {\npublic:\n    vector<int> ${funcName}(vector<int>& nums, int target) {\n        // AI generated fallback\n    }\n};`,
    java: `class Solution {\n    public int[] ${funcName}(int[] nums, int target) {\n        // AI generated fallback\n        return new int[]{}; \n    }\n}`,
    c: `/**\n * Note: The returned array must be malloced, assume caller calls free().\n */\nint* ${funcName}(int* nums, int numsSize, int target, int* returnSize) {\n    // AI generated fallback\n}`
  };
  return templates[lang] || '';
};

export default function PracticePage() {
  const [problem,      setProblem]      = useState(null);
  const [language,     setLanguage]     = useState('python');
  const [code,         setCode]         = useState('# FaceCode Platform\n\n');
  const [output,       setOutput]       = useState('Ready to compile...');
  const [outStatus,    setOutStatus]    = useState('idle');
  const [hints,        setHints]        = useState([]);
  const [cpm,          setCpm]          = useState(0);
  const [confidence,   setConfidence]   = useState(50);
  const [emotion,      setEmotion]      = useState('neutral');
  const [isRunning,    setIsRunning]    = useState(false);
  const [testResults,  setTestResults]  = useState([]);
  const [hasRun,       setHasRun]       = useState(false);
  const [runtimeMs,    setRuntimeMs]    = useState(null);
  const [monaco,       setMonaco]       = useState({ editor: null, monaco: null });
  const [prevMetrics,  setPrevMetrics]  = useState(null);
  const [showPanel,    setShowPanel]    = useState(false);
  const [activeDiff,   setActiveDiff]   = useState('all');
  const { theme }                       = useOutletContext();
  const [showHintCard, setShowHintCard] = useState(false);
  const [negativeTimer, setNegativeTimer] = useState(0);
  const [showIntervention, setShowIntervention] = useState(false);
  const [activeBottomTab, setActiveBottomTab] = useState('console'); // 'console' | 'hints'

  // New: AI Coach state
  const [emotionHistory, setEmotionHistory]   = useState([]);
  const [coachMessage,   setCoachMessage]     = useState(null);
  const [coachCategory,  setCoachCategory]    = useState('strategy');

  // New: Focus recovery
  const [showFocusPopup, setShowFocusPopup]   = useState(false);
  const lastTypedRef                          = useRef(Date.now());
  const focusCheckRef                         = useRef(null);

  const { toasts, addToast, removeToast } = useToast();

  const handleSelectQuestion = useCallback(async (q) => {
    setOutput('📡 Loading full problem description...');
    setOutStatus('idle');
    setTestResults([]);
    setHasRun(false);
    setRuntimeMs(null);
    try {
      const res = await api.get(`/api/question/${q.titleSlug}`);
      setProblem({
        ...q,
        ...res.data,
        description: res.data.content || 'No description available.',
      });
      setOutput('Full description loaded. Start coding!');
      setOutStatus('success');
    } catch {
      setProblem(q);
      setOutput('⚠️  Loaded without full description.');
      setOutStatus('error');
    }
    setHints([]);
    setShowPanel(false);
  }, []); // ✅ Removed language dependency

  const skipProblem = useCallback(async () => {
    try {
      const res = await api.get('/api/questions');
      const list = res.data.questions;
      if (list && list.length > 0) {
        const rand = list[Math.floor(Math.random() * list.length)];
        // Reuse handleSelectQuestion so we definitely fetch descriptions/snippets!
        handleSelectQuestion(rand);
        if (monaco.editor && monaco.monaco) {
          monaco.monaco.editor.setModelMarkers(monaco.editor.getModel(), 'owner', []);
        }
      }
    } catch {
      setOutput('Failed to skip problem.');
    }
  }, [handleSelectQuestion, monaco]);

  const handleTelemetry = useCallback((data) => {
    if (data.confidence !== undefined) setConfidence(Math.round(data.confidence * 100));
    if (data.emotion) {
      setEmotion(data.emotion);
      // Track emotion history for trend + coach logic
      setEmotionHistory(h => [...h.slice(-9), data.emotion]);
    }
    if (data.auto_hint) setHints(h => h.includes(data.auto_hint) ? h : [...h, data.auto_hint]);
    const isNegative = ['angry', 'fear', 'sad', 'stressed', 'confused'].includes(data.emotion);
    if (isNegative) setNegativeTimer(t => t + 2.5);
    else setNegativeTimer(0);
  }, []);

  useEffect(() => {
    const fetchRandom = async () => {
      try {
        const res = await api.get('/api/questions');
        const list = res.data.questions;
        if (list && list.length > 0) {
          const rand = list[Math.floor(Math.random() * list.length)];
          handleSelectQuestion(rand);
        }
      } catch {
        setOutput('⚠️  Failed to load problems. Check backend connection.');
        setOutStatus('error');
      }
    };
    fetchRandom();
  }, [handleSelectQuestion]);

  useEffect(() => {
    if (!problem) return;
    const slugMap = { python: 'python3', javascript: 'javascript', cpp: 'cpp', java: 'java', c: 'c' };
    
    const applyScaffold = async () => {
      if (problem.codeSnippets) {
        const snippet = problem.codeSnippets.find(s => s.langSlug === slugMap[language]);
        if (snippet) {
          setCode(snippet.code);
          return;
        }
      }

      try {
        const res = await api.post('/api/generate_scaffold', {
          title: problem.title,
          description: problem.description,
          language: language
        });
        if (res.data.scaffold) {
          setCode(res.data.scaffold);
          return;
        }
      } catch (err) {
        console.error("Failed to generate AI scaffold:", err);
      }

      setCode(getFallbackCode(language, problem.titleSlug || 'solution'));
    };

    applyScaffold();
  }, [language, problem]);

  useEffect(() => {
    if (emotionHistory.length < 3) return;
    const last3 = emotionHistory.slice(-3);
    const allNeg = last3.every(e => ['angry', 'fear', 'sad', 'disgust'].includes(e));
    if (allNeg && !coachMessage) {
      const msgs = [
        { msg: "Try breaking the problem into two smaller sub-steps. What's the simplest version you can solve first?", cat: 'strategy' },
        { msg: "You're closer than you think! Consider what data structure would let you look up values instantly.", cat: 'motivation' },
        { msg: "A brute-force O(n\u00b2) approach might help clarify your thinking before you optimize.", cat: 'strategy' },
      ];
      const pick = msgs[Math.floor(Math.random() * msgs.length)];
      setCoachMessage(pick.msg);
      setCoachCategory(pick.cat);
    }
  }, [emotionHistory, coachMessage]);

  useEffect(() => {
    if (negativeTimer >= 420 && !showIntervention) {
      setShowIntervention(true);
      setNegativeTimer(0);
    }
  }, [negativeTimer, showIntervention]);

  useEffect(() => {
    focusCheckRef.current = setInterval(() => {
      const idleSec = (Date.now() - lastTypedRef.current) / 1000;
      if ((idleSec > 60 || confidence < 30) && !showFocusPopup && !showIntervention) {
        setShowFocusPopup(true);
      }
    }, 30000);
    return () => clearInterval(focusCheckRef.current);
  }, [confidence, showFocusPopup, showIntervention]);

  const runCode = async () => {
    if (!problem) return;
    setIsRunning(true);
    setOutput('🚀 Running your code against test cases...');
    setOutStatus('idle');
    setTestResults([]);
    try {
      const r = await api.post('/api/run_code', {
        code, language, titleSlug: problem.titleSlug, id: problem.id
      });
      setOutput(r.data.output || (r.data.success ? 'Success!' : 'Failed.'));
      setOutStatus(r.data.success ? 'success' : 'error');
      setTestResults(r.data.test_results || []);
      setRuntimeMs(r.data.runtime_ms ?? null);
      setHasRun(true);
      if (monaco.editor && monaco.monaco) {
        const markers = (r.data.line_markers || []).map(m => ({
          startLineNumber: m.line_number, endLineNumber: m.line_number,
          startColumn: 1, endColumn: 1000, message: m.message,
          severity: monaco.monaco.MarkerSeverity.Error
        }));
        monaco.monaco.editor.setModelMarkers(monaco.editor.getModel(), 'owner', markers);
      }
      addToast(r.data.success ? 'success' : 'error',
        r.data.success ? 'All test cases passed!' : 'Some test cases failed.',
        r.data.success ? '✅ Code Executed' : '❌ Execution Failed');
    } catch {
      setOutput('⚠️  Execution failed. Is the backend running?');
      setOutStatus('error');
      addToast('error', 'Backend connection failed.', 'Execution Error');
    } finally { setIsRunning(false); }
  };

  const submitCode = async () => {
    if (!problem) return;
    if (!hasRun) {
      setOutput('⚠️  Please click Run first!');
      setOutStatus('error');
      return;
    }
    setIsRunning(true);
    setOutput('📡 Submitting and syncing results...');
    setOutStatus('idle');
    try {
      const r = await api.post('/api/run_code', {
        code, language, titleSlug: problem.titleSlug, id: problem.id,
        metrics: { cpm, emotion, confidence },
        is_submit: true
      });
      setOutput(r.data.output);
      setOutStatus(r.data.success ? 'success' : 'error');
      setTestResults(r.data.test_results || []);
      setRuntimeMs(r.data.runtime_ms ?? null);
      if (r.data.success) {
        setPrevMetrics({ title: problem.title, cpm, emotion, time: `${r.data.runtime_ms ?? '?'}ms` });
        addToast('success', `${problem.title} solved!`, '🎉 Submitted');
        skipProblem();
      }
    } catch {
      setOutput('⚠️  Submission failed.');
      setOutStatus('error');
      addToast('error', 'Submission process failed.', 'Network Error');
    } finally { setIsRunning(false); }
  };

  const askMentor = async () => {
    if (!problem) return;
    try {
      const r = await api.post('/api/request_llm_hint', {
        title: problem.title, description: problem.description, code
      });
      setHints(h => [...h, r.data.hint]);
      setActiveBottomTab('hints');
      addToast('hint', 'A new hint has been added to the AI panel.', '💡 Hint Unlocked');
    } catch {
       addToast('error', 'AI Mentor temporarily unavailable.', 'Network Error');
    }
  };

  const diff = problem?.difficulty?.toLowerCase() ?? 'easy';

  if (!problem) return (
    <div className="loader-screen">
      <div className="loader-box">
        <motion.div
          className="loader-logo-ring"
          animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <FaceCodeLogo size={80} />
        </motion.div>
        <motion.h2
          className="loader-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Initializing FaceCode
        </motion.h2>
        <motion.p
          className="loader-subtitle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          Loading problem set & emotion engine...
        </motion.p>
        <div className="loader-steps">
          {['Connecting to AI engine', 'Fetching problems', 'Setting up workspace'].map((s, i) => (
            <motion.div
              key={s}
              className="loader-step"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.4 }}
            >
              <motion.span
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.3 }}
                style={{ color: '#6366F1', fontSize: '0.6rem' }}
              >⬤</motion.span>
              {s}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="practice-main">
        <header className="practice-topbar">
          <div className="topbar-left">
            <button className="menu-btn" onClick={() => setShowPanel(!showPanel)}>
              {showPanel ? <X size={18}/> : <Menu size={18}/>}
            </button>
            <div className="flex items-center gap-3">
               <h1 className="logo-text">FaceCode</h1>
               <button 
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    showPanel ? 'bg-fc-primary text-white' : 'bg-gray-900 border border-gray-800 text-gray-400 hover:text-white'
                  }`}
                  onClick={() => setShowPanel(!showPanel)}
               >
                  <Book size={14} />
                  <span>Library</span>
               </button>
               <div className="h-4 w-[1px] bg-gray-800" />
               <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-gray-800 px-2 py-0.5 rounded">Adaptive Mode</span>
            </div>
          </div>
          <div className="topbar-right">
            <div className="flex items-center gap-4 text-xs font-bold">
               <div className="flex items-center gap-1.5 px-2 py-1 bg-yellow-500 bg-opacity-10 text-yellow-500 rounded-md border border-yellow-500 border-opacity-20 animate-pulse">
                  <Zap size={12} />
                  <span>{cpm} CPM</span>
               </div>
               <div className="flex items-center gap-1.5 px-2 py-1 bg-fc-accent bg-opacity-10 text-fc-accent rounded-md border border-fc-accent border-opacity-20">
                  <TrendingUp size={12} />
                  <span>{confidence}% CONFIDENCE</span>
               </div>
            </div>
          </div>
        </header>

        <div className="practice-content">
          <div className="workspace-grid" style={{ gridTemplateColumns: showPanel ? '260px 1fr 300px' : '1fr 300px' }}>
                <AnimatePresence>
                  {showPanel && (
                    <motion.aside
                      className="leetcode-drawer"
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 260, opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="drawer-head">
                        <span className="section-header">Library</span>
                        <button onClick={() => setShowPanel(false)} className="btn-close"><X size={16}/></button>
                      </div>
                      <QuestionPanel selectedDiff={activeDiff} onSelectQuestion={handleSelectQuestion} />
                    </motion.aside>
                  )}
                </AnimatePresence>

                <main className="center-column">
                  <AnimatePresence>
                    {prevMetrics && (
                      <motion.div
                        className="comparison-bar"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                      >
                        <div className="comp-chip"><span className="comp-lbl">CPM</span><span className="comp-val">{cpm}</span></div>
                        <div className="comp-chip"><span className="comp-lbl">Time to Beat</span><span className="comp-val">{prevMetrics.time}</span></div>
                        <div className="comp-info">Last Solved: {prevMetrics.title}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="problem-panel">
                    <div className="problem-header">
                      <div>
                        <h2 className="problem-title">{problem.title}</h2>
                        <div className="problem-meta">
                          <span className={`diff-badge ${diff}`}>{diff.charAt(0).toUpperCase() + diff.slice(1)}</span>
                          {problem.tags?.slice(0,3).map(t => (
                            <span key={t.name} className="tag-chip">{t.name}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="problem-desc" dangerouslySetInnerHTML={{ __html: problem.description }} />
                  </div>

                  <div className="editor-container relative">
                    <div className="editor-toolbar flex items-center justify-between px-4 py-2 border-b border-fc-border bg-gray-900 bg-opacity-40">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                          <Code2 size={14} className="text-fc-primary" />
                          <select
                            value={language}
                            onChange={e => setLanguage(e.target.value)}
                            className="bg-transparent border-none focus:outline-none text-gray-200 cursor-pointer"
                          >
                            {LANG_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                          </select>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-600 uppercase tracking-tighter">
                           <Save size={10} />
                           <span>Autosaved</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-400 hover:bg-gray-800 hover:text-white transition-all disabled:opacity-50"
                          onClick={runCode} disabled={isRunning}>
                          <Play size={12} /> Run
                        </button>
                        <button className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-fc-primary text-white text-xs font-bold hover:bg-opacity-90 transition-all active:scale-95 disabled:opacity-50"
                          onClick={submitCode} disabled={isRunning || !hasRun}>
                          <CheckCircle size={12} /> {isRunning ? 'Processing...' : 'Submit'}
                        </button>
                        <div className="w-[1px] h-4 bg-gray-800 mx-1" />
                        <HintButton 
                          onClick={() => { askMentor(); setShowHintCard(true); }} 
                          emotion={emotion} 
                        />
                        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-400 hover:text-white transition-all"
                          onClick={skipProblem}>
                          <SkipForward size={12} /> Skip
                        </button>
                      </div>
                    </div>

                    <div className="relative">
                      <div className="absolute top-0 left-0 right-0 p-4 z-20 pointer-events-none">
                        <div className="max-w-md mx-auto pointer-events-auto">
                          <HintCard 
                            hint={hints[hints.length - 1]} 
                            visible={showHintCard} 
                            onClose={() => setShowHintCard(false)} 
                            onViewAll={() => { setActiveBottomTab('hints'); setShowHintCard(false); }}
                          />
                        </div>
                      </div>

                      <div className="monaco-box">
                        <CodeEditor
                          key={problem.id}
                          code={code}
                          setCode={(val) => {
                            setCode(val);
                            lastTypedRef.current = Date.now();
                          }}
                          onCpmChange={setCpm}
                          isDark={theme === 'dark'}
                          language={language}
                          onEditorMount={(editor, monaco) => setMonaco({ editor, monaco })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="terminal">
                    <div className="terminal-head flex items-center gap-4 px-4 bg-gray-900 border-b border-fc-border">
                      <button 
                        className={`flex items-center gap-2 py-2 text-xs font-bold border-b-2 transition-all ${activeBottomTab === 'console' ? 'border-fc-primary text-gray-200' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                        onClick={() => setActiveBottomTab('console')}
                      >
                        <TermIcon size={12}/> Console Output
                      </button>
                      <button 
                        className={`flex items-center gap-2 py-2 text-xs font-bold border-b-2 transition-all ${activeBottomTab === 'hints' ? 'border-fc-primary text-gray-200' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                        onClick={() => setActiveBottomTab('hints')}
                      >
                        <Brain size={12}/> Hints {hints.length > 0 && <span className="bg-fc-accent bg-opacity-20 text-fc-accent px-1.5 rounded-full text-[10px]">{hints.length}</span>}
                      </button>
                      
                      {runtimeMs !== null && activeBottomTab === 'console' && (
                        <span className="ml-auto text-[10px] text-gray-500 font-bold">
                          ⚡ {runtimeMs}ms
                        </span>
                      )}
                    </div>
                    
                    {activeBottomTab === 'console' ? (
                      <>
                        <div className={`terminal-body ${outStatus}`}>{output}</div>
                        <TestResultPanel results={testResults} totalRuntime={runtimeMs} isDark={theme === 'dark'} />
                      </>
                    ) : (
                      <div className="p-4 flex flex-col gap-3 max-h-[250px] overflow-y-auto w-full max-w-full">
                        {hints.length === 0 ? (
                          <div className="text-gray-500 text-sm text-center py-6 font-medium">
                            No hints requested yet. Click "Get Hint" above if you get stuck!
                          </div>
                        ) : (
                          hints.map((h, i) => (
                            <div key={i} className="bg-fc-warning bg-opacity-5 border border-fc-warning border-opacity-20 rounded-lg p-3 w-full group hover:bg-opacity-10 transition-all">
                              <div className="flex items-center gap-2 mb-1">
                                <Sparkles size={10} className="text-fc-warning" />
                                <span className="text-[10px] font-bold text-fc-warning uppercase tracking-widest block">AI Hint {i + 1}</span>
                              </div>
                              <p className="text-sm text-gray-200 w-full whitespace-pre-wrap leading-relaxed">{h}</p>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-6 px-4 py-3 bg-gray-900 bg-opacity-30 border-t border-fc-border rounded-b-xl">
                    <span className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none">
                      <kbd className="px-1.5 py-0.5 bg-gray-800 border border-gray-700 rounded text-gray-300">Ctrl</kbd>
                      <span>+</span>
                      <kbd className="px-1.5 py-0.5 bg-gray-800 border border-gray-700 rounded text-gray-300">Enter</kbd>
                      <span className="ml-1">Run Code</span>
                    </span>
                    <span className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none">
                      <kbd className="px-1.5 py-0.5 bg-gray-800 border border-gray-700 rounded text-gray-300">Ctrl</kbd>
                      <span>+</span>
                      <kbd className="px-1.5 py-0.5 bg-gray-800 border border-gray-700 rounded text-gray-300">Shift</kbd>
                      <span>+</span>
                      <kbd className="px-1.5 py-0.5 bg-gray-800 border border-gray-700 rounded text-gray-300">Enter</kbd>
                      <span className="ml-1">Submit</span>
                    </span>
                  </div>
                </main>

                <AIInsightPanel
                  emotion={emotion}
                  confidence={confidence}
                  currentProblemId={problem.id}
                  activeCpm={cpm}
                  onTelemetryUpdate={handleTelemetry}
                  coachMessage={coachMessage}
                  coachCategory={coachCategory}
                  onDismissCoach={() => setCoachMessage(null)}
                  emotionHistory={emotionHistory}
                />
              </div>
          </div>
        </div>

        {showIntervention && (
          <InterventionModal
            onAccept={() => { setShowIntervention(false); setActiveDiff('easy'); skipProblem(); }}
            onDecline={() => setShowIntervention(false)}
          />
        )}

        {showFocusPopup && (
          <FocusRecoveryPopup
            onIgnore={() => setShowFocusPopup(false)}
            onComplete={() => {
              setShowFocusPopup(false);
              lastTypedRef.current = Date.now();
            }}
          />
        )}

        <Toast toasts={toasts} onRemove={removeToast} />
    </>
  );
}
