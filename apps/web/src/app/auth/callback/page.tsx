'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";

import { MagicEdit } from "pixelarticons/react";

export default function AuthCallback() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      // Redirect to homepage once session is loaded
      router.push("/");
    }
  }, [loading, user, router]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-foreground">
      <div className="bg-background border-4 border-foreground p-8 max-w-md w-full text-center neo-shadow">
        <div className="flex justify-center mb-4 text-foreground">
          <MagicEdit className="w-12 h-12 animate-sketch" />
        </div>
        <h1 className="font-display text-2xl mb-2 tracking-wide uppercase">
          INKING IDENTITY...
        </h1>
        <p className="font-mono text-sm text-neutral">
          Stabilizing ink flow. Authenticating mangaka.
        </p>
      </div>
    </div>
  );
}
