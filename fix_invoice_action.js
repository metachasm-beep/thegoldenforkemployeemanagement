const fs = require('fs');
let code = fs.readFileSync('src/app/actions/invoiceAction.ts', 'utf8');

code = code.replace("import { getLeads } from '@/lib/db/leads';", "import { getLeads } from '@/lib/db/leads';\nimport { logAction } from '../actions';");

const oldCreate = `      data: {
        employeeId,
        month,
        conversions,
        baseSalary: compensation.basePayout,
        commission: totalCommission,
        grossAmount: compensation.grossPayout,
        tdsDeduction: compensation.tdsDeduction,
        amount: compensation.totalPayout,
        status: 'Generated'
      }
    });

    return { success: true };`;

const newCreate = `      data: {
        employeeId,
        month,
        conversions,
        baseSalary: compensation.basePayout,
        commission: totalCommission,
        grossAmount: compensation.grossPayout,
        tdsDeduction: compensation.tdsDeduction,
        amount: compensation.totalPayout,
        status: 'Generated'
      }
    });

    await logAction('GENERATE_INVOICE_MANUAL', { targetEmployeeId: employeeId, month, amount: compensation.totalPayout });

    return { success: true };`;

code = code.replace(oldCreate, newCreate);
fs.writeFileSync('src/app/actions/invoiceAction.ts', code);
