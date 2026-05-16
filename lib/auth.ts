import { getServerSession, type NextAuthOptions, type Session } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { isAdminRole } from "./auth-helpers";

export type AdminSession = Session & {
  user: NonNullable<Session["user"]> & {
    role: "admin";
  };
};

function getAdminCredentials() {
  return {
    email: process.env.ADMIN_EMAIL ?? "",
    password: process.env.ADMIN_PASSWORD ?? "",
  };
}

export const authOptions: NextAuthOptions = {
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "管理员账号",
      credentials: {
        email: { label: "邮箱", type: "email" },
        password: { label: "密码", type: "password" },
      },
      async authorize(credentials) {
        const configured = getAdminCredentials();
        const email = credentials?.email?.trim();
        const password = credentials?.password ?? "";

        if (
          configured.email.length > 0 &&
          configured.password.length > 0 &&
          email === configured.email &&
          password === configured.password
        ) {
          return {
            id: "admin",
            email,
            name: "管理员",
            role: "admin",
          };
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { role?: string }).role =
          typeof token.role === "string" ? token.role : "member";
      }

      return session;
    },
  },
  secret: process.env.AUTH_SECRET,
  session: {
    strategy: "jwt",
  },
};

export async function getAdminSession(): Promise<AdminSession | null> {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (session && role && isAdminRole(role)) {
    return session as AdminSession;
  }

  return null;
}
