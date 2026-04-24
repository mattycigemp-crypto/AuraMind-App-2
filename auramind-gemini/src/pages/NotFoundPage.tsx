import React from 'react';

export const NotFoundPage = ({ navigate }: any) => (
  <div className="min-h-screen flex items-center justify-center p-6 bg-arch-bg text-center font-black">
    <div className="space-y-10">
      <h1 className="text-[120px] font-black text-arch-fg/5 select-none leading-none">404.</h1>
      <div className="space-y-4">
        <h2 className="text-arch-impact text-[32px] lowercase italic">Route Not Found.</h2>
        <p className="text-arch-muted text-[10px] uppercase tracking-[0.4em] italic max-w-sm mx-auto">The requested neural pathway does not exist in the current architecture.</p>
      </div>
      <button onClick={() => navigate('/')} className="btn-arch px-12">Return to Base</button>
    </div>
  </div>
);
