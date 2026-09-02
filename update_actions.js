const fs = require('fs');
let code = fs.readFileSync('src/app/actions.ts', 'utf8');

const updateEmployeeFunc = 
export async function updateEmployee(fd: FormData) {
  try {
    const employeeId = fd.get('employeeId') as string;
    const baseSalary = parseInt(fd.get('baseSalary') as string);
    const commissionRate = parseInt(fd.get('commissionRate') as string);
    const target = parseInt(fd.get('target') as string);
    const managerId = fd.get('managerId') as string || null;

    await prisma.employee.update({
      where: { id: employeeId },
      data: {
        baseSalary,
        commissionRate,
        target,
        managerId,
      }
    });

    revalidatePath('/team');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
;

if (!code.includes('export async function updateEmployee')) {
  fs.writeFileSync('src/app/actions.ts', code + '\n' + updateEmployeeFunc);
}
