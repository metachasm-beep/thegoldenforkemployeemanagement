const fs = require("fs");
let content = fs.readFileSync("src/app/api/auth/[...nextauth]/route.ts", "utf8");

if (!content.includes("CredentialsProvider")) {
  content = content.replace("import GoogleProvider", "import CredentialsProvider from \\"next-auth/providers/credentials\\";\\nimport GoogleProvider");
  
  const credentialsCode = `
    CredentialsProvider({
      name: "E2E Bypass",
      credentials: { email: { label: "Email", type: "text" } },
      async authorize(credentials) {
        if (process.env.E2E_TEST !== "1") return null;
        if (!credentials?.email) return null;
        return { id: "test-id", email: credentials.email, name: "E2E Test User" };
      }
    }),
    GoogleProvider`;
    
  content = content.replace("GoogleProvider", credentialsCode);
  
  fs.writeFileSync("src/app/api/auth/[...nextauth]/route.ts", content);
  console.log("Patched authOptions for E2E");
}

