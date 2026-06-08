import React from 'react';
import { Link } from 'react-router-dom';

const MobileNav: React.FC = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-sm border-t border-muted/20 z-50">
      <div className="flex h-full items-center justify-center space-x-6">
        <Link to="/" className="flex flex-col items-center text-sm font-medium">
          <span className="material-symbols-outlined mb-1">dashboard</span>
          <span>Dashboard</span>
        </Link>
        
        <Link to="/cards" className="flex flex-col items-center text-sm font-medium">
          <span className="material-symbols-outlined mb-1">menu_book</span>
          <span>Cards</span>
        </Link>
        
        <Link to="/chat" className="flex flex-col items-center text-sm font-medium">
          <span className="material-symbols-outlined mb-1">psychology</span>
          <span>AI Chat</span>
        </Link>
        
        <Link to="/settings" className="flex flex-col items-center text-sm font-medium">
          <span className="material-symbols-outlined mb-1">settings</span>
          <span>Settings</span>
        </Link>
      </div>
    </nav>
  );
};

export default MobileNav;


