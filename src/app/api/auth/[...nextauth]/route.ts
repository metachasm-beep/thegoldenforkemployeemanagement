import NextAuth, { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";

const sha256 = (input: string) => createHash('sha256').update(input).digest('hex');

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "you@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        try {
          const user = await prisma.employee.findUnique({
            where: { email: credentials.email }
          });
          
          if (user) {
            const inputHash = sha256(credentials.password);
            if (inputHash === user.password) {
              return { 
                id: user.id, 
                email: user.email, 
                role: user.role, 
                employeeId: user.id 
              } as any;
            }
          }
          return null;
        } catch (error) {
          console.error("Auth error", error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.employeeId = (user as any).employeeId;
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
    signIn: '/login'
  }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
