import React, { useRef, useEffect, memo } from 'react';
import Editor, { loader } from '@monaco-editor/react';

// Use local vs files from /public/vs with absolute path to ensure loader works
loader.config({
  paths: {
    vs: window.location.origin + '/vs'
  }
});

function CodeEditor_({ code, setCode, onCpmChange, isDark }) {
  const keystrokesRef = useRef(0);

  useEffect(() => {
    const iv = setInterval(() => {
      onCpmChange(keystrokesRef.current * 12);
      keystrokesRef.current = 0;
    }, 5000);
    return () => clearInterval(iv);
  }, [onCpmChange]);

  const handleChange = (val) => {
    setCode(val ?? '');
    keystrokesRef.current += 1;
  };

  return (
    <div className="monaco-outer">
      <Editor
        height="100%"
        width="100%"
        language="python"
        value={code}
        onChange={handleChange}
        theme={isDark ? 'vs-dark' : 'light'}
        options={{
          fontSize: 14,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          fontLigatures: true,
          minimap: { enabled: false },
          lineNumbers: 'on',
          renderLineHighlight: 'all',
          padding: { top: 16, bottom: 8 },
          smoothScrolling: true,
          cursorSmoothCaretAnimation: 'on',
          wordWrap: 'on',
          tabSize: 4,
          insertSpaces: true,
          automaticLayout: true,
          readOnly: false,
          domReadOnly: false,
          readOnlyMessage: { value: "Editing enabled." },
          fixedOverflowWidgets: true,
          scrollBeyondLastLine: false,
          accessibilitySupport: 'on',
        }}
        onMount={(editor, monaco) => {
          if (isDark) {
            monaco.editor.defineTheme('facecode-dark', {
              base: 'vs-dark',
              inherit: true,
              rules: [],
              colors: {
                'editor.background': '#0d1117',
                'editorLineNumber.foreground': '#30363d',
                'editorLineNumber.activeForeground': '#58a6ff',
                'editor.selectionBackground': '#1f6feb80',
              }
            });
            monaco.editor.setTheme('facecode-dark');
          }
          // Focus with small delay to ensure DOM is ready
          setTimeout(() => {
            editor.focus();
          }, 100);
        }}
      />
    </div>
  );
}

export default memo(CodeEditor_);
