import NextAuth, { type DefaultSession, type NextAuthResult } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { SEEDED_READER_MEMBERS } from "./app/lib/reader-seed-data";

/**
 * Auth.js v5 compatibility for historical server Route Handlers.
 *
 * The production app now keeps the reader experience pure client-side
 * with MSW + Dexie, so this file must not instantiate a Prisma adapter
 * or require Postgres. The credentials provider authenticates against
 * the seeded browser-demo members only, which is sufficient for any
 * local/server utility path that still calls `auth()`.
 */
export type SessionRole =
  | "reader"
  | "editor"
  | "publisher"
  | "admin"
  | "customer_service";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: SessionRole;
    } & DefaultSession["user"];
  }

  interface User {
    role?: SessionRole;
  }
}

const DEMO_USERS = SEEDED_READER_MEMBERS.map((member) => ({
  id: member.id,
  email: member.email,
  name: member.name,
  image: null,
  role: "reader" as const,
}));

const result: NextAuthResult = NextAuth({
  session: { strategy: "jwt" },
  trustHost: true,
  providers: [
    Credentials({
      id: "credentials",
      name: "Verda demo sign-in",
      credentials: {
        email: { label: "Email", type: "email" },
      },
      authorize(credentials) {
        const raw = credentials?.email;
        if (typeof raw !== "string") {
          return null;
        }
        const email = raw.trim().toLowerCase();
        if (!email) {
          return null;
        }
        return DEMO_USERS.find((user) => user.email === email) ?? null;
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        if (user.role) {
          (token as { role?: SessionRole }).role = user.role;
        }
      }
      return token;
    },
    session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
      }
      session.user.role = (token as { role?: SessionRole }).role ?? "reader";
      return session;
    },
  },
});

export const handlers: NextAuthResult["handlers"] = result.handlers;
export const auth: NextAuthResult["auth"] = result.auth;
export const signIn: NextAuthResult["signIn"] = result.signIn;
export const signOut: NextAuthResult["signOut"] = result.signOut;
