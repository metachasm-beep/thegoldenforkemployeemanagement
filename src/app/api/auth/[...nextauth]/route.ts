import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const getAppsScriptUrl = () => {
  return process.env.APPS_SCRIPT_URL || '';
};

const handler = NextAuth({
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
          // User sheet structure: ['ID', 'Email', 'PasswordHash', 'Role', 'EmployeeID']
          const user = users.find((u: any) => u[1] === credentials.email);
          
          if (user) {
            // For rapid dev we are checking plain text, ideally bcrypt.compare()
            if (user[2] === credentials.password) {
              return { id: user[0], email: user[1], role: user[3], employeeId: user[4] } as any;
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
});

export { handler as GET, handler as POST };
