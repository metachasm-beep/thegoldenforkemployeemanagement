import os
import re

with open('src/app/actions.ts', 'r', encoding='utf-8') as f:
    code = f.read()

# Replace offboardEmployee
old_str_regex = r"export async function offboardEmployee\(.*?\).*?catch \(e\) \{\s*console\.error\(e\);\s*\}\s*\}"

new_str = """export async function offboardEmployee(employeeId: string, formData?: FormData) {
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
    if (user.role === 'HR') {
      const firstManager = await prisma.employee.findFirst({ where: { role: 'Manager' } });
      if (firstManager) targetAssigneeId = firstManager.id;
    }
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
}"""

new_code = re.sub(old_str_regex, new_str, code, flags=re.DOTALL)

with open('src/app/actions.ts', 'w', encoding='utf-8') as f:
    f.write(new_code)
print("Patched via Python")
