const fs = require("fs");
let content = fs.readFileSync("src/app/components/DashboardLayout.tsx", "utf8");

const swLogic = `
  // Service Worker and Web Push Registration
  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      navigator.serviceWorker.register("/sw.js").then((registration) => {
        // Request permission if not denied
        if (Notification.permission !== "denied") {
          Notification.requestPermission().then((permission) => {
            if (permission === "granted") {
              // Subscribe
              registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
              }).then(subscription => {
                // Send to server
                fetch("/api/push", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(subscription)
                }).catch(console.error);
              }).catch(console.error);
            }
          });
        }
      });
    }
  }, []);
`;

content = content.replace("export default function DashboardLayout", swLogic + "\nexport default function DashboardLayout");

fs.writeFileSync("src/app/components/DashboardLayout.tsx", content);
console.log("Updated DashboardLayout.tsx with SW registration");

