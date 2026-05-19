"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl glass-card flex items-center justify-center">
          <span className="text-3xl">🎓</span>
        </div>
        <p className="text-slate-400">Loading Academic AI...</p>
      </div>
    </div>
  );
}
