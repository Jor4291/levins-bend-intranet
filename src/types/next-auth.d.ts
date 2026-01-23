import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      isSystemAdmin: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    isSystemAdmin?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    isSystemAdmin?: boolean;
  }
}
