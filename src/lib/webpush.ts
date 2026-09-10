import webpush from "web-push";

let subject = process.env.VAPID_SUBJECT || "mailto:contact@thegoldenfork.de";
if (!subject.startsWith("mailto:") && !subject.startsWith("http")) {
  subject = "mailto:" + subject;
}

webpush.setVapidDetails(
  subject,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string,
  process.env.VAPID_PRIVATE_KEY as string
);

export default webpush;

