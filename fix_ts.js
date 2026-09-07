const fs = require('fs');
let code = fs.readFileSync('src/app/actions.ts', 'utf8');

const functionToAdd = `
async function requireManagerOrHR() {
  const user = await getSessionUser();
  if (!user || (user.role !== 'Manager' && user.role !== 'HR')) {
    throw new Error('Forbidden: Manager or HR access required.');
  }
  return user;
}
`;

code = code.replace(
  'export async function logAction',
  functionToAdd + '\nexport async function logAction'
);

fs.writeFileSync('src/app/actions.ts', code);
console.log("Added requireManagerOrHR via logAction replace");
