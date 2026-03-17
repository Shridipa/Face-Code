import React, { useState } from 'react';
import { ChevronDown, ChevronRight, CheckCircle2, XCircle, Clock } from 'lucide-react';

export default function TestResultPanel({ results, totalRuntime, isDark }) {
  const [expanded, setExpanded] = useState(new Set([0])); // First case expanded by default

  if (!results || results.length === 0) return null;

  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;
  const allPassed = passedCount === totalCount;

  const toggleExpand = (idx) => {
    const next = new Set(expanded);
    if (next.has(idx)) next.delete(idx);
    else next.add(idx);
    setExpanded(next);
  };

  return (
    <div className="test-panel-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* Summary Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '12px 16px',
        borderRadius: '8px',
        background: allPassed ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
        border: `2px solid ${allPassed ? '#10b981' : '#ef4444'}`,
        color: allPassed ? '#0d9488' : '#e11d48',
      }}>
        {allPassed ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
        <span style={{ fontWeight: 600, fontSize: '0.95rem', marginLeft: '10px', flex: 1 }}>
          {allPassed ? 'Accepted' : 'Wrong Answer'}
        </span>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, opacity: 0.9, marginRight: '16px' }}>
          {passedCount} / {totalCount} Test Cases Passed
        </span>
        <div style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', opacity: 0.8 }}>
          <Clock size={12} /> {totalRuntime} ms
        </div>
      </div>

      {/* Individual Test Cases */}
      <div className="test-cases-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {results.map((tc, idx) => {
          const isExpanded = expanded.has(idx);
          const bg = tc.passed ? 'rgba(16,185,129,0.04)' : 'rgba(239,68,68,0.04)';
          const accentColor = tc.passed ? '#10b981' : '#ef4444';

          return (
            <div key={idx} style={{
              background: isDark ? 'var(--bg-app)' : '#fff',
              border: `1px solid var(--border)`,
              borderLeft: `4px solid ${accentColor}`,
              borderRadius: '6px',
              overflow: 'hidden',
              transition: 'all 0.2s ease',
            }}>
              {/* Card Header (Clickable) */}
              <div
                onClick={() => toggleExpand(idx)}
                style={{
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  background: bg,
                  userSelect: 'none',
                }}
              >
                <div style={{ color: accentColor, marginRight: '8px', display: 'flex' }}>
                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </div>
                <span style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-main)' }}>
                  Case {idx + 1}
                </span>
                <span style={{
                  marginLeft: 'auto',
                  fontSize: '0.7rem',
                  fontFamily: 'monospace',
                  color: 'var(--text-muted)'
                }}>
                  {tc.runtime_ms} ms
                </span>
              </div>

              {/* Card Body (Expanded) */}
              {isExpanded && (
                <div style={{ padding: '12px 14px', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase' }}>Input</div>
                    <div style={{
                      padding: '10px',
                      background: isDark ? '#010409' : '#f6f8fa',
                      borderRadius: '6px',
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                      fontFamily: 'JetBrains Mono, monospace',
                      color: 'var(--text-main)',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all',
                      fontSize: '0.8rem'
                    }}>
                      {tc.label}
                    </div>
                  </div>

                  {!tc.passed && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="output-box wrong">
                        <div style={{ fontSize: '0.7rem', color: '#ef4444', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase' }}>Output</div>
                        <div style={{
                          padding: '10px', background: 'rgba(239,68,68,0.1)', borderRadius: '6px',
                          border: '1.5px solid #ef4444', fontFamily: 'JetBrains Mono, monospace', color: '#e11d48',
                          whiteSpace: 'pre-wrap', wordBreak: 'break-all', minHeight: '40px', fontWeight: 600
                        }}>
                          {tc.got}
                        </div>
                      </div>
                      <div className="output-box expected">
                        <div style={{ fontSize: '0.7rem', color: '#10b981', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase' }}>Expected</div>
                        <div style={{
                          padding: '8px', background: 'rgba(16,185,129,0.05)', borderRadius: '4px',
                          border: '1px solid rgba(16,185,129,0.2)', fontFamily: 'monospace', color: '#10b981',
                          whiteSpace: 'pre-wrap', wordBreak: 'break-all', minHeight: '36px'
                        }}>
                          {tc.expected}
                        </div>
                      </div>
                    </div>
                  )}

                  {tc.passed && tc.got && tc.got !== "(no output)" && (
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase' }}>Output</div>
                      <div style={{
                        padding: '8px',
                        background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)',
                        borderRadius: '4px',
                        fontFamily: 'monospace',
                        color: 'var(--text-dim)',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all'
                      }}>
                        {tc.got}
                      </div>
                    </div>
                  )}

                  {tc.error && (
                    <div style={{ marginTop: '4px' }}>
                      <div style={{ fontSize: '0.7rem', color: '#ef4444', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase' }}>Error</div>
                      <div style={{
                        padding: '8px', background: 'rgba(239,68,68,0.1)', borderRadius: '4px',
                        fontFamily: 'monospace', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)',
                        whiteSpace: 'pre-wrap', wordBreak: 'break-all'
                      }}>
                        {tc.error}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
