import { User, Session } from "@supabase/supabase-js";


export interface UserProfile {
  id: string;
  email: string;
  username: string;
  avatar_url?: string;
  bio?: string;
  website?: string;
  instagram?: string;
  twitter?: string;
  spotify?: string;
  location?: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
  initialized: boolean;
  loading: boolean;
  error: string | null;
}

export interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData: Partial<UserProfile>) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  checkInvitationCode: (code: string) => Promise<boolean>;
  clearError: () => void;
  forceSignOut: () => Promise<void>;
}

export interface OnboardingState {
  currentStep: number;
  totalSteps: number;
  userData: Partial<UserProfile>;
  invitationCode?: string;
}