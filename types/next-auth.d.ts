import { DefaultSession } from "next-auth";

type AdminRole = "super_admin" | "regular_admin";

declare module "next-auth" {
  interface User {
    username: string;
    role: AdminRole;
  }

  interface Session {
    user: DefaultSession["user"] & {
      username: string;
      role: AdminRole;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    username?: string;
    role?: AdminRole;
  }
}
