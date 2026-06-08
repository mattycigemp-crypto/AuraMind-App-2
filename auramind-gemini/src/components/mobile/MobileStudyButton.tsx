import React from 'react';
import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';

const MobileStudyButton: React.FC = () => {
  const { toast } = useToast();

  const handleStudyStart = () => {
    toast({
      title: "Study session started!",
      description: "Let's learn something new today",
      variant: "default",
    });
    // In a real app, this would navigate to the study mode
  };

  return (
    <Button 
      variant="primary" 
      onClick={handleStudyStart}
      className="w-full py-4 text-lg font-bold flex items-center justify-center gap-2"
    >
      <span className="material-symbols-outlined">play_arrow</span>
      Start Study
    </Button>
  );
};

export default MobileStudyButton;


