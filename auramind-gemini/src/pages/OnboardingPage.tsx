import React from 'react';
import { useNavigate } from 'react-router-dom';
import OnboardingTutorial from '../components/shared/OnboardingTutorial';

const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
      <OnboardingTutorial
        isOpen={true}
        onClose={() => navigate('/dashboard')}
        onComplete={() => navigate('/dashboard')}
      />
    </div>
  );
};

export default OnboardingPage;
