const fs = require('fs');
let code = fs.readFileSync('src/app/components/AuditLogsWidget.tsx', 'utf8');

const oldFormatDetails = `      for (const [key, value] of Object.entries(parsed)) {
        if (key.toLowerCase().includes('id') && typeof value === 'string' && value.length > 20) {
            continue; // Skip raw UUIDs in details if they are verbose
        }
        parts.push(\`\${key}: \${formatValue(value)}\`);
      }`;

const newFormatDetails = `      for (const [key, value] of Object.entries(parsed)) {
        if (key === 'leadDetails') continue; // Skip full lead snapshot in preview
        if (key.toLowerCase().includes('id') && typeof value === 'string' && value.length > 20) {
            continue; // Skip raw UUIDs in details if they are verbose
        }
        parts.push(\`\${key}: \${formatValue(value)}\`);
      }`;

code = code.replace(oldFormatDetails, newFormatDetails);
fs.writeFileSync('src/app/components/AuditLogsWidget.tsx', code);
console.log("Patched formatDetails preview");
