import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangleIcon as AlertTriangle, CheckCircle2Icon as CheckCircle2, InfoIcon as Info, MessageSquareWarningIcon as MessageSquareWarning } from '../../icons/CustomIcons';

interface ToastProps {
  id: string;
  title: string;
  description?: string;
  variant: 'default' | 'success' | 'warning' | 'error' | 'info';
  duration?: number; // milliseconds
  onClose: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const Toast: React.FC<ToastProps> = ({
  id,
  title,
  description,
  variant = 'default',
  duration = 5000,
  onClose,
  action
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Start progress timer
    const interval = setInterval(() => {
      setProgress(prev => Math.max(0, prev - 10));
    }, duration / 1000 * 10); // Update every 10% of duration
    
    // Auto-dismiss after duration
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, duration);

    return () => {
      clearInterval(interval);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [duration]);

  const handleClose = () => {
    setIsVisible(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    onClose();
  };

  const handleActionClick = () => {
    if (action) {
      action.onClick();
    }
    handleClose();
  };

  if (!isVisible) return null;

  const variantConfig: Record<string, { bgColor: string; textColor: string; borderColor: string; icon: React.ComponentType<{ className?: string }> }> = {
    default: { bgColor: 'bg-primary/10', textColor: 'text-primary', borderColor: 'border-primary/20', icon: Info },
    success: { bgColor: 'bg-emerald-500/10', textColor: 'text-emerald-500', borderColor: 'border-emerald-500/20', icon: CheckCircle2 },
    warning: { bgColor: 'bg-amber-500/10', textColor: 'text-amber-500', borderColor: 'border-amber-500/20', icon: MessageSquareWarning },
    error: { bgColor: 'bg-red-500/10', textColor: 'text-red-500', borderColor: 'border-red-500/20', icon: AlertTriangle },
    info: { bgColor: 'bg-blue-500/10', textColor: 'text-blue-500', borderColor: 'border-blue-500/20', icon: Info }
  };

  const config = variantConfig[variant] || variantConfig.default;

  return (
    <div
      key={id}
      className={`fixed bottom-4 right-4 max-w-sm w-full transform transition-all duration-300 ease-out 
                  opacity-0 scale-95 pointer-events-auto
                  ${isVisible ? 'opacity-100 scale-100' : ''}
                  z-50`}
    >
      <div className={`flex w-full items-start gap-4 p-4 rounded-xl 
                       ${config.bgColor} ${config.borderColor}
                       shadow-lg backdrop-blur-sm
                       transition-all duration-300 ease-out
                       hover:shadow-xl
                       `}>
        <div className="flex-shrink-0 flex items-center justify-center">
          <config.icon className={`w-5 h-5 ${config.textColor}`} />
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className={`font-semibold text-sm ${config.textColor}`}>{title}</h3>
            <button
              onClick={handleClose}
              className="p-1 rounded hover:bg-primary/10 text-zinc-400"
              aria-label="Dismiss"
            >
              <span className="sr-only">Close</span>
            </button>
          </div>
          {description && (
            <p className={`text-xs text-zinc-300/80`}>{description}</p>
          )}
          {action && (
            <button
              onClick={handleActionClick}
              className={`px-3 py-1.5 rounded text-xs font-semibold ${config.textColor} 
                         border border-${config.textColor}/20 hover:bg-${config.textColor}/10`}
            >
              {action.label}
            </button>
          )}
        </div>
      </div>
      <div className={`h-0.5 w-full bg-${config.textColor}/20 
                       origin-left 
                       transform scale-x-${progress/100}
                       transition-transform duration-[${duration}ms] ease-linear
                       `} />
    </div>
  );
};

interface ToastContainerProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  className?: string;
}

const ToastContainer: React.FC<ToastContainerProps> = ({
  position = 'bottom-right',
  className = ''
}) => {
  const [toasts, setToasts] = useState<Array<{
    id: string;
    title: string;
    description?: string;
    variant: 'default' | 'success' | 'warning' | 'error' | 'info';
    duration?: number;
    onClose?: () => void;
    action?: { label: string; onClick: () => void };
  }>>([]);

  const addToast = (toast: Omit<ToastProps, 'id' | 'onClose'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = {
      id,
      ...toast,
      onClose: () => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }
    };
    setToasts(prev => [...prev, newToast]);
    
    // Auto-remove after duration + buffer
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, (toast.duration || 5000) + 1000);
  };

  // Return the toast functions as a context-like value
  // In a real app, you'd use React Context for this
  // For now, we'll just render the toasts and expose a way to add them via prop or context
  
  const positionClass = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  }[position] || 'bottom-4 right-4';

  return (
    <div
      className={`${positionClass} z-50 pointer-events-none ${className}`}
      style={{ padding: '0.5rem' }}
    >
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          id={toast.id}
          title={toast.title}
          description={toast.description}
          variant={toast.variant}
          duration={toast.duration}
          onClose={toast.onClose}
          action={toast.action}
        />
      ))}
    </div>
  );
};

export { ToastContainer };
export const useToast = () => {
  // In a real implementation, this would return the addToast function from context
  // For simplicity in this example, we're returning a mock function
  // You would typically use React Context to share this state
  return () => {};
};


