const fs = require("fs");
let content = fs.readFileSync("src/lib/webpush.ts", "utf8");

const replacement = `let subject = process.env.VAPID_SUBJECT || "mailto:contact@thegoldenfork.de";
if (!subject.startsWith("mailto:") && !subject.startsWith("http")) {
  subject = "mailto:" + subject;
}

webpush.setVapidDetails(
  subject,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string,
  process.env.VAPID_PRIVATE_KEY as string
);`;

content = content.replace(/webpush\.setVapidDetails\([\s\S]*?\);/, replacement);

fs.writeFileSync("src/lib/webpush.ts", content);
console.log("Updated webpush.ts to handle missing mailto:");

