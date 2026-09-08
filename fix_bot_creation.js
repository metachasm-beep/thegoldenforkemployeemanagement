const fs = require('fs');
let code = fs.readFileSync('src/app/chatActions.ts', 'utf8');

code = code.replace(
  "baseSalary: 0,\n        target: 0,\n        avatarUrl: 'https://ui-avatars.com/api/?name=GF&background=F59E0B&color=fff',",
  "baseSalary: 0,\n        target: 0,\n        avatarUrl: 'https://ui-avatars.com/api/?name=GF&background=F59E0B&color=fff',\n        commissionRate: 0,\n        probationDuration: 0,\n        isProbation: false,\n        failedMonths: 0,\n        penalty: 0,"
);

fs.writeFileSync('src/app/chatActions.ts', code);
console.log("Fixed required missing fields in getSystemBot");
