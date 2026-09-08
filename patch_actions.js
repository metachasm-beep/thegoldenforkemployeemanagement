const fs = require('fs');
let code = fs.readFileSync('src/app/actions.ts', 'utf8');

if (!code.includes('sendSystemNotification')) {
  // Add import at the top
  code = code.replace(
    'import { prisma } from "@/lib/prisma";',
    'import { prisma } from "@/lib/prisma";\nimport { sendSystemNotification } from "@/app/chatActions";'
  );

  // Find addLead
  code = code.replace(
    'revalidatePath("/leads");\n  return newLead;',
    `revalidatePath("/leads");
  
  if (data.assignedToId) {
    const assignedEmp = await prisma.employee.findUnique({ where: { id: data.assignedToId } });
    if (assignedEmp) {
      await sendSystemNotification(
        data.assignedToId,
        \`Hello \${assignedEmp.name}! A new lead **\${data.companyName}** (\${data.contactName}) has just been assigned to you. Please follow up!\`
      );
    }
  }
  
  return newLead;`
  );

  fs.writeFileSync('src/app/actions.ts', code);
  console.log("Hooked Bot into addLead in actions.ts");
} else {
  console.log("Already hooked.");
}
