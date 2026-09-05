const fs = require('fs');
let code = fs.readFileSync('src/app/actions.ts', 'utf8');

// CREATE_LEAD
code = code.replace(
  "await logAction('CREATE_LEAD', { leadId: lead.leadId });",
  "await logAction('CREATE_LEAD', { leadId: lead.leadId, leadDetails: lead });"
);

// UPDATE_LEAD
code = code.replace(
  "await logAction('UPDATE_LEAD', { leadId, updates });",
  "await logAction('UPDATE_LEAD', { leadId, updates, leadDetails: lead });"
);

// UPDATE_LEAD_STATUS
code = code.replace(
  "await logAction('UPDATE_LEAD_STATUS', { leadId, newStage, reason });",
  "await logAction('UPDATE_LEAD_STATUS', { leadId, newStage, reason, leadDetails: lead });"
);

// DELETE_LEAD
code = code.replace(
  "await logAction('DELETE_LEAD', { leadId });",
  "await logAction('DELETE_LEAD', { leadId, leadDetails: lead });"
);

fs.writeFileSync('src/app/actions.ts', code);
console.log("Patched actions.ts");
