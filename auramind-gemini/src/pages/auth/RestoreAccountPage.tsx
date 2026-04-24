import React, { useState, useEffect } from 'react';
import { AlertTriangle, Check, Mail, Loader2 } from 'lucide-react';

export const RestoreAccountPage = ({ navigate }: any) => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const uid = params.get('uid');

    if (!token || !uid) {
      setStatus('error');
      setMessage('Invalid or missing restore link. Please check the link from your email.');
    }
  }, []);

  const handleRestore = async () => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const uid = params.get('uid');

    if (!token || !uid) {
      setStatus('error');
      setMessage('Invalid restore link.');
      return;
    }

    setStatus('loading');
    setMessage('Restoring your account...');

    try {
      const res = await fetch('/api/restore-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, uid }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Restoration failed.');
      }

      setStatus('success');
      setMessage(data.message || 'Account restored! You can sign in now.');
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || 'Something went wrong.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-arch-bg font-black">
      <div className="architectural-panel p-12 w-full max-w-md relative z-10 space-y-8 text-center">
        {status === 'idle' && (
          <>
            <div className="w-16 h-16 mx-auto border-2 border-amber-500 flex items-center justify-center">
              <AlertTriangle size={28} className="text-amber-400" />
            </div>
            <h2 className="text-arch-impact text-[28px] lowercase italic">Restore Account.</h2>
            <p className="text-arch-muted text-xs uppercase tracking-widest italic leading-relaxed max-w-sm mx-auto">
              Click the button below to reactivate your AuraMind account and recover all your data.
            </p>
            <button onClick={handleRestore} className="btn-arch w-full">
              Restore My Account
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full text-center text-xs font-black uppercase tracking-widest text-arch-muted hover:text-arch-fg transition-colors"
            >
              No thanks, take me home
            </button>
          </>
        )}

        {status === 'loading' && (
          <div className="py-10 space-y-6">
            <Loader2 size={36} className="mx-auto animate-spin text-arch-muted" />
            <p className="text-xs text-arch-muted uppercase tracking-widest italic">{message}</p>
          </div>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 mx-auto border-2 border-emerald-500 flex items-center justify-center">
              <Check size={28} className="text-emerald-400" />
            </div>
            <h2 className="text-arch-impact text-[28px] lowercase italic text-emerald-400">Restored.</h2>
            <p className="text-arch-muted text-xs uppercase tracking-widest italic leading-relaxed max-w-sm mx-auto">
              {message}
            </p>
            <button onClick={() => navigate('/auth')} className="btn-arch w-full">
              Sign In Now
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 mx-auto border-2 border-red-500 flex items-center justify-center">
              <AlertTriangle size={28} className="text-red-400" />
            </div>
            <h2 className="text-arch-impact text-[28px] lowercase italic text-red-400">Error.</h2>
            <p className="text-arch-muted text-xs uppercase tracking-widest italic leading-relaxed max-w-sm mx-auto">
              {message}
            </p>
            <button onClick={() => navigate('/')} className="btn-arch w-full">
              Return Home
            </button>
          </>
        )}
      </div>
    </div>
  );
};
