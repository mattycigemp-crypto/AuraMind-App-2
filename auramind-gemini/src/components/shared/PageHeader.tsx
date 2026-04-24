import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, action }) => (
  <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 relative z-20">
    <div className="space-y-6">
      <p className="text-arch-eyebrow">{subtitle}</p>
      <h1 className="text-arch-impact text-arch-fg">{title}</h1>
    </div>
    {action}
  </div>
);

export default PageHeader;
