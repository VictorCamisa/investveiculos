import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import type { AppRole } from '@/types/database';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  loading: boolean;
  roleLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function sanitizeSession(session: Session | null): Session | null {
  if (!session?.access_token) return null;
  return session;
}

function isRefreshTokenNotFound(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const anyErr = error as { code?: string; message?: string };
  return anyErr.code === 'refresh_token_not_found' || (anyErr.message ?? '').includes('Refresh Token Not Found');
}

async function fetchUserRole(userId: string): Promise<AppRole | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (error || !data) {
      if (error) console.error('Error fetching user role:', error);
      return null;
    }
    
    return data.role as AppRole;
  } catch (err) {
    console.error('Error fetching user role:', err);
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const processSession = async (newSession: Session | null) => {
      const sanitized = sanitizeSession(newSession);
      
      if (!isMounted) return;
      
      setSession(sanitized);
      setUser(sanitized?.user ?? null);

      if (sanitized?.user) {
        setRoleLoading(true);
        const userRole = await fetchUserRole(sanitized.user.id);
        if (isMounted) {
          setRole(userRole);
          setRoleLoading(false);
        }
      } else {
        setRole(null);
        setRoleLoading(false);
      }
      
      if (isMounted) {
        setLoading(false);
      }
    };

    // Set up the auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      if ((event as unknown as string) === 'TOKEN_REFRESH_FAILED') {
        supabase.auth.signOut().catch(() => {});
        return;
      }
      
      // Use setTimeout to defer and avoid Supabase deadlock
      setTimeout(() => {
        processSession(newSession);
      }, 0);
    });

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession }, error }) => {
      if (error) {
        console.error('Error getting session:', error);
        if (isRefreshTokenNotFound(error)) {
          supabase.auth.signOut().catch(() => {});
        }
        if (isMounted) setLoading(false);
        return;
      }
      
      processSession(currentSession);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (!error) {
      queryClient.invalidateQueries({ queryKey: ['my-permissions'] });
    }
    
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, role, loading, roleLoading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
