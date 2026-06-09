const fs = require('fs');
const path = require('path');

function findDollar(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (file === 'node_modules' || file === '.git' || file === '.gradle' || file === 'build' || file === 'app\\build') continue;
        
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            findDollar(fullPath);
        } else if (['.kt', '.xml', '.js', '.jsx', '.html', '.json'].includes(path.extname(file))) {
            const content = fs.readFileSync(fullPath, 'utf8');
            const lines = content.split('\n');
            lines.forEach((line, index) => {
                // Look for literal '$' that is not followed by '{' (template literal) or a letter (variable in some langs)
                // Actually, let's just log all of them except those with '${' and see.
                if (line.includes('$') && !line.includes('${') && !file.includes('build.gradle')) {
                    console.log(`${fullPath}:${index + 1}: ${line.trim()}`);
                }
            });
        }
    }
}

findDollar('C:\\\\Users\\\\Lenovo\\\\.gemini\\\\antigravity\\\\scratch\\\\SmartLaundryManagement');
