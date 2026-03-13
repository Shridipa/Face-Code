import React, { useRef, useEffect, useState } from 'react';
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

  useEffect(() => {
    // Request face-optimised stream
    async function startCamera() {
      try {
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
      }
    }
    startCamera();

    const interval = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current) return;
      const canvas  = canvasRef.current;
      const video   = videoRef.current;
      const context = canvas.getContext('2d');

      // Capture a face-centred square crop from the video
      const vw = video.videoWidth  || 480;
      const vh = video.videoHeight || 360;
      const size = Math.min(vw, vh);           // square crop
      const sx = (vw - size) / 2;
      const sy = 0;                             // pin to top — gets the face

      canvas.width  = 224;
      canvas.height = 224;
      context.drawImage(video, sx, sy, size, size, 0, 0, 224, 224);
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

    return () => clearInterval(interval);
  }, [currentProblemId, activeCpm, onTelemetryUpdate]);

  return (
    <div className="cam-wrap">
      {/* Mirror flip so user sees themselves naturally */}
      <video ref={videoRef} autoPlay playsInline muted />
      <canvas ref={canvasRef} style={{ display: 'none' }} />

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
