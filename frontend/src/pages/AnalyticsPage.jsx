import React from 'react';
import { useOutletContext } from 'react-router-dom';
import AnalyticsDashboardView from '../components/AnalyticsDashboardView';

export default function AnalyticsPage() {
  const { dbStats } = useOutletContext();
  return (
    <div className="practice-main">
      <div className="practice-content">
        <AnalyticsDashboardView stats={dbStats} />
      </div>
    </div>
  );
}
