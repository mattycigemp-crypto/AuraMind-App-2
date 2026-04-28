import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/database/supabase';

const CallbackPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Auth callback error:', error);
        navigate('/auth');
        return;
      }

      if (data.session) {
        navigate('/dashboard');
      } else {
        navigate('/auth');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-arch-bg flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 border-4 border-white/10 border-t-arch-fg rounded-full animate-spin mx-auto" />
        <h1 className="text-2xl font-bold text-white">Verifying your email...</h1>
        <p className="text-arch-muted">Please wait while we confirm your account.</p>
      </div>
    </div>
  );
};

export default CallbackPage;