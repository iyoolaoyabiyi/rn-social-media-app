import { Session } from '@supabase/supabase-js';
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import { supabase } from '../lib/supabase';
import type { Profile as ProfileType } from '../types';

type AuthContextType = {
  loading: boolean;
  session: Session | null;
  profile: ProfileType | null;
  signUp: (params: {
    email: string;
    password: string;
    username: string;
    displayName?: string;
  }) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  setProfileReloadTrigger: React.Dispatch<React.SetStateAction<number>>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState<boolean>(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [profileReloadTrigger, setProfileReloadTrigger] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;

    async function loadSessionAndProfile() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!isMounted) return;
      setSession(session);

      if (session?.user) {
        await fetchProfile(session.user.id);
      }

      setLoading(false);
    }

    async function fetchProfile(userId: string) {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .eq('id', userId)
        .single();

      if (error) {
        console.log('Error fetching profile:', error.message);
        setProfile(null);
      } else {
        setProfile(data as ProfileType);
      }
    }

    loadSessionAndProfile();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!isMounted) return;

      setSession(newSession);

      if (newSession?.user) {
        await fetchProfile(newSession.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [profileReloadTrigger]);

  async function signUp({
    email,
    password,
    username,
    displayName,
  }: {
    email: string;
    password: string;
    username: string;
    displayName?: string;
  }): Promise<{ error: string | null }> {
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      return { error: 'Invalid username format.' };
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          display_name: displayName ?? null,
        },
      },
    });

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  }

  async function signIn(
    email: string,
    password: string
  ): Promise<{ error: string | null }> {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  }

  async function signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    if (error && error.status !== 403) {
      console.log('Sign out error:', error.message);
    }
    setSession(null);
    setProfile(null);
  }

  return (
    <AuthContext.Provider
      value={{
        loading,
        session,
        profile,
        signUp,
        signIn,
        signOut,
        setProfileReloadTrigger,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
