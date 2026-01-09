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
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function sanitizeSession(session: Session | null): Session | null {
  // Safety: if tokens are missing/corrupted, treat as signed out.
  if (!session?.access_token) return null;
  return session;
}

function isRefreshTokenNotFound(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const anyErr = error as { code?: string; message?: string };
  return anyErr.code === 'refresh_token_not_found' || (anyErr.message ?? '').includes('Refresh Token Not Found');
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    let initialLoadComplete = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      // NOTE: never call supabase methods synchronously inside this callback.
      if ((event as unknown as string) === 'TOKEN_REFRESH_FAILED') {
        setTimeout(() => {
          supabase.auth.signOut().catch(() => {
            // ignore
          });
        }, 0);
      }

      const sanitized = sanitizeSession(nextSession);
      setSession(sanitized);
      setUser(sanitized?.user ?? null);

      if (sanitized?.user) {
        // Sem restrições: todos usuários têm acesso total (UI) — tratar como gerente.
        setRole('gerente');
      } else {
        setRole(null);
      }

      if (!initialLoadComplete) {
        initialLoadComplete = true;
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session: currentSession }, error }) => {
      if (error) {
        console.error('Error getting session:', error);
        if (isRefreshTokenNotFound(error)) {
          // Clear broken auth state to prevent redirect loops.
          setTimeout(() => {
            supabase.auth.signOut().catch(() => {
              // ignore
            });
          }, 0);
        }
      }

      const sanitized = sanitizeSession(currentSession ?? null);
      setSession(sanitized);
      setUser(sanitized?.user ?? null);

      if (sanitized?.user) {
        // Sem restrições: todos usuários têm acesso total (UI) — tratar como gerente.
        setRole('gerente');
      } else {
        setRole(null);
      }

      if (!initialLoadComplete) {
        initialLoadComplete = true;
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    // Invalidar cache de permissões após login para garantir dados frescos
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
    <AuthContext.Provider value={{ user, session, role, loading, signIn, signUp, signOut }}>
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
