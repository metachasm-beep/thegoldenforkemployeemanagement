const fs = require("fs");
let content = fs.readFileSync("src/app/chatActions.ts", "utf8");

const webPushImport = `import webpush from "@/lib/webpush";\n`;

if (!content.includes("webpush from")) {
  content = content.replace("import { getServerSession }", webPushImport + "import { getServerSession }");
}

const pushLogic = `
      if (p.employeeId !== currentEmployeeId) {
        await pusherServer.trigger(
          \`private-user-\${p.employeeId}\`,
          'global-new-message',
          {
            messageId: message.id,
            conversationId: message.conversationId,
            content: message.content,
            senderName: (message as any).sender.name,
            conversationName: convo?.name
          }
        ).catch(e => console.error('Pusher global notification error:', e));

        // Send Web Push for offline support
        const subs = await prisma.pushSubscription.findMany({
          where: { employeeId: p.employeeId }
        });
        for (const sub of subs) {
          try {
            await webpush.sendNotification(
              { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
              JSON.stringify({
                title: \`New message from \${(message as any).sender.name}\`,
                body: message.content,
                url: \`/chat?id=\${message.conversationId}\`
              })
            );
          } catch (e: any) {
            if (e.statusCode === 410 || e.statusCode === 404) {
              await prisma.pushSubscription.delete({ where: { id: sub.id } });
            }
          }
        }
      }
`;

content = content.replace(
  /if \(p\.employeeId !== currentEmployeeId\) \{[\s\S]*?\}\s*\}\s*\} catch \(error\)/,
  pushLogic + "\n    }\n  } catch (error)"
);

fs.writeFileSync("src/app/chatActions.ts", content);
console.log("Updated chatActions.ts with Web Push logic");

