
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type AuthContextType = {
  currentUser: User | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
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
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log("Auth state changed:", event, newSession?.user?.id);
        
        // Update session and user
        setSession(newSession);
        setCurrentUser(newSession?.user ?? null);
        
        // Check if user is admin
        if (newSession?.user) {
          const adminId = '95d1da8c-5e57-4886-8bdd-549e1fdf86c1';
          const isUserAdmin = newSession.user.id === adminId;
          setIsAdmin(isUserAdmin);
          
          if (event === 'SIGNED_IN') {
            // Handle successful sign-in
            setTimeout(() => {
              toast({
                title: "Logged in successfully",
                description: `Welcome${isUserAdmin ? ' Admin' : ''}!`,
              });
            }, 0);
          }
        } else {
          setIsAdmin(false);
          
          if (event === 'SIGNED_OUT') {
            // Handle sign-out
            setTimeout(() => {
              toast({
                title: "Logged out",
                description: "You've been successfully logged out",
              });
            }, 0);
          }
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
        const adminId = '95d1da8c-5e57-4886-8bdd-549e1fdf86c1';
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
      
      if (error) {
        throw error;
      }
      
      // Toast is now handled in the auth state change listener
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error?.message || "Invalid email or password",
      });
      throw error;
    } finally {
      setLoading(false);
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
    logout,
    isAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
