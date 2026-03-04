import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";
import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

type AdminRole = "super_admin" | "regular_admin";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/admin/login",
  },
  providers: [
    CredentialsProvider({
      name: "Admin Login",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const username =
          typeof credentials?.username === "string"
            ? credentials.username.trim()
            : "";
        const password =
          typeof credentials?.password === "string" ? credentials.password : "";

        if (username.length === 0 || password.length === 0) {
          return null;
        }

        const convexUrl =
          process.env.NEXT_PUBLIC_CONVEX_URL ??
          process.env.CONVEX_URL ??
          process.env.NEXT_CONVEX_URL;
        if (!convexUrl) {
          return null;
        }

        try {
          const client = new ConvexHttpClient(
            convexUrl.trim().replace(/\/+$/, ""),
            { logger: false }
          );
          const result = await client.action(
            makeFunctionReference<"action">("adminAuth:validateAdminCredentials"),
            {
              username,
              password,
            }
          );

          if (!result.success || !result.username || !result.role) {
            return null;
          }

          return {
            id: result.username,
            name: result.username,
            username: result.username,
            role: result.role,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.username = user.username;
        token.role = user.role as AdminRole;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.username && token.role) {
        session.user.username = token.username;
        session.user.role = token.role as AdminRole;
        session.user.name = token.username;
      }
      return session;
    },
  },
};

export function getServerAuthSession() {
  return getServerSession(authOptions);
}
