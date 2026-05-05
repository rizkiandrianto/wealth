import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import StoreInitializer from "@/components/StoreInitializer";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return (
    <>
      <StoreInitializer />
      {children}
    </>
  );
}
