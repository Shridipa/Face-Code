import React, { useRef, useEffect, useState, useCallback } from 'react';
import api from '../api';

const EMOTION_BG = {
  happy:    'rgba(16,185,129,0.85)',
  surprise: 'rgba(59,130,246,0.85)',
  neutral:  'rgba(30,30,30,0.6)',
  sad:      'rgba(99,102,241,0.85)',
  fear:     'rgba(245,158,11,0.85)',
  angry:    'rgba(239,68,68,0.85)',
  disgust:  'rgba(168,85,247,0.85)',
};

const WebcamFeed = ({ onTelemetryUpdate, currentProblemId, activeCpm }) => {
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const [emotion, setEmotion] = useState('neutral');
  const [error, setError] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Request face-optimised stream
  const startCamera = useCallback(async () => {
    setError(null);
    try {
      if (isSimulating) return; // Don't request camera if simulation is on

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width:  { ideal: 480 },
          height: { ideal: 360 },
          frameRate: { ideal: 15 },
        }
      });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      console.error('Camera error:', err);
      // NotReadableError = Busy, NotAllowedError = Perms
      if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setError('Camera is busy. Another app or tab is using it.');
      } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Camera permission denied.');
      } else {
        setError('Could not access camera.');
      }
    }
  }, [isSimulating]);
  useEffect(() => {
    if (!isSimulating) {
      startCamera();
    } else {
      // Stop tracks if switching to simulation
      if (videoRef.current?.srcObject) {
         const tracks = videoRef.current.srcObject.getTracks();
         tracks.forEach(t => t.stop());
         videoRef.current.srcObject = null;
      }
    }

    const currentVideo = videoRef.current;
    const interval = setInterval(async () => {
      // Simulation Logic
      if (isSimulating) {
        const simulatedEmotions = ['neutral', 'happy', 'sad', 'angry', 'fear', 'neutral'];
        const randomEmotion = simulatedEmotions[Math.floor(Math.random() * simulatedEmotions.length)];
        const simulatedData = {
          emotion: randomEmotion,
          confidence: 0.4 + Math.random() * 0.5,
          is_inactive: false,
          auto_hint: null
        };
        setEmotion(randomEmotion);
        onTelemetryUpdate(simulatedData);
        return;
      }

      if (!currentVideo || !canvasRef.current || error) return;
      const canvas  = canvasRef.current;
      
      // Ensure video is playing and has dimensions
      if (currentVideo.readyState < 2 || currentVideo.videoWidth === 0) return;

      const context = canvas.getContext('2d');

      // Capture a face-centred square crop
      const vw = currentVideo.videoWidth;
      const vh = currentVideo.videoHeight;
      const size = Math.min(vw, vh);
      const sx = (vw - size) / 2;
      const sy = (vh - size) / 2;

      canvas.width  = 224;
      canvas.height = 224;
      context.drawImage(currentVideo, sx, sy, size, size, 0, 0, 224, 224);
      const frameData = canvas.toDataURL('image/jpeg', 0.7);

      try {
        const res = await api.post('/api/process_telemetry', {
          frame_data: frameData,
          cpm: activeCpm,
          is_inactive: false,
          problem_id: currentProblemId,
        });
        setEmotion(res.data.emotion ?? 'neutral');
        onTelemetryUpdate(res.data);
      } catch {
        // silently ignore network blips
      }
    }, 2500);

    return () => {
      clearInterval(interval);
      if (currentVideo?.srcObject) {
        const stream = currentVideo.srcObject;
        if (stream instanceof MediaStream) {
          stream.getTracks().forEach(t => t.stop());
        }
      }
    };
  }, [currentProblemId, activeCpm, onTelemetryUpdate, isSimulating, retryCount, startCamera]);

  return (
    <div className="cam-wrap relative group">
      {/* Mirror flip */}
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        muted 
        style={{ transform: 'scaleX(-1)', width: '100%', height: '100%', objectFit: 'cover' }}
      />
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Error / Simulation Overlay */}
      {error && !isSimulating && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-4 bg-gray-900/90 backdrop-blur-md text-center">
          <div className="mb-2 text-fc-accent">
             <div className="p-2 bg-fc-accent/10 rounded-full inline-block">⚠️</div>
          </div>
          <p className="text-[11px] font-bold text-gray-200 mb-3 leading-tight max-w-[150px]">
            {error}
          </p>
          <div className="flex flex-col gap-2 w-full">
            <button 
              onClick={() => { setRetryCount(c => c + 1); startCamera(); }}
              className="px-3 py-1.5 bg-fc-primary hover:bg-fc-primary/80 text-[10px] font-bold rounded-lg transition-all"
            >
              Retry Connection
            </button>
            <button 
              onClick={() => setIsSimulating(true)}
              className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-[10px] font-bold rounded-lg transition-all border border-gray-700"
            >
              Enable Simulation Mode
            </button>
          </div>
        </div>
      )}

      {isSimulating && (
        <div className="absolute top-2 left-2 z-30 px-2 py-0.5 bg-fc-warning/20 border border-fc-warning rounded text-[9px] font-bold text-fc-warning tracking-wider animate-pulse">
          SIMULATED FEED
        </div>
      )}

      {/* Emotion overlay badge */}
      <div style={{
        position: 'absolute', bottom: 10, left: 10,
        background: EMOTION_BG[emotion] ?? EMOTION_BG.neutral,
        backdropFilter: 'blur(6px)',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: 20,
        padding: '3px 12px',
        fontSize: '0.68rem',
        fontWeight: 700,
        color: '#fff',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <span style={{
          width: 7, height: 7, borderRadius: '50%',
          background: '#fff', opacity: 0.9,
          animation: 'blink 2s ease-in-out infinite'
        }}/>
        {emotion}
      </div>

      {/* CPM badge */}
      <div style={{
        position: 'absolute', top: 10, right: 10,
        background: 'rgba(0,0,0,0.45)',
        backdropFilter: 'blur(4px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 8,
        padding: '2px 8px',
        fontSize: '0.62rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)',
      }}>
        {activeCpm} CPM
      </div>
    </div>
  );
};

export default WebcamFeed;
