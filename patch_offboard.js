const fs = require('fs');
let code = fs.readFileSync('src/app/actions.ts', 'utf8');

const regex = /export async function offboardEmployee\([\s\S]*?revalidatePath\('\/team'\);\n  \} catch \(e\) \{\n    console\.error\(e\);\n  \}\n\}/;

const newOffboard = `export async function offboardEmployee(employeeId: string, formData?: FormData) {
  const user = await requireManagerOrHR();
  
  if (user.role === 'HR') {
    const existing = await prisma.offboardRequest.findFirst({
      where: { employeeId, status: 'Pending' }
    });
    if (!existing) {
      await prisma.offboardRequest.create({
        data: { employeeId, requestedBy: user.employeeId, status: 'Pending' }
      });
      await logAction('OFFBOARD_REQUEST_CREATED', { employeeId });
      revalidatePath('/team');
      revalidatePath('/approvals');
    }
    return;
  }

  try {
    let targetAssigneeId = user.employeeId;
    await prisma.lead.updateMany({
      where: { employeeId },
      data: { employeeId: targetAssigneeId, assignee: 'Manager' }
    });
    await prisma.employee.delete({
      where: { id: employeeId }
    });
    await logAction('OFFBOARD_EMPLOYEE', { employeeId });
    revalidatePath('/team');
  } catch (e) {
    console.error(e);
  }
}

export async function approveOffboardRequest(requestId: string, employeeId: string) {
  const user = await requireManager();
  try {
    await prisma.offboardRequest.update({
      where: { id: requestId },
      data: { status: 'Approved' }
    });

    await prisma.lead.updateMany({
      where: { employeeId },
      data: { employeeId: user.employeeId, assignee: 'Manager' }
    });
    await prisma.employee.delete({
      where: { id: employeeId }
    });
    await logAction('OFFBOARD_EMPLOYEE', { employeeId, requestId });
    revalidatePath('/team');
    revalidatePath('/approvals');
  } catch(e) {
    console.error(e);
  }
}

export async function rejectOffboardRequest(requestId: string) {
  await requireManager();
  try {
    await prisma.offboardRequest.update({
      where: { id: requestId },
      data: { status: 'Rejected' }
    });
    await logAction('REJECT_OFFBOARD_REQUEST', { requestId });
    revalidatePath('/team');
    revalidatePath('/approvals');
  } catch(e) {
    console.error(e);
  }
}`;

code = code.replace(regex, newOffboard);

fs.writeFileSync('src/app/actions.ts', code);
console.log("Updated actions.ts");
