import { supabase } from '../database/supabase';
import { UserProfile, UserRole } from '../../types';

export const userService = {
  async getCurrentUser(): Promise<UserProfile | null> {
    if (!supabase) {
      console.warn('Supabase not initialized');
      return null;
    }

    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return null;
    }

    // Fetch user profile from database
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      // Create default profile if it doesn't exist
      const { data: newProfile, error: createError } = await supabase
        .from('user_profiles')
        .insert({
          id: user.id,
          email: user.email || '',
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          role: UserRole.USER,
          plan: 'Starter',
          streak: 0,
          joined_date: Date.now(),
          isEmailVerified: user.email_confirmed_at ? true : false,
          isPhoneVerified: false
        })
        .select('*')
        .single();

      if (createError || !newProfile) {
        console.error('Error creating user profile:', createError);
        return null;
      }

      return {
        id: newProfile.id,
        email: newProfile.email,
        name: newProfile.name,
        plan: newProfile.plan,
        streak: newProfile.streak,
        joinedDate: newProfile.joined_date,
        role: newProfile.role,
        isEmailVerified: newProfile.isEmailVerified,
        isPhoneVerified: newProfile.isPhoneVerified,
        streakFreezes: newProfile.streak_freezes || 0
      };
    }

    return {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      plan: profile.plan,
      streak: profile.streak,
      joinedDate: profile.joined_date,
      role: profile.role,
      isEmailVerified: profile.isEmailVerified,
      isPhoneVerified: profile.isPhoneVerified,
      streakFreezes: profile.streak_freezes || 0
    };
  },

  async updateUserProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    if (!supabase) {
      throw new Error('Supabase not initialized');
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', updates.id)
      .select('*')
      .single();

    if (error || !data) {
      throw new Error('Failed to update user profile');
    }

    return data;
  },

  async getAllUsers(): Promise<UserProfile[]> {
    if (!supabase) {
      console.warn('Supabase not initialized');
      return [];
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('joined_date', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      throw error;
    }

    return data || [];
  },

  async toggleUserRole(userId: string, newRole: UserRole): Promise<boolean> {
    if (!supabase) {
      throw new Error('Supabase not initialized');
    }

    const { error } = await supabase
      .from('user_profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) {
      console.error('Error updating user role:', error);
      return false;
    }

    return true;
  }
};



