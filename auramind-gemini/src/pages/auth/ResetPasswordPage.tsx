import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../services/database/supabase';

export const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      alert("Please enter a valid credential (min 6 characters).");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      alert("Neural Protocol Updated Successfully. Re-authenticating...");
      navigate('/auth');
    } catch (err: any) {
      alert(err.message || "Failed to update protocol. Please ensure you clicked the latest link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-arch-bg font-black">
      <div className="architectural-panel p-12 w-full max-w-md relative z-10 space-y-10">
        <div className="text-center space-y-4">
          <h2 className="text-arch-impact text-[32px] lowercase italic">Reset Neural Protocol.</h2>
          <p className="text-arch-eyebrow">Set a new identity credential.</p>
        </div>

        <form onSubmit={handleUpdate} className="space-y-8">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="New credential"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-arch-fg/5 border border-arch-border p-5 text-xs font-medium outline-none focus:border-arch-fg transition-all text-arch-fg placeholder:text-arch-muted italic"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute inset-y-0 right-0 flex items-center justify-center px-4 text-arch-muted transition-colors hover:text-arch-fg"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <button type="submit" className="btn-arch w-full">{loading ? 'Processing...' : 'Protocol Commit'}</button>
        </form>
      </div>
    </div>
  );
};
