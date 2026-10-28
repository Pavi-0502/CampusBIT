import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile } from '../types';
import { DEMO_PROFILES } from '../data/initialDemoData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  currentUser: Profile | null;
  isDemoMode: boolean;
  campusDomain: string;
  campusName: string;
  allDemoProfiles: Profile[];
  switchDemoUser: (userId: string) => void;
  signInWithCampusEmail: (email: string, password?: string) => Promise<{ error?: string }>;
  signUpWithCampusEmail: (email: string, password: string, name: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (updated: Partial<Profile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const campusDomain = import.meta.env.VITE_CAMPUS_DOMAIN || 'bit.edu';
  const campusName = import.meta.env.VITE_CAMPUS_NAME || 'Birla Institute of Technology';

  // Default to Demo user Aarav (Seller) or Priya (Buyer)
  const [currentUser, setCurrentUser] = useState<Profile | null>(DEMO_PROFILES[0]);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(!isSupabaseConfigured);

  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      // Check active Supabase session
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          fetchSupabaseProfile(session.user.id);
        } else {
          // If no session on real Supabase, default to demo mode or null
          setIsDemoMode(true);
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          fetchSupabaseProfile(session.user.id);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const fetchSupabaseProfile = async (userId: string) => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (!error && data) {
        setCurrentUser(data);
        setIsDemoMode(false);
      }
    } catch (err) {
      console.warn('Failed to fetch profile:', err);
    }
  };

  const switchDemoUser = (userId: string) => {
    const profile = DEMO_PROFILES.find((p) => p.id === userId);
    if (profile) {
      setCurrentUser(profile);
    }
  };

  const signInWithCampusEmail = async (email: string, password?: string): Promise<{ error?: string }> => {
    const trimmedEmail = email.trim().toLowerCase();
    
    // Validate campus email domain
    if (!trimmedEmail.endsWith(`@${campusDomain}`)) {
      return {
        error: `Only verified campus emails ending with @${campusDomain} are authorized.`,
      };
    }

    if (isSupabaseConfigured && supabase && password) {
      const { error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });
      if (error) return { error: error.message };
      return {};
    }

    // Demo Mode Sign In: find or create profile
    let demoUser = DEMO_PROFILES.find((p) => p.campus_domain === campusDomain);
    if (!demoUser) {
      demoUser = DEMO_PROFILES[0];
    }
    setCurrentUser(demoUser);
    setIsDemoMode(true);
    return {};
  };

  const signUpWithCampusEmail = async (
    email: string,
    password: string,
    name: string
  ): Promise<{ error?: string }> => {
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail.endsWith(`@${campusDomain}`)) {
      return {
        error: `Sign up restricted to verified campus domain: @${campusDomain}`,
      };
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: {
            display_name: name,
            campus_domain: campusDomain,
          },
        },
      });
      if (error) return { error: error.message };
      return {};
    }

    // Demo Mode Sign Up
    const newDemoUser: Profile = {
      id: `user-${Date.now()}`,
      display_name: name,
      pseudonym: `${name.split(' ')[0]} (Verified Student)`,
      campus_domain: campusDomain,
      rating: 5.0,
      total_sales: 0,
      total_purchases: 0,
      created_at: new Date().toISOString(),
    };
    setCurrentUser(newDemoUser);
    return {};
  };

  const signOut = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    // Set to null or first demo user
    setCurrentUser(null);
  };

  const updateProfile = async (updated: Partial<Profile>) => {
    if (!currentUser) return;
    const merged = { ...currentUser, ...updated };
    setCurrentUser(merged);

    if (isSupabaseConfigured && supabase) {
      await supabase
        .from('profiles')
        .update(updated)
        .eq('id', currentUser.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isDemoMode,
        campusDomain,
        campusName,
        allDemoProfiles: DEMO_PROFILES,
        switchDemoUser,
        signInWithCampusEmail,
        signUpWithCampusEmail,
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
