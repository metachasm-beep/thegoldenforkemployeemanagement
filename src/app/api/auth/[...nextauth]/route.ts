import NextAuth, { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";

export const authOptions: AuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || "fallback_secret_do_not_use_in_real_production",
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    })
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      try {
        const dbUser = await prisma.employee.findFirst({
          where: { 
            email: { equals: user.email, mode: 'insensitive' } 
          }
        });
        if (!dbUser) return '/login?error=AccessDenied';
        return true;
      } catch (error) {
        console.error("Database connection error in signIn:", error);
        return '/login?error=DatabaseError';
      }
    },
    async jwt({ token, user }) {
      if (token.email) {
        try {
          const dbUser = await prisma.employee.findFirst({
            where: { 
              email: { equals: token.email, mode: 'insensitive' } 
            }
          });
          if (dbUser) {
            token.role = dbUser.role;
            token.employeeId = dbUser.id;
          }
        } catch (error) {
          console.error("Database connection error in jwt:", error);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).employeeId = token.employeeId;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
    error: '/login'
  },
  debug: true
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
