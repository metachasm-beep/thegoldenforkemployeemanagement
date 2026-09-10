const fs = require("fs");
let content = fs.readFileSync("src/app/components/DashboardLayout.tsx", "utf8");

// Remove the wrongly placed useEffect
content = content.replace(/\/\/ Service Worker and Web Push Registration[\s\S]*?\}, \[\]\);\n/, "");

// Put it inside the component
const swLogic = `
  // Service Worker and Web Push Registration
  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      navigator.serviceWorker.register("/sw.js").then((registration) => {
        if (Notification.permission !== "denied") {
          Notification.requestPermission().then((permission) => {
            if (permission === "granted") {
              registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
              }).then(subscription => {
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

content = content.replace("const { data: session } = useSession();", "const { data: session } = useSession();\n" + swLogic);

fs.writeFileSync("src/app/components/DashboardLayout.tsx", content);
console.log("Fixed DashboardLayout.tsx SW registration");

