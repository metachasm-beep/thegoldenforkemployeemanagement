const fs = require('fs');
const content = fs.readFileSync('C:/Users/PAUL/.gemini/antigravity/brain/5c2ec3de-18f0-4e96-a3b1-cfbddff24d11/.system_generated/steps/1712/content.md', 'utf8');
const matches = content.match(/href="\/docs\/components\/([^"]+)"/g);
console.log([...new Set(matches)]);
