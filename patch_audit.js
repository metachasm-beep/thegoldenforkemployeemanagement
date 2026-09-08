const fs = require('fs');

let view = fs.readFileSync('src/app/components/ManagerView.tsx', 'utf8');
view = view.replace(
  '<ManagerDashboard employees={employees} leads={leads} auditLogs={auditLogs} />',
  '<ManagerDashboard employees={employees} leads={leads} auditLogs={auditLogs} isHR={isHR} />'
);
fs.writeFileSync('src/app/components/ManagerView.tsx', view);

let dash = fs.readFileSync('src/app/components/ManagerDashboard.tsx', 'utf8');
dash = dash.replace(
  'auditLogs: AuditLog[];\n};',
  'auditLogs: AuditLog[];\n  isHR?: boolean;\n};'
);
dash = dash.replace(
  'export default function ManagerDashboard({ employees, leads, auditLogs }: Props) {',
  'export default function ManagerDashboard({ employees, leads, auditLogs, isHR }: Props) {'
);
dash = dash.replace(
  '<AuditLogsWidget logs={auditLogs} employees={employees} />',
  '{!isHR && <AuditLogsWidget logs={auditLogs} employees={employees} />}'
);
fs.writeFileSync('src/app/components/ManagerDashboard.tsx', dash);

console.log("Patched audit logs visibility");
