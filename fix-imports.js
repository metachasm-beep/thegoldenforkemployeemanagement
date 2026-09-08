const fs = require('fs');

const files = [
  'src/app/settings/page.tsx',
  'src/components/ui/form.tsx',
  'src/components/ui/sidebar.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/import\s*\{\s*Label\s*\}\s*from\s*["']@\/components\/ui\/label["']/g, 'import { Label } from "@/components/ui/primitives"');
  content = content.replace(/import\s*\{\s*Separator\s*\}\s*from\s*["']@\/components\/ui\/separator["']/g, 'import { Separator } from "@/components/ui/primitives"');
  content = content.replace(/import\s*\{\s*Skeleton\s*\}\s*from\s*["']@\/components\/ui\/skeleton["']/g, 'import { Skeleton } from "@/components/ui/primitives"');
  fs.writeFileSync(file, content);
});
