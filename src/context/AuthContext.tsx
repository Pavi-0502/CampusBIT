import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile } from '../types';
import { DEMO_PROFILES } from '../data/initialDemoData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  currentUser: Profile | null;
  isDemoMode: boolean;
  authLoading: boolean;
  hasStudentAccess: boolean;
  passwordRecovery: boolean;
  authStatus: 'unauthenticated' | 'email_unverified' | 'pending_approval' | 'approved';
  campusDomain: string;
  campusName: string;
  allDemoProfiles: Profile[];
  switchDemoUser: (userId: string) => void;
  signInWithCampusEmail: (email: string, password: string) => Promise<{ error?: string }>;
  signUpWithCampusEmail: (details: {
    email: string;
    password: string;
    name: string;
    studentId: string;
    department: string;
    academicYear: string;
  }) => Promise<{ error?: string; needsVerification?: boolean }>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
  updatePassword: (password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (updated: Partial<Profile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const campusDomain = (import.meta.env.VITE_CAMPUS_DOMAIN || '').trim().toLowerCase().replace(/^@/, '');
  const campusName = import.meta.env.VITE_CAMPUS_NAME || 'Birla Institute of Technology';

  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authStatus, setAuthStatus] = useState<AuthContextType['authStatus']>('unauthenticated');
  const [passwordRecovery, setPasswordRecovery] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setAuthLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        void fetchSupabaseProfile(session.user.id, session.user.email_confirmed_at);
      } else {
        setAuthLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') setPasswordRecovery(true);
      if (session?.user) {
        void fetchSupabaseProfile(session.user.id, session.user.email_confirmed_at);
      } else {
        setCurrentUser(null);
        setAuthStatus('unauthenticated');
        setAuthLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchSupabaseProfile = async (userId: string, emailConfirmedAt?: string) => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (!error && data) {
        const profile = {
          ...data,
          email_verified: Boolean(emailConfirmedAt),
        } as Profile;
        setCurrentUser(profile);
        setAuthStatus(
          !profile.email_verified
            ? 'email_unverified'
            : profile.approval_status === 'approved'
            ? 'approved'
            : 'pending_approval'
        );
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setAuthLoading(false);
    }
  };

  const switchDemoUser = (_userId: string) => undefined;

  const signInWithCampusEmail = async (email: string, password: string): Promise<{ error?: string }> => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!campusDomain || !trimmedEmail.endsWith(`@${campusDomain}`)) {
      return {
        error: campusDomain
          ? `Use your approved college email ending with @${campusDomain}.`
          : 'College email configuration is missing. Please contact the administrator.',
      };
    }

    if (!supabase) return { error: 'Authentication is unavailable until Supabase is configured.' };

    const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });
    if (error) return { error: 'Unable to sign in with those credentials.' };
    if (data.user) await fetchSupabaseProfile(data.user.id, data.user.email_confirmed_at);
    return {};
  };

  const signUpWithCampusEmail = async (
    details: {
      email: string;
      password: string;
      name: string;
      studentId: string;
      department: string;
      academicYear: string;
    }
  ): Promise<{ error?: string; needsVerification?: boolean }> => {
    const trimmedEmail = details.email.trim().toLowerCase();
    if (!campusDomain || !trimmedEmail.endsWith(`@${campusDomain}`)) {
      return { error: `Registration is restricted to @${campusDomain || 'the configured college domain'}.` };
    }
    if (!supabase) return { error: 'Authentication is unavailable until Supabase is configured.' };

    const { error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password: details.password,
        options: {
          data: {
            display_name: details.name.trim(),
            student_id: details.studentId.trim(),
            department: details.department.trim(),
            academic_year: details.academicYear,
            campus_domain: campusDomain,
          },
        },
      });
    if (error) return { error: error.message.includes('already registered') ? 'An account already exists for this email.' : error.message };
    return { needsVerification: true };
  };

  const resetPassword = async (email: string): Promise<{ error?: string }> => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!campusDomain || !trimmedEmail.endsWith(`@${campusDomain}`)) {
      return { error: `Use your approved college email ending with @${campusDomain}.` };
    }
    if (!supabase) return { error: 'Authentication is unavailable until Supabase is configured.' };
    const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
      redirectTo: `${window.location.origin}/auth?mode=reset`,
    });
    return error ? { error: 'Unable to send reset instructions. Please try again.' } : {};
  };

  const updatePassword = async (password: string): Promise<{ error?: string }> => {
    if (!supabase) return { error: 'Authentication is unavailable until Supabase is configured.' };
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { error: 'Unable to update your password. Please request a new reset link.' };
    setPasswordRecovery(false);
    return {};
  };

  const signOut = async () => {
    if (supabase) await supabase.auth.signOut();
    setCurrentUser(null);
    setAuthStatus('unauthenticated');
  };

  const updateProfile = async (updated: Partial<Profile>) => {
    if (!currentUser) return;
    const allowed = {
      display_name: updated.display_name,
      department: updated.department,
      academic_year: updated.academic_year,
      hostel_block: updated.hostel_block,
      room_number: updated.room_number,
      phone_number: updated.phone_number,
      bio: updated.bio,
    };
    const merged = { ...currentUser, ...allowed };
    setCurrentUser(merged);
    if (supabase) {
      const { error } = await supabase.from('profiles').update(allowed).eq('id', currentUser.id);
      if (error) throw new Error('Unable to update your profile.');
    }
  };

  const hasStudentAccess = authStatus === 'approved';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isDemoMode: !isSupabaseConfigured,
        authLoading,
        hasStudentAccess,
        passwordRecovery,
        authStatus,
        campusDomain,
        campusName,
        allDemoProfiles: DEMO_PROFILES,
        switchDemoUser,
        signInWithCampusEmail,
        signUpWithCampusEmail,
        resetPassword,
        updatePassword,
        signOut,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
