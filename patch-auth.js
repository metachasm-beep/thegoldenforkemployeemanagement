const fs = require('fs');

const authPath = 'src/app/api/auth/[...nextauth]/route.ts';
let authContent = fs.readFileSync(authPath, 'utf8');

if (!authContent.includes('CredentialsProvider')) {
  authContent = authContent.replace(
    'import GoogleProvider from "next-auth/providers/google";',
    'import GoogleProvider from "next-auth/providers/google";\nimport CredentialsProvider from "next-auth/providers/credentials";'
  );

  const creds = `
    CredentialsProvider({
      id: "e2e",
      name: "E2E Test",
      credentials: {},
      async authorize() {
        if (process.env.NODE_ENV === "production") return null;
        let emp = await prisma.employee.findFirst({ where: { email: "e2e-invoice@example.com" } });
        if (!emp) {
          emp = await prisma.employee.create({
            data: {
              name: "E2E Invoice User",
              email: "e2e-invoice@example.com",
              role: "Sales Executive",
              startDate: "2026-09-01",
              baseSalary: 15000,
              commissionRate: 5000,
              target: 5,
              probationDuration: 0,
              isProbation: false,
              failedMonths: 0,
              penalty: 0,
              sessionVersion: 1
            }
          });
        }
        return { id: emp.id, email: emp.email, name: emp.name, role: emp.role };
      }
    }),
  `;
  
  authContent = authContent.replace('providers: [', 'providers: [\n' + creds);
  fs.writeFileSync(authPath, authContent);
  console.log('Patched NextAuth');
}

const loginPath = 'src/app/login/page.tsx';
let loginContent = fs.readFileSync(loginPath, 'utf8');

if (!loginContent.includes('E2E Test Login')) {
  loginContent = loginContent.replace(
    '</button>',
    '</button>\n      {process.env.NODE_ENV !== "production" && (<button onClick={() => signIn("e2e", { callbackUrl: "/" })} className="w-full mt-2 flex items-center justify-center gap-3 bg-red-100 text-red-700 font-medium py-3 px-4 rounded-lg">E2E Test Login</button>)}'
  );
  fs.writeFileSync(loginPath, loginContent);
  console.log('Patched Login UI');
}
