import { supabase } from '../supabaseClient';

/**
 * Authentication Service
 * Handles all auth-related operations
 * No triggers, migration-safe
 */

export const authService = {
  /* ================= AUTH ================= */

  getCurrentUser: async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return user;
    } catch (error) {
      // console.error('Error getting current user:', error);
      return null;
    }
  },

  getSession: async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return session;
    } catch (error) {
      // console.error('Error getting session:', error);
      return null;
    }
  },

  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return true;
    } catch (error) {
      // console.error('Error signing out:', error);
      return false;
    }
  },

  /* ================= PROFILE ================= */

  ensureProfileExists: async (user) => {
    if (!user) return;

    // Safe UPSERT (will NOT overwrite role)
    const { error } = await supabase.from('profiles').upsert(
      {
        id: user.id,
        email: user.email,
      },
      { onConflict: 'id' }
    );

    if (error) {
      // console.error('Ensure profile error:', error);
    }
  },

  getMyProfile: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, role')
        .eq('id', user.id)
        .single();

      if (error) {
        // console.error('Get profile error:', error);
        return null;
      }

      return data;
    } catch (err) {
      // console.error('getMyProfile failed:', err);
      return null;
    }
  },

  isAdmin: async () => {
    const profile = await authService.getMyProfile();
    return profile?.role === 'admin';
  },
};
