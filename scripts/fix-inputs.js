const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

walkDir('./src/app/components', function(filePath) {
    if (filePath.endsWith('.tsx')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        // Replace `<input ... className="` with `<input ... className="text-black dark:text-white `
        // Regular expressions to match input, select, textarea tags and their classNames
        const regexes = [
            /<(input|select|textarea)[^>]*className=["']([^"']*)["'][^>]*>/g
        ];

        content = content.replace(/<(input|select|textarea)([^>]*)className=["']([^"']*)["']([^>]*)>/g, (match, tag, beforeClass, classString, afterClass) => {
            if (!classString.includes('text-black')) {
                modified = true;
                return `<${tag}${beforeClass}className="text-black dark:text-white ${classString}"${afterClass}>`;
            }
            return match;
        });

        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Updated ${filePath}`);
        }
    }
});
