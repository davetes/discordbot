"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || isLoading) return;

    if (isAuthenticated) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  }, [mounted, isLoading, isAuthenticated, router]);

  // Show loading state while checking auth
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
        <div className="w-4 h-4 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
        <div className="w-4 h-4 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  );
}
