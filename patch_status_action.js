const fs = require('fs');
let code = fs.readFileSync('src/app/chatActions.ts', 'utf8');

const newAction = `
export async function setPresenceStatus(isAway: boolean) {
  const user = await getSessionUser();
  await pusherServer.trigger('presence-global', 'user-status-change', {
    userId: user.employeeId,
    status: isAway ? 'away' : 'online'
  });
}
`;

code += newAction;
fs.writeFileSync('src/app/chatActions.ts', code);
