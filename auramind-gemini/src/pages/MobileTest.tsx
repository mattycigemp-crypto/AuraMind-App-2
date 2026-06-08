import React from 'react';
import MobileDashboard from '@/components/mobile/MobileDashboard';
import AchievementsDashboard from '@/components/gamification/AchievementsDashboard';

const MobileTestPage: React.FC = () => {
  return (
    <div className="mx-auto w-full max-w-7xl px-4">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-center mb-8">
          Mobile Experience Preview
        </h1>
        
        <div className="grid gap-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Mobile Dashboard</h2>
            <MobileDashboard />
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-4">Achievements & Challenges</h2>
            <AchievementsDashboard />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileTestPage;


