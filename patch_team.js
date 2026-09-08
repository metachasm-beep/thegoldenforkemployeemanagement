const fs = require('fs');
let code = fs.readFileSync('src/app/team/page.tsx', 'utf8');

code = code.replace(
  /<Link href=\{\`\/team\/impersonate\/\$\{emp\.id\}\`\} className="px-3 py-1\.5 bg-blue-100 dark:bg-blue-900\/30 hover:bg-blue-200 dark:hover:bg-blue-900\/50 text-blue-700 dark:text-blue-400 rounded-lg text-sm font-medium transition-colors">\s*Log in\s*<\/Link>/g,
  `{role === 'Manager' && (
                            <Link href={\`/team/impersonate/\${emp.id}\`} className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400 rounded-lg text-sm font-medium transition-colors">
                              Log in
                            </Link>
                          )}`
);

fs.writeFileSync('src/app/team/page.tsx', code);
console.log("Patched team page impersonate button");
