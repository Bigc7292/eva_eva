'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/services/supabase'
import { MockAuth } from '@/lib/mock-auth'
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js'

// Development mode flag
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';
const USE_MOCK_AUTH = IS_DEVELOPMENT && (typeof window !== 'undefined' && window.location.hostname === 'localhost');

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<any>
  signUp: (email: string, password: string, userData?: any) => Promise<any>
  signOut: () => Promise<any>
  resetPassword: (email: string) => Promise<any>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  // No need to create supabase client as it's imported

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        if (USE_MOCK_AUTH) {
          const { data } = MockAuth.getSession();
          setSession(data.session as any);
          setUser(data.session?.user ?? null);
          setLoading(false);
          return;
        }
        
        const { data: { session } } = await supabase.auth.getSession()
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      } catch (error) {
        // Fallback to mock auth if Supabase fails
        if (IS_DEVELOPMENT) {
          const { data } = MockAuth.getSession();
          setSession(data.session as any);
          setUser(data.session?.user ?? null);
        }
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    if (USE_MOCK_AUTH) {
      // Mock auth state change listener
      const mockSubscription = MockAuth.onAuthStateChange((event: string, session: any) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      });
      
      return () => mockSubscription.data.subscription.unsubscribe();
    } else {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)

        // Handle user profile creation/update
        if (event === 'SIGNED_IN' && session?.user) {
          await createOrUpdateUserProfile(session.user)
        }
      })

      return () => subscription.unsubscribe()
    }
  }, [])

  const createOrUpdateUserProfile = async (user: User) => {
    try {
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (!existingProfile) {
        // Create new user profile
        const { error } = await supabase
          .from('user_profiles')
          .insert({
            user_id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || '',
            avatar_url: user.user_metadata?.avatar_url || '',
            role: 'agent', // Default role
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (error) {
          console.error('Error creating user profile:', error)
        }
      } else {
        // Update existing profile
        const { error } = await supabase
          .from('user_profiles')
          .update({
            email: user.email,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)

        if (error) {
          console.error('Error updating user profile:', error)
        }
      }
    } catch (error) {
      console.error('Error handling user profile:', error)
    }
  }

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    try {
      // Use mock auth in development when Supabase is not accessible
      if (USE_MOCK_AUTH) {
        console.log('🔧 Using mock authentication for development');
        const result = await MockAuth.signInWithPassword(email, password);
        
        if (result.error) throw new Error(result.error.message);
        
        // Update state with mock data
        setSession(result.data.session as any);
        setUser(result.data.user as any);
        
        return { data: result.data, error: null };
      }
      
      // Regular Supabase auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) throw error
      return { data, error: null }
    } catch (error: any) {
      // If Supabase fails in development, fallback to mock auth
      if (IS_DEVELOPMENT && (error.message.includes('fetch') || error.message.includes('network'))) {
        console.log('🔄 Supabase failed, falling back to mock auth');
        const result = await MockAuth.signInWithPassword(email, password);
        
        if (result.error) throw new Error(result.error.message);
        
        setSession(result.data.session as any);
        setUser(result.data.user as any);
        
        return { data: result.data, error: null };
      }
      
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, userData?: any) => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      })
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setLoading(true)
    try {
      if (USE_MOCK_AUTH) {
        await MockAuth.signOut();
        setSession(null);
        setUser(null);
        return { error: null };
      }
      
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      return { error: null }
    } catch (error) {
      return { error }
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })
      
      if (error) throw error
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}