const fs = require('fs');
let code = fs.readFileSync('src/app/team/page.tsx', 'utf8');

const regex = /<form action=\{offboardWithId\}>\s*<SubmitButton text="Offboard" loadingText="Removing\.\.\." variant="danger" className="py\.1\.5 text-sm" \/>\s*<\/form>/;

code = code.replace(/<form action=\{offboardWithId\}>[\s\S]*?<\/form>/, `
                          {pendingOffboards.some(r => r.employeeId === emp.id) ? (
                            <span className="py-1.5 px-3 rounded-lg text-sm bg-gray-100 dark:bg-gray-800 text-gray-500 font-medium">Offboard Pending</span>
                          ) : (
                            <form action={offboardWithId}>
                              <SubmitButton text={role === 'HR' ? "Request Offboard" : "Offboard"} loadingText="Processing..." variant="danger" className="py-1.5 text-sm" />
                            </form>
                          )}
`);

fs.writeFileSync('src/app/team/page.tsx', code);
console.log("Updated offboard UI");
