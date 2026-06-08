import { emailService } from '../email/emailService';
import { supabase } from '../database/supabase';

/**
 * Trial Tracking Service
 * Monitors trial periods and sends reminder emails
 */

export interface TrialUser {
  id: string;
  email: string;
  full_name: string;
  trial_start: string;
  trial_end: string;
}

export const trialService = {
  /**
   * Get all users with active trials
   */
  getActiveTrialUsers: async (): Promise<TrialUser[]> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, trial_start, trial_end')
      .gte('trial_end', new Date().toISOString())
      .order('trial_end', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Check and send trial ending reminders
   * Should be called daily by a cron job
   */
  checkTrialReminders: async () => {
    const users = await trialService.getActiveTrialUsers();
    const now = new Date();
    const reminders = [7, 3, 1]; // Days before trial ends to send reminder

    for (const user of users) {
      const trialEnd = new Date(user.trial_end);
      const daysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (reminders.includes(daysRemaining)) {
        await emailService.sendTrialEndingEmail({
          name: user.full_name || 'User',
          email: user.email,
          trialEnds: trialEnd.toLocaleDateString(),
          daysRemaining,
        });
        // Trial reminder sent
      }
    }
  },

  /**
   * Start a trial for a new user
   */
  startTrial: async (userId: string): Promise<void> => {
    const trialStart = new Date();
    const trialEnd = new Date(trialStart.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days

    const { error } = await supabase
      .from('profiles')
      .update({
        trial_start: trialStart.toISOString(),
        trial_end: trialEnd.toISOString(),
      })
      .eq('id', userId);

    if (error) throw error;
  },

  /**
   * Check if trial has ended
   */
  isTrialEnded: async (userId: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('trial_end')
      .eq('id', userId)
      .single();

    if (error) throw error;
    if (!data?.trial_end) return true;

    return new Date(data.trial_end) < new Date();
  },
};



