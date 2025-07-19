import React, {
  useState,
  useEffect,
  createContext,
  PropsWithChildren,
  useContext,
} from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { AuthContextType, UserProfile } from "@/types/auth";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook to read the context values
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [initialized, setInitialized] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user profile from database
  const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle(); // Use maybeSingle instead of single to handle no rows

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      return data as UserProfile;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  // Create user profile after registration
  const createUserProfile = async (userId: string, userData: Partial<UserProfile>): Promise<UserProfile | null> => {
    try {
      const profileData = {
        id: userId,
        email: userData.email || '',
        username: userData.username || '',
        full_name: userData.full_name || '',
        avatar_url: userData.avatar_url || null,
        bio: userData.bio || null,
        website: userData.website || null,
        instagram: userData.instagram || null,
        twitter: userData.twitter || null,
        spotify: userData.spotify || null,
        location: userData.location || null,
        is_verified: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('user_profiles')
        .insert([profileData])
        .select()
        .single();

      if (error) {
        console.error('Error creating user profile:', error);
        return null;
      }

      return data as UserProfile;
    } catch (error) {
      console.error('Error creating user profile:', error);
      return null;
    }
  };

  // Sign in function
  const signIn = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      if (data.user) {
        const profile = await fetchUserProfile(data.user.id);
        setUserProfile(profile);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Sign up function
  const signUp = async (email: string, password: string, userData: Partial<UserProfile>) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        throw new Error(error.message);
      }

      // Store user data temporarily for profile creation after auth is complete
      if (data.user) {
        console.log('User created, profile will be created on first sign in');
        // Store userData in user_metadata so we can access it later
        await supabase.auth.updateUser({
          data: {
            full_name: userData.full_name,
            username: userData.username
          }
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during sign up';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign out function
  const signOut = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      setUserProfile(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Update profile function
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !userProfile) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        setError(error.message);
        return;
      }

      setUserProfile(data as UserProfile);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Check invitation code function
  const checkInvitationCode = async (code: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('invitation_codes')
        .select('*')
        .eq('code', code)
        .eq('is_used', false)
        .single();

      if (error || !data) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  };

  // Clear error function
  const clearError = () => {
    setError(null);
  };

  // Force clear all auth data (useful for debugging)
  const forceSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      setUserProfile(null);
      setError(null);
      setLoading(false);
    } catch (error) {
      console.error('Error in force sign out:', error);
    }
  };

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {

      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Error getting session:', error);
      } else if (session) {
        setSession(session);
        setUser(session.user);

        // Fetch user profile
        const profile = await fetchUserProfile(session.user.id);
        setUserProfile(profile);
      }

      setInitialized(true);
    };

    getInitialSession();

    // Listen for changes to authentication state
    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.id);

      setSession(session);
      setUser(session ? session.user : null);

      if (session && session.user) {
        // Check if user profile exists, if not try to fetch it
        let profile = await fetchUserProfile(session.user.id);

        // If profile doesn't exist, try to create one
        if (!profile && event === 'SIGNED_IN') {
          console.log('No profile found for user, creating profile...');
          try {
            const userData = session.user.user_metadata || {};
            const newProfile = await createUserProfile(session.user.id, {
              email: session.user.email || '',
              username: userData.username || session.user.email?.split('@')[0] || 'user',
              full_name: userData.full_name || 'Utilisateur'
            });
            profile = newProfile;
          } catch (createError: any) {
            console.error('Failed to create profile:', createError);
            // If profile creation fails due to duplicate, try to fetch existing one
            if (createError.code === '23505') {
              console.log('Profile already exists, fetching it...');
              profile = await fetchUserProfile(session.user.id);
            } else {
              console.log('Profile creation failed, signing out...');
              await supabase.auth.signOut();
              return;
            }
          }
        }

        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }

      setInitialized(true);
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  const value: AuthContextType = {
    user,
    session,
    userProfile,
    initialized,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    updateProfile,
    checkInvitationCode,
    clearError,
    forceSignOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
