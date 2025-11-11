import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { supabase } from '../lib/supabase';

type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};

type AuthContextType = {
  loading: boolean;
  session: import('@supabase/supabase-js').Session | null;
  profile: Profile | null;
  signUp: (params: {
    email: string;
    password: string;
    username: string;
    displayName?: string;
  }) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<import('@supabase/supabase-js').Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function init() {
      setLoading(true);

      // Get current session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!isMounted) return;

      setSession(session);

      if (session?.user) {
        await loadProfile(session.user.id, isMounted);
      }

      // Listen for auth changes
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
        if (!isMounted) return;

        setSession(newSession ?? null);

        if (newSession?.user) {
          await loadProfile(newSession.user.id, isMounted);
        } else {
          setProfile(null);
        }
      });

      setLoading(false);

      return () => {
        isMounted = false;
        subscription.unsubscribe();
      };
    }

    async function loadProfile(userId: string, stillMounted: boolean) {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .eq('id', userId)
        .single();

      if (!stillMounted) return;

      if (error) {
        console.log('Error loading profile:', error.message);
        setProfile(null);
      } else {
        setProfile(data as Profile);
      }
    }

    init();
  }, []);

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
    // Basic client-side username check
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      return { error: 'Invalid username format.' };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          display_name: displayName || null,
        },
      },
    });

    if (error) {
      return { error: error.message };
    }

    // If email confirmation is disabled, profile will be created immediately by trigger.
    // If enabled, profile appears after confirmation.
    if (data.user) {
      // Profile will be loaded by the listener.
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
    await supabase.auth.signOut();
    setProfile(null);
  }

  return (
    <AuthContext.Provider
      value={{ loading, session, profile, signUp, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
