const fs = require('fs');
let code = fs.readFileSync('src/app/actions.ts', 'utf8');

code = code.replace(
  /export async function addEmployee\(data: FormData\) \{\s*try \{\s*const emp = await prisma\.employee\.create\(\{\s*data: \{\s*name: data\.get\('name'\) as string,\s*role: data\.get\('role'\) as string,/,
  `export async function addEmployee(data: FormData) {
  const user = await requireManagerOrHR();
  const requestedRole = data.get('role') as string;
  
  if (user.role === 'HR' && (requestedRole === 'Manager' || requestedRole === 'HR')) {
    throw new Error('HR is not authorized to create Manager or HR roles.');
  }

  try {
    const emp = await prisma.employee.create({
      data: {
        name: data.get('name') as string,
        role: requestedRole,`
);

fs.writeFileSync('src/app/actions.ts', code);
console.log("Updated addEmployee via regex");
