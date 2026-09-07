const fs = require('fs');
let code = fs.readFileSync('src/app/approvals/page.tsx', 'utf8');

code = code.replace(
  "import { updateExpenseStatus, updatePTOStatus, updateLeadStatusWithReason } from '../actions';",
  "import { updateExpenseStatus, updatePTOStatus, updateLeadStatusWithReason, approveOffboardRequest, rejectOffboardRequest } from '../actions';\nimport { prisma } from '@/lib/prisma';"
);

code = code.replace(
  "const ptos = await getPTO();",
  "const ptos = await getPTO();\n  const pendingOffboards = role === 'Manager' ? await prisma.offboardRequest.findMany({ where: { status: 'Pending' } }) : [];"
);

fs.writeFileSync('src/app/approvals/page.tsx', code);
console.log("Updated ApprovalsPage data loading");
