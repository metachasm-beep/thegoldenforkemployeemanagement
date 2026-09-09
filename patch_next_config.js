const fs = require("fs");
let c = fs.readFileSync("next.config.ts", "utf8");
c = c.replace(
  "export default nextConfig;",
  `
import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true
});

export default withPWA(nextConfig);
`
);

// Add caching headers
c = c.replace(
  "headers() {",
  `headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
  async oldHeaders() {`
);

fs.writeFileSync("next.config.ts", c);
console.log("Patched next.config.ts");

