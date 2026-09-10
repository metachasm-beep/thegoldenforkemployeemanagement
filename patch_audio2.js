const fs = require("fs");
let content = fs.readFileSync("src/lib/notificationManager.ts", "utf8");

content = content.replace("const playNotificationSound = () => {", "export const playNotificationSound = () => {");

fs.writeFileSync("src/lib/notificationManager.ts", content);
console.log("Exported playNotificationSound");

