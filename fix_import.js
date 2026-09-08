const fs = require('fs');
let code = fs.readFileSync('src/app/components/DashboardLayout.tsx', 'utf8');

code = code.replace(
  /import \{([^}]+)\} from 'lucide-react';/,
  "import {$1, MessageSquare} from 'lucide-react';"
);

fs.writeFileSync('src/app/components/DashboardLayout.tsx', code);
console.log("Fixed missing import");
