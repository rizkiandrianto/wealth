"use client";

import { SessionProvider } from "next-auth/react";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { DemoGuardProvider } from "@/components/providers/DemoGuardProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <QueryProvider>
        <DemoGuardProvider>{children}</DemoGuardProvider>
      </QueryProvider>
    </SessionProvider>
  );
}
