const fs = require("fs");
let dash = fs.readFileSync("src/app/components/DashboardLayout.tsx", "utf8");
dash = dash.replace("import { toast } from \"sonner\";", "import { notifier } from \"@/lib/notificationManager\";\nimport { toast } from \"sonner\";");
dash = dash.replace("toast(`New message from ${data.senderName}`", "notifier.enqueue(`New message from ${data.senderName}`");
fs.writeFileSync("src/app/components/DashboardLayout.tsx", dash);

