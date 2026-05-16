import { DefaultSession, DefaultUser } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: { id: string; isDemo?: boolean; isOwner?: boolean } & DefaultSession["user"];
  }
  interface User extends DefaultUser {
    isDemo?: boolean;
    isOwner?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id?: string;
    isDemo?: boolean;
    isOwner?: boolean;
  }
}
