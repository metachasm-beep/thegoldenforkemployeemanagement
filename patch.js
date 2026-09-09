const fs = require("fs");
let c = fs.readFileSync("src/app/components/DashboardLayout.tsx", "utf8");

c = c.replace(
  "import { usePathname } from \"next/navigation\";",
  "import { usePathname } from \"next/navigation\";\nimport { getPusherClient } from \"@/lib/pusher\";\nimport { toast } from \"sonner\";"
);

const newEffect = "  useEffect(() => {\n    setMounted(true);\n    if (session?.user && (session.user as any).employeeId) {\n      const employeeId = (session.user as any).employeeId;\n      const pusher = getPusherClient();\n      const channel = pusher.subscribe(`private-user-${employeeId}`);\n      channel.bind(\"global-new-message\", (data: any) => {\n        if (window.location.pathname.startsWith(\"/chat\")) return;\n        toast(`New message from ${data.senderName}`, {\n          description: data.content,\n          action: {\n            label: \"View\",\n            onClick: () => window.location.href = \"/chat\"\n          }\n        });\n      });\n      return () => pusher.unsubscribe(`private-user-${employeeId}`);\n    }\n  }, [session]);";

c = c.replace(/  useEffect\(\(\) => \{\s+setMounted\(true\);\s+\}, \[\]\);/g, newEffect);

fs.writeFileSync("src/app/components/DashboardLayout.tsx", c);
