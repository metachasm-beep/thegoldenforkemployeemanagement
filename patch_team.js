const fs = require('fs');
let code = fs.readFileSync('src/app/team/page.tsx', 'utf8');

code = code.replace(
  "import SubmitButton from '../components/SubmitButton';",
  "import SubmitButton from '../components/SubmitButton';\nimport { prisma } from '@/lib/prisma';"
);

code = code.replace(
  "const leads = await getLeads();",
  "const leads = await getLeads();\n  const pendingOffboards = await prisma.offboardRequest.findMany({ where: { status: 'Pending' } });"
);

// We need to modify the UI where the Offboard button is shown
const offboardFormOld = `<form action={offboardWithId}>
                            <SubmitButton text="Offboard" loadingText="Removing..." variant="danger" className="py-1.5 text-sm" />
                          </form>`;

const offboardFormNew = `
                          {pendingOffboards.some(r => r.employeeId === emp.id) ? (
                            <span className="py-1.5 px-3 rounded-lg text-sm bg-gray-100 dark:bg-gray-800 text-gray-500 font-medium">Offboard Pending</span>
                          ) : (
                            <form action={offboardWithId}>
                              <SubmitButton text={role === 'HR' ? "Request Offboard" : "Offboard"} loadingText="Processing..." variant="danger" className="py-1.5 text-sm" />
                            </form>
                          )}
`;

code = code.replace(offboardFormOld, offboardFormNew);
fs.writeFileSync('src/app/team/page.tsx', code);
console.log("Updated TeamPage with offboard requests logic");
