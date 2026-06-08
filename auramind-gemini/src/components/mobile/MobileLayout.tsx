import React from 'react';
import { Outlet } from 'react-router-dom';
import MobileNav from './MobileNav';
import { useMediaQuery } from 'react-responsive';

const MobileLayout: React.FC = () => {
  const isMobile = useMediaQuery({ maxWidth: 768 });

  return (
    <div>
      {!isMobile && (
        <Outlet />
      )}
      {isMobile && (
        <>
          <Outlet />
          <MobileNav />
        </>
      )}
    </div>
  );
};

export default MobileLayout;


