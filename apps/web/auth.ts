import { PrismaAdapter } from "@auth/prisma-adapter";
import { type $Enums, prisma } from "@verda/database";
import NextAuth, { type DefaultSession, type NextAuthResult } from "next-auth";
import Credentials from "next-auth/providers/credentials";

/**
 * Auth.js v5 configuration for the verda backend (issue #127).
 *
 * Strategy:
 *
 * - **Prisma adapter** persists `User` / `Account` / `Session` /
 *   `VerificationToken` rows so OAuth + email-magic-link providers
 *   (a future slice) just work without rewiring storage.
 * - **JWT sessions** (`session.strategy: "jwt"`) keep the public
 *   reader path off the per-request DB read; the role lives on the
 *   token rather than a `Session` row.
 * - **Credentials provider** is the single sign-in surface today.
 *   It accepts an email-only payload and authenticates against the
 *   `User` table — sufficient for the seeded reader/staff users
 *   while a real email-magic-link or OAuth flow lands in #127's
 *   follow-on. No password is required because the seeded users
 *   exist exclusively to drive the demo / the Playwright smoke and
 *   because the public reader UI didn't have a password field
 *   before this slice either.
 *
 * The `jwt` callback ports `id` and `role` onto the token at sign-in
 * time, and `session` projects them back onto `session.user` so
 * `auth()` in Route Handlers and `useSession()` in components both
 * see the same shape. This is what the issue calls out as
 * "session/token carries the user's role".
 */

export type SessionRole = $Enums.Role;

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

const adapter = PrismaAdapter(prisma) as ReturnType<typeof PrismaAdapter>;

const result: NextAuthResult = NextAuth({
  adapter,
  session: { strategy: "jwt" },
  // The repo doesn't ship a custom sign-in page yet; sign-in is
  // triggered programmatically from `useAuth().login()` so the
  // default `/api/auth/signin` UI is fine — it stays out of the
  // happy-path UX.
  trustHost: true,
  providers: [
    Credentials({
      id: "credentials",
      name: "Verda demo sign-in",
      credentials: {
        email: { label: "Email", type: "email" },
      },
      async authorize(credentials) {
        const raw = credentials?.email;
        if (typeof raw !== "string") {
          return null;
        }
        const email = raw.trim().toLowerCase();
        if (!email) {
          return null;
        }
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          return null;
        }
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
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
      const role = (token as { role?: SessionRole }).role;
      if (role) {
        session.user.role = role;
      }
      return session;
    },
  },
});

export const handlers: NextAuthResult["handlers"] = result.handlers;
export const auth: NextAuthResult["auth"] = result.auth;
export const signIn: NextAuthResult["signIn"] = result.signIn;
export const signOut: NextAuthResult["signOut"] = result.signOut;
