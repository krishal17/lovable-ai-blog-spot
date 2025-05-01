import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type AuthContextType = {
  currentUser: User | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithGithub: () => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setCurrentUser(session?.user ?? null);

        if (session?.user) {
          const adminId = '32c9460c-ce5b-4143-b6e2-31edde1f0326';
          setIsAdmin(session.user.id === adminId);
        } else {
          setIsAdmin(false);
        }

        if (event === 'SIGNED_IN') {
          toast({
            title: "Welcome back! 👋",
            description: `Logged in as ${session?.user?.user_metadata?.full_name || session?.user?.email}`,
            className: "bg-gradient-to-r from-purple-500 to-pink-500 text-white",
          });
        } else if (event === 'SIGNED_OUT') {
          toast({
            title: "See you soon! 👋",
            description: "You've been successfully logged out",
            className: "bg-gradient-to-r from-blue-500 to-teal-500 text-white",
          });
        } else if (event === 'USER_UPDATED') {
          toast({
            title: "Profile updated! ✨",
            description: "Your profile has been successfully updated",
            className: "bg-gradient-to-r from-green-500 to-emerald-500 text-white",
          });
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      console.log("Got existing session:", currentSession?.user?.id);
      setSession(currentSession);
      setCurrentUser(currentSession?.user ?? null);

      // Check if user is admin
      if (currentSession?.user) {
        const adminId = '32c9460c-ce5b-4143-b6e2-31edde1f0326';
        setIsAdmin(currentSession.user.id === adminId);
      } else {
        setIsAdmin(false);
      }

      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [toast]);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        variant: "destructive",
        title: "Oops! Login failed 😔",
        description: error?.message || "Invalid email or password",
        className: "bg-gradient-to-r from-red-500 to-rose-500 text-white",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      toast({
        title: "Almost there! ✨",
        description: "Please check your email to verify your account",
        className: "bg-gradient-to-r from-purple-500 to-indigo-500 text-white",
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        variant: "destructive",
        title: "Registration failed 😔",
        description: error?.message || "Failed to create account",
        className: "bg-gradient-to-r from-red-500 to-rose-500 text-white",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to sign in with Google. Please try again.",
        className: "bg-gradient-to-r from-red-500 to-rose-500 text-white",
      });
    }
  };

  const loginWithGithub = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: 'read:user user:email',
        },
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error signing in with GitHub:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to sign in with GitHub. Please try again.",
        className: "bg-gradient-to-r from-red-500 to-rose-500 text-white",
      });
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      // Toast is now handled in the auth state change listener
    } catch (error: any) {
      console.error("Logout error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to log out. Please try again.",
      });
      throw error;
    }
  };

  const value = {
    currentUser,
    session,
    loading,
    login,
    register,
    loginWithGoogle,
    loginWithGithub,
    logout,
    isAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
