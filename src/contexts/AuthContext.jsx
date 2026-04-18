import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const fetchProfile = async (sessionUser) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', sessionUser.id)
        .maybeSingle()

      if (data) {
        setProfile(data)
        return data
      }

      // Fallback for new mock users: respect the role given in sign in
      const dummy = { 
        user_id: sessionUser.id, 
        full_name: sessionUser.user_metadata?.full_name || 'Mock User', 
        role: sessionUser.user_metadata?.role || 'receptionist' 
      }
      setProfile(dummy)
      return dummy
    } catch (err) {
      console.error('Mock profile error:', err)
      return null
    }
  }

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
          setUser(session?.user ?? null);
          if (session?.user) {
            await fetchProfile(session.user);
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    )

    return () => {
      mounted = false;
      subscription.unsubscribe();
    }
  }, [])

  const signIn = async (email, password) => {
    setError(null)
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      return data
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setError(null)
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  const getDashboardPath = (role) => {
    const paths = {
      admin:         '/dashboard/admin',
      doctor:        '/dashboard/doctor',
      nurse:         '/dashboard/nurse',
      receptionist:  '/dashboard/receptionist',
      pharmacy:      '/dashboard/pharmacy',
      laboratory:    '/dashboard/laboratory',
      accounts:      '/dashboard/accounts',
      staff:         '/dashboard/receptionist',
    }
    return paths[role] || '/unauthorized'
  }

  const value = {
    user,
    profile,
    loading,
    error,
    signIn,
    signOut,
    getDashboardPath,
    isAdmin:       profile?.role === 'admin',
    role:          profile?.role,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
