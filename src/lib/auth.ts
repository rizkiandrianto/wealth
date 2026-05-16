import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, accounts, sessions, verificationTokens } from "@/db/schema";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials.email as string))
          .limit(1);

        if (!user || !user.password) return null;

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          isDemo: user.isDemo ?? false,
          isOwner: user.isOwner ?? false,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const [existing] = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.email, user.email!))
          .limit(1);

        if (!existing) {
          const params = new URLSearchParams({
            name: user.name ?? "",
            email: user.email ?? "",
            from: "google",
          });
          return `/register?${params.toString()}`;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.isDemo = user.isDemo ?? false;
        token.isOwner = user.isOwner ?? false;
      }
      // Hydrate isOwner from DB when token created via OAuth (no Credentials user payload),
      // or when the flag is missing (e.g., existing JWTs from before this field shipped).
      if (token.id && token.isOwner === undefined) {
        const [row] = await db
          .select({ isOwner: users.isOwner })
          .from(users)
          .where(eq(users.id, token.id as string))
          .limit(1);
        token.isOwner = row?.isOwner ?? false;
      }
      return token;
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      session.user.isDemo = !!token.isDemo;
      session.user.isOwner = !!token.isOwner;
      return session;
    },
  },
});

export async function requireOwner() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Response("Unauthorized", { status: 401 });
  }
  const [user] = await db
    .select({ isOwner: users.isOwner })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);
  if (!user?.isOwner) {
    throw new Response("Forbidden", { status: 403 });
  }
  return session;
}
