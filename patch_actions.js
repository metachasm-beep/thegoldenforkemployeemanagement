const fs = require('fs');
let code = fs.readFileSync('src/app/actions.ts', 'utf8');

code = code.replace(/export async function offboardEmployee\([\s\S]*?requireManager\(\);/, 'export async function offboardEmployee(employeeId: string, formData?: FormData) {\n  const user = await requireManagerOrHR();');
code = code.replace(/export async function forceLogoutEmployee\([\s\S]*?requireManager\(\);/, 'export async function forceLogoutEmployee(employeeId: string, formData?: FormData) {\n  await requireManagerOrHR();');
code = code.replace(/export async function updateExpenseStatus\([\s\S]*?requireManager\(\);/, 'export async function updateExpenseStatus(expenseId: string, status: string) {\n  await requireManagerOrHR();');
code = code.replace(/export async function updatePTOStatus\([\s\S]*?requireManager\(\);/, 'export async function updatePTOStatus(ptoId: string, status: string) {\n  await requireManagerOrHR();');

fs.writeFileSync('src/app/actions.ts', code);
console.log("Updated src/app/actions.ts via Regex");
