const fs = require('fs');

const exportsMap = {
  '@/services/core': ['getSessionUser', 'requireManager', 'requireManagerOrHR', 'logAction', 'createNotification', 'getMyNotifications', 'markNotificationRead'],
  '@/services/employeeService': ['addEmployee', 'updateEmployee', 'offboardEmployee', 'approveOffboardRequest', 'rejectOffboardRequest', 'forceLogoutEmployee', 'uploadAvatar', 'updateProfile'],
  '@/services/leadService': ['addLead', 'updateLead', 'deleteLead', 'updateLeadStatusWithReason'],
  '@/services/financeService': ['addExpense', 'updateExpenseStatus', 'addPTO', 'updatePTOStatus'],
  '@/services/settingService': ['updateSystemSetting']
};

const components = [
  'src/app/actions/invoiceAction.ts',
  'src/app/approvals/page.tsx',
  'src/app/approvals/RejectLeadButton.tsx',
  'src/app/components/EditEmployeeModal.tsx',
  'src/app/components/EmployeeForm.tsx',
  'src/app/components/ExpenseForm.tsx',
  'src/app/components/LeadForm.tsx',
  'src/app/components/LeadsKanban.tsx',
  'src/app/components/NotificationBell.tsx',
  'src/app/components/ProfileAvatar.tsx',
  'src/app/components/PTOForm.tsx',
  'src/app/settings/page.tsx',
  'src/app/team/page.tsx'
];

components.forEach(file => {
  if (!fs.existsSync(file)) return;
  let code = fs.readFileSync(file, 'utf8');

  // Match: import { funcA, funcB } from '../actions' or similar
  const match = code.match(/import\s+\{([^}]+)\}\s+from\s+['"](?:\.\.\/)+actions['"];?/);
  if (match) {
    const funcs = match[1].split(',').map(f => f.trim()).filter(Boolean);
    const newImports = {};

    funcs.forEach(f => {
      let found = false;
      for (const [module, moduleFuncs] of Object.entries(exportsMap)) {
        if (moduleFuncs.includes(f)) {
          if (!newImports[module]) newImports[module] = [];
          newImports[module].push(f);
          found = true;
          break;
        }
      }
      if (!found) {
         // fallback
         if (!newImports['@/services/core']) newImports['@/services/core'] = [];
         newImports['@/services/core'].push(f);
      }
    });

    let importBlock = '';
    for (const [module, modFuncs] of Object.entries(newImports)) {
      importBlock += `import { ${modFuncs.join(', ')} } from '${module}';\n`;
    }

    code = code.replace(match[0], importBlock.trim());
    fs.writeFileSync(file, code);
  }
});
