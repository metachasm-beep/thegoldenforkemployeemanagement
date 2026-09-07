const fs = require('fs');
let code = fs.readFileSync('src/app/approvals/page.tsx', 'utf8');

const newSection = `
        {role === 'Manager' && pendingOffboards.length > 0 && (
          <section className="bg-white/80 dark:bg-gray-900/50 backdrop-blur-xl p-8 rounded-3xl shadow-sm border border-red-100 dark:border-red-900/30 mb-10">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-800 dark:text-gray-200">
              🚨 Pending Offboarding Requests <Badge variant="destructive">{pendingOffboards.length}</Badge>
            </h2>
            <div className="rounded-md border border-gray-100 dark:border-gray-800 overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50/50 dark:bg-gray-800/50">
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Requested By (HR)</TableHead>
                    <TableHead>Requested At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingOffboards.map(req => {
                    const emp = employees.find(e => e.id === req.employeeId);
                    const hr = employees.find(e => e.id === req.requestedBy);
                    return (
                      <TableRow key={req.id}>
                        <TableCell className="font-medium text-gray-900 dark:text-gray-100">{emp?.name || 'Unknown'}</TableCell>
                        <TableCell>{hr?.name || 'Unknown'}</TableCell>
                        <TableCell>{new Date(req.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right flex items-center justify-end gap-2">
                          <form action={approveOffboardRequest.bind(null, req.id, req.employeeId)}>
                            <SubmitButton text="Approve & Offboard" loadingText="Processing..." variant="danger" className="py-1.5 px-3 text-xs" />
                          </form>
                          <form action={rejectOffboardRequest.bind(null, req.id)}>
                            <SubmitButton text="Reject" loadingText="Rejecting..." variant="outline" className="py-1.5 px-3 text-xs" />
                          </form>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </section>
        )}
`;

code = code.replace(
  '<div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">',
  '<div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">\n' + newSection
);

fs.writeFileSync('src/app/approvals/page.tsx', code);
console.log("Updated ApprovalsPage UI");
