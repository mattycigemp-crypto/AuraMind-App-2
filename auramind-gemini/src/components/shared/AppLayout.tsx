import React from 'react';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-background">
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default AppLayout;


