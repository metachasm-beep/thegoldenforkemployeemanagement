const fs = require("fs");
let content = fs.readFileSync("src/app/components/NotificationBell.tsx", "utf8");
content = content.replace(
  /<button \s*className="(.*?)"\s*aria-label="Notifications"/g,
  `<button className="$1 tour-notifications" aria-label="Notifications"`
);
fs.writeFileSync("src/app/components/NotificationBell.tsx", content);
console.log("Updated NotificationBell.tsx");

