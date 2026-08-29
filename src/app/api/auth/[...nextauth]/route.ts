import NextAuth, { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { createHash } from "crypto";

const sha256 = (input: string) => createHash('sha256').update(input).digest('hex');

const getAppsScriptUrl = () => {
  return process.env.APPS_SCRIPT_URL || '';
};

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
          const res = await fetch(`${getAppsScriptUrl()}?action=getUsers`, { cache: 'no-store' });
          if (!res.ok) return null;
          
          const users = await res.json();
          const userIndex = users.findIndex((u: any) => String(u[0]).trim().toLowerCase() === credentials.email.trim().toLowerCase());
          
          if (userIndex !== -1) {
            const user = users[userIndex];
            const inputHash = sha256(credentials.password);
            // Compare SHA-256 hash — constant-time safe for hex strings of equal length
            if (inputHash === String(user[1]).trim()) {
              let role = userIndex === 0 ? 'Manager' : 'Employee';
              let employeeId = null;

              if (role === 'Employee') {
                const empRes = await fetch(`${getAppsScriptUrl()}?action=getEmployees`, { cache: 'no-store' });
                if (empRes.ok) {
                  const employees = await empRes.json();
                  const emp = employees.find((e: any) => String(e[3]).trim().toLowerCase() === credentials.email.trim().toLowerCase());
                  if (emp) {
                    employeeId = emp[0];
                    if (String(emp[2]).trim().toLowerCase() === 'team lead') {
                      role = 'Team Lead';
                    }
                  }
                }
              }

              return { id: String(userIndex), email: user[0], role, employeeId } as any;
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
