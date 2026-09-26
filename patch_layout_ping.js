const fs = require("fs");
let content = fs.readFileSync("src/app/components/DashboardLayout.tsx", "utf8");

const pingLogic = `
  // Presence Ping
  useEffect(() => {
    if (!session) return;
    const ping = () => {
      fetch("/api/presence", { method: "POST" }).catch(() => {});
    };
    ping(); // initial ping
    const interval = setInterval(ping, 60000); // ping every 60s
    return () => clearInterval(interval);
  }, [session]);
`;

content = content.replace(
  "  // Service Worker and Web Push Registration",
  pingLogic + "\\n  // Service Worker and Web Push Registration"
);

fs.writeFileSync("src/app/components/DashboardLayout.tsx", content);
console.log("Added presence ping to DashboardLayout");

