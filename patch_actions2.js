const fs = require('fs');
let code = fs.readFileSync('src/app/actions.ts', 'utf8');

const offboardOld = `    await prisma.lead.updateMany({
      where: { employeeId },
      data: { employeeId: user.employeeId, assignee: 'Manager' }
    });`;

const offboardNew = `    let targetAssigneeId = user.employeeId;
    if (user.role === 'HR') {
      const firstManager = await prisma.employee.findFirst({ where: { role: 'Manager' } });
      if (firstManager) targetAssigneeId = firstManager.id;
    }
    
    await prisma.lead.updateMany({
      where: { employeeId },
      data: { employeeId: targetAssigneeId, assignee: 'Manager' }
    });`;

code = code.replace(offboardOld, offboardNew);
fs.writeFileSync('src/app/actions.ts', code);
console.log("Updated offboard lead assignment in actions.ts");
