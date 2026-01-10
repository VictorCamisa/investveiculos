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

// Prioridade dos roles - gerente é o mais alto
const ROLE_PRIORITY: Record<string, number> = {
  gerente: 3,
  marketing: 2,
  vendedor: 1,
};

async function fetchUserRole(userId: string): Promise<AppRole | null> {
  console.log('[AuthContext] Fetching role for user:', userId);
  
  try {
    // Usa função RPC que bypassa RLS
    const { data, error } = await supabase.rpc('get_my_role');
    
    console.log('[AuthContext] Role RPC result:', { data, error });
    
    if (error) {
      console.error('[AuthContext] Error fetching user role:', error);
      return null;
    }
    
    if (!data) {
      console.log('[AuthContext] No role found for user');
      return null;
    }
    
    console.log('[AuthContext] User role found:', data);
    return data as AppRole;
  } catch (err) {
    console.error('[AuthContext] Error fetching user role:', err);
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
    console.log('[AuthContext] Initializing...');

    const processSession = async (newSession: Session | null, source: string) => {
      console.log(`[AuthContext] processSession from ${source}:`, !!newSession?.user);
      const sanitized = sanitizeSession(newSession);
      
      if (!isMounted) {
        console.log('[AuthContext] Component unmounted, skipping...');
        return;
      }
      
      setSession(sanitized);
      setUser(sanitized?.user ?? null);

      if (sanitized?.user) {
        console.log('[AuthContext] User found, fetching role...');
        setRoleLoading(true);
        const userRole = await fetchUserRole(sanitized.user.id);
        console.log('[AuthContext] Role fetched:', userRole);
        if (isMounted) {
          setRole(userRole);
          setRoleLoading(false);
          setLoading(false);
          console.log('[AuthContext] State updated - roleLoading: false, loading: false');
        }
      } else {
        console.log('[AuthContext] No user, clearing state...');
        setRole(null);
        setRoleLoading(false);
        setLoading(false);
      }
    };

    // Set up the auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log('[AuthContext] onAuthStateChange event:', event);
      if ((event as unknown as string) === 'TOKEN_REFRESH_FAILED') {
        supabase.auth.signOut().catch(() => {});
        return;
      }
      
      // Use setTimeout to defer and avoid Supabase deadlock
      setTimeout(() => {
        processSession(newSession, 'onAuthStateChange');
      }, 0);
    });

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession }, error }) => {
      console.log('[AuthContext] getSession result:', !!currentSession, error);
      if (error) {
        console.error('[AuthContext] Error getting session:', error);
        if (isRefreshTokenNotFound(error)) {
          supabase.auth.signOut().catch(() => {});
        }
        if (isMounted) setLoading(false);
        return;
      }
      
      processSession(currentSession, 'getSession');
    }).catch((err) => {
      console.error('[AuthContext] getSession failed:', err);
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    // Limpar todo o cache antes do login para evitar dados de outro usuário
    queryClient.clear();
    // Limpar insights dismissados para nova sessão
    localStorage.removeItem('dismissedMarketingInsights');
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
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
    // Limpar todo o cache ao fazer logout
    queryClient.clear();
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