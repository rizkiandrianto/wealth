"use client";

import { SessionProvider } from "next-auth/react";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { DemoGuardProvider } from "@/components/providers/DemoGuardProvider";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <QueryProvider>
        <DemoGuardProvider>
          {children}
          <Toaster richColors position="top-right" />
        </DemoGuardProvider>
      </QueryProvider>
    </SessionProvider>
  );
}
