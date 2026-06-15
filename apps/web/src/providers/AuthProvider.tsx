'use client';

import React, { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

import { DeleteSharp } from "pixelarticons/react";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
  };

  const logout = async () => {
    setLoggingOut(true);
    try {
      // 1 second delay to let the user see the cool cleaning workspace transition modal
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, login, logout }}>
      {children}
      
      {/* Full-screen Cartoonish Logout Loading Modal */}
      {loggingOut && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-6 text-foreground">
          <div className="bg-background border-4 border-foreground p-8 max-w-sm w-full text-center neo-shadow">
            <div className="flex justify-center mb-4 text-foreground">
              <DeleteSharp className="w-12 h-12 animate-sketch" />
            </div>
            <h1 className="font-display text-2xl mb-2 tracking-wide uppercase">
              CLEANING WORKSPACE...
            </h1>
            <p className="font-mono text-sm text-neutral">
              Erasing guidelines. Clearing temporary canvas.
            </p>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
