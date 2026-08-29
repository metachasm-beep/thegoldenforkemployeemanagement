const fs = require('fs');
const path = require('path');

function replaceFileContent(filePath, rules) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    for (let rule of rules) {
        content = content.replace(rule.search, rule.replace);
    }
    
    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${filePath}`);
    }
}

// 1. EmployeeView.tsx
replaceFileContent('src/app/components/EmployeeView.tsx', [
    { search: /p-8/g, replace: 'p-4 md:p-8' },
    { search: /bg-white\/80 backdrop-blur-xl/g, replace: 'bg-white/80 dark:bg-gray-900/50 backdrop-blur-xl' },
    { search: /border-slate-100/g, replace: 'border-slate-100 dark:border-gray-800' },
    { search: /text-slate-800/g, replace: 'text-slate-800 dark:text-gray-100' }
]);

// 2. ManagerView.tsx
replaceFileContent('src/app/components/ManagerView.tsx', [
    { search: /p-8/g, replace: 'p-4 md:p-8' },
    { search: /bg-white\/80 backdrop-blur-xl/g, replace: 'bg-white/80 dark:bg-gray-900/50 backdrop-blur-xl' },
    { search: /border-slate-100/g, replace: 'border-slate-100 dark:border-gray-800' },
    { search: /text-slate-800/g, replace: 'text-slate-800 dark:text-gray-100' }
]);

// 3. ExpensePTOForms.tsx
replaceFileContent('src/app/components/ExpensePTOForms.tsx', [
    { search: /p-8/g, replace: 'p-4 md:p-8' },
    { search: /bg-white\/80 backdrop-blur-xl/g, replace: 'bg-white/80 dark:bg-gray-900/50 backdrop-blur-xl' },
    { search: /border-slate-100/g, replace: 'border-slate-100 dark:border-gray-800' },
    { search: /text-slate-800/g, replace: 'text-slate-800 dark:text-gray-100' }
]);

// 4. PayrollTable.tsx
replaceFileContent('src/app/components/PayrollTable.tsx', [
    { search: /p-8/g, replace: 'p-4 md:p-8' }
]);

// 5. ManagerDashboard.tsx
replaceFileContent('src/app/components/ManagerDashboard.tsx', [
    { search: /p-8/g, replace: 'p-4 md:p-8' }
]);

// 6. EmployeeDashboard.tsx
replaceFileContent('src/app/components/EmployeeDashboard.tsx', [
    { search: /p-6/g, replace: 'p-4 md:p-6' }
]);

// 7. EarningsCard.tsx
replaceFileContent('src/app/components/EarningsCard.tsx', [
    { search: /p-8/g, replace: 'p-4 md:p-8' }
]);

console.log("Done fixing paddings and dark mode classes");
