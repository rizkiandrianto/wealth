"use client";

import { SessionProvider } from "next-auth/react";
import NextTopLoader from "nextjs-toploader";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { DemoGuardProvider } from "@/components/providers/DemoGuardProvider";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <QueryProvider>
        <DemoGuardProvider>
          {children}
          <NextTopLoader
            color="var(--primary)"
            height={3}
            showSpinner={false}
            shadow="0 0 10px var(--primary), 0 0 5px var(--primary)"
          />
          <Toaster richColors position="top-right" />
        </DemoGuardProvider>
      </QueryProvider>
    </SessionProvider>
  );
}
