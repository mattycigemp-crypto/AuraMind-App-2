import { cn } from '@/lib/utils';

interface OverflowSafePillProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: string;
}

export function OverflowSafePill({ children, className, maxWidth = '120px' }: OverflowSafePillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium',
        'bg-[#7C3AED]/10 text-[#8B5CF6] border border-[#7C3AED]/20',
        'overflow-hidden text-ellipsis whitespace-nowrap',
        className,
      )}
      style={{ maxWidth }}
      title={typeof children === 'string' ? children : undefined}
    >
      {children}
    </span>
  );
}
