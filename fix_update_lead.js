const fs = require('fs');
let code = fs.readFileSync('src/app/actions.ts', 'utf8');

const oldUpdateLead = `export async function updateLead(leadId: string, updates: Record<string, string>) {
    try {
      if (updates.stage) {
        let stage = updates.stage;
        const user = await getSessionUser();
        const role = user?.role || 'Employee';
        
        if (stage === 'Converted' && role !== 'Manager' && role !== 'Team Lead') {
          stage = 'Pending Verification';
        }

        const isConverted = stage === 'Converted';
        const lead = await prisma.lead.update({
          where: { leadId },
          data: { 
            status: stage,
          ...(isConverted && { convertedAt: new Date() })
        }
      });
      await logAction('UPDATE_LEAD_STAGE', { leadId, newStage: updates.stage });
      
      // Notify manager if converted
      if (isConverted) {
        const user = await getSessionUser();
        // Assuming we notify all managers, or just hardcode one for now
        const managers = await prisma.employee.findMany({ where: { role: 'Manager' } });
        for (const m of managers) {
          await createNotification(m.id, \`Lead converted by \${user.email} (ID: \${user.employeeId?.slice(0,8)})\`);
        }
      }
    }
    revalidatePath('/');
    return { success: true };
  } catch {
    return { success: false };
  }
}`;

const newUpdateLead = `export async function updateLead(leadId: string, updates: Record<string, string>) {
  try {
    const user = await getSessionUser();
    const role = user?.role || 'Employee';

    let status = updates.status || updates.stage;
    if (status === 'Converted' && role !== 'Manager' && role !== 'Team Lead') {
      status = 'Pending Verification';
    }

    const updateData: any = {};
    if (status) {
      updateData.status = status;
      if (status === 'Converted') {
        updateData.convertedAt = new Date();
      }
    }
    if (updates.assignee !== undefined) updateData.assignee = updates.assignee;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (updates.followUp !== undefined) updateData.followUp = updates.followUp;

    const lead = await prisma.lead.update({
      where: { leadId },
      data: updateData
    });

    await logAction('UPDATE_LEAD', { leadId, updates });
    
    // Notify manager if converted
    if (status === 'Converted') {
      const managers = await prisma.employee.findMany({ where: { role: 'Manager' } });
      for (const m of managers) {
        await createNotification(m.id, \`Lead converted by \${user.email}\`);
      }
    }

    revalidatePath('/');
    return { success: true };
  } catch {
    return { success: false };
  }
}`;

code = code.replace(oldUpdateLead, newUpdateLead);
fs.writeFileSync('src/app/actions.ts', code);
