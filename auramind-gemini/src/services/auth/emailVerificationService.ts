import { emailService } from '../email/emailService';
import { requireSupabase } from '../database/supabase';

/**
 * Email Verification Service
 * Handles email verification for user accounts
 */

export const emailVerificationService = {
  /**
   * Send verification email to user
   */
  sendVerificationEmail: async (email: string, name?: string) => {
    const { data, error } = await requireSupabase().auth.resend({
      email,
      type: 'signup',
    });

    if (error) throw error;

    // Also send our custom verification email
    await emailService.sendEmailVerificationEmail({
      name: name || 'User',
      email,
      verificationLink: `${window.location.origin}/auth/callback`,
    });

    return data;
  },

  /**
   * Check if email is verified
   */
  isEmailVerified: async (): Promise<boolean> => {
    const { data: { user } } = await requireSupabase().auth.getUser();
    return user?.email_confirmed_at != null;
  },
};



