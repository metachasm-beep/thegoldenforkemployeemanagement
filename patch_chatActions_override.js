const fs = require('fs');

let chatActions = fs.readFileSync('src/app/chatActions.ts', 'utf8');

chatActions = chatActions.replace(
  'export async function getConversations() {',
  'export async function getConversations(overrideEmployeeId?: string) {'
);
chatActions = chatActions.replace(
  'const employeeId = user.employeeId;',
  `const isManager = user.role === 'Manager' || user.role === 'HR';
  const employeeId = (overrideEmployeeId && isManager) ? overrideEmployeeId : user.employeeId;`
);

chatActions = chatActions.replace(
  'export async function getMessages(conversationId: string) {',
  'export async function getMessages(conversationId: string, overrideEmployeeId?: string) {'
);
chatActions = chatActions.replace(
  `where: {
      conversationId_employeeId: {
        conversationId,
        employeeId: user.employeeId
      }
    }`,
  `where: {
      conversationId_employeeId: {
        conversationId,
        employeeId: (overrideEmployeeId && (user.role === 'Manager' || user.role === 'HR')) ? overrideEmployeeId : user.employeeId
      }
    }`
);

fs.writeFileSync('src/app/chatActions.ts', chatActions);
console.log("Updated chatActions to support overrideEmployeeId");
