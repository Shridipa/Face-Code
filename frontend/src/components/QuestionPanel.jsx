import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';
import { Search, Filter, Book } from 'lucide-react';

const DIFF_COLOR = {
  EASY:   { bg: 'rgba(16,185,129,0.1)',  text: '#10b981', border: 'rgba(16,185,129,0.25)' },
  MEDIUM: { bg: 'rgba(245,158,11,0.1)',  text: '#f59e0b', border: 'rgba(245,158,11,0.25)' },
  HARD:   { bg: 'rgba(239,68,68,0.1)',   text: '#ef4444', border: 'rgba(239,68,68,0.25)' },
};

const TAG_COLORS = ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444','#06b6d4'];

export default function QuestionPanel({ onSelectQuestion }) {
  const [questions, setQuestions] = useState([]);
  const [total,     setTotal]     = useState(0);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);
  const [page,      setPage]      = useState(0);
  const [search,    setSearch]    = useState('');
  const [difficulty, setDifficulty] = useState('ALL');
  const PER_PAGE = 20;

  const load = useCallback(async (diff, pageNum, query) => {
    setLoading(true);
    setError(null);
    try {
      const p = { limit: PER_PAGE, skip: pageNum * PER_PAGE };
      if (diff !== 'ALL') p.difficulty = diff.toUpperCase();
      if (query) p.search = query;

      const res = await api.get('/api/questions', { params: p });
      setQuestions(res.data.questions ?? []);
      setTotal(res.data.total ?? 0);
    } catch (e) {
      setError('Could not fetch questions. LeetCode may be rate-limiting.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Re-fetch when difficulty tab, page, or search changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(0);
      load(difficulty, 0, search);
    }, 400); // Debounce search
    return () => clearTimeout(timer);
  }, [difficulty, search, load]);

  useEffect(() => {
    if (page > 0) load(difficulty, page, search);
  }, [page, load, difficulty, search]);

  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <div className="question-panel h-full flex flex-col overflow-hidden bg-gray-950 border-r border-gray-800">
      
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-gray-900/40">
        <div className="flex items-center gap-2">
          <Book size={16} className="text-fc-primary" />
          <span className="font-bold text-sm tracking-tight">LeetCode Library</span>
        </div>
        {loading && <div className="loader-mini" />}
      </div>

      {/* Search & Filter */}
      <div className="p-3 border-b border-gray-800 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
          <input
            type="text"
            placeholder="Search problems..."
            className="w-full bg-gray-900 border border-gray-800 rounded-lg py-1.5 pl-9 pr-4 text-xs focus:border-fc-primary focus:ring-1 focus:ring-fc-primary outline-none transition-all"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex gap-1">
          {['ALL', 'EASY', 'MEDIUM', 'HARD'].map(d => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`flex-1 py-1 text-[10px] font-bold rounded-md border transition-all ${
                difficulty === d 
                  ? 'bg-fc-primary/10 border-fc-primary text-fc-primary' 
                  : 'bg-transparent border-gray-800 text-gray-500 hover:border-gray-700'
              }`}
            >
              {d === 'ALL' ? 'Everything' : d}
            </button>
          ))}
        </div>
      </div>

      {/* Question list */}
      <div style={{ flex:1, overflowY:'auto', padding:'8px 0' }}>
        {error && (
          <div style={{ padding:'12px 16px', color:'var(--text-muted)', fontSize:'0.8rem' }}>
            ⚠️ {error}
          </div>
        )}

        {!loading && questions.length === 0 && !error && (
          <div style={{ padding:'12px 16px', color:'var(--text-muted)', fontSize:'0.8rem', fontStyle:'italic' }}>
            No questions loaded yet.
          </div>
        )}

        {questions.map((q, i) => {
          const dc = DIFF_COLOR[q.difficulty] ?? DIFF_COLOR.EASY;
          return (
            <div
              key={q.titleSlug}
              onClick={() => onSelectQuestion(q)}
              style={{
                padding:'10px 16px',
                borderBottom:'1px solid var(--border)',
                cursor:'pointer',
                transition:'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background='var(--bg-app)'}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}
            >
              {/* Title row */}
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5 }}>
                <span style={{ fontSize:'0.72rem', color:'var(--text-muted)', minWidth:24 }}>
                  {page * PER_PAGE + i + 1}.
                </span>
                <span style={{ fontSize:'0.82rem', fontWeight:600, color:'var(--text-main)', flex:1 }}>
                  {q.title}
                </span>
                <span style={{
                  fontSize:'0.65rem', fontWeight:700, padding:'2px 8px',
                  borderRadius:20, background:dc.bg, color:dc.text, border:`1px solid ${dc.border}`,
                  textTransform:'uppercase', letterSpacing:'0.3px', flexShrink:0
                }}>
                  {q.difficulty}
                </span>
              </div>

              {/* Tags */}
              {q.topicTags.length > 0 && (
                <div style={{ display:'flex', flexWrap:'wrap', gap:4, paddingLeft:32 }}>
                  {q.topicTags.slice(0, 4).map((tag, ti) => (
                    <span key={tag} style={{
                      fontSize:'0.62rem', padding:'1px 7px', borderRadius:20,
                      background:`${TAG_COLORS[ti % TAG_COLORS.length]}18`,
                      color: TAG_COLORS[ti % TAG_COLORS.length],
                      border:`1px solid ${TAG_COLORS[ti % TAG_COLORS.length]}30`,
                    }}>
                      {tag}
                    </span>
                  ))}
                  {q.topicTags.length > 4 && (
                    <span style={{ fontSize:'0.62rem', color:'var(--text-muted)' }}>
                      +{q.topicTags.length - 4}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{
          display:'flex', alignItems:'center', justifyContent:'center', gap:8,
          padding:'10px', borderTop:'1px solid var(--border)', flexShrink:0
        }}>
          <button
            onClick={() => setPage(p => Math.max(0, p-1))}
            disabled={page === 0 || loading}
            style={{ padding:'4px 12px', borderRadius:6, border:'1px solid var(--border)',
              background:'var(--bg-card)', color:'var(--text-dim)', cursor:'pointer',
              fontSize:'0.75rem', fontWeight:600, transition:'all 0.2s' }}
          >
            ← Prev
          </button>
          <span style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>
            Page {page+1} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages-1, p+1))}
            disabled={page >= totalPages-1 || loading}
            style={{ padding:'4px 12px', borderRadius:6, border:'1px solid var(--border)',
              background:'var(--bg-card)', color:'var(--text-dim)', cursor:'pointer',
              fontSize:'0.75rem', fontWeight:600, transition:'all 0.2s' }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
