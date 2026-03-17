import React from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import DashboardView from '../components/DashboardView';

export default function DashboardPage() {
  const { dbStats } = useOutletContext();
  const navigate = useNavigate();
  return (
    <div className="practice-main">
      <div className="practice-content">
        <DashboardView stats={dbStats} liveConfidence={0} liveEmotion={'neutral'} onBack={() => navigate('/practice')} />
      </div>
    </div>
  );
}
