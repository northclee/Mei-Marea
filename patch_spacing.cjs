const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Replace all 'pt-48' with 'pt-32' or 'pt-36' to remove the big blank space
code = code.replace(/className="pt-48"/g, 'className="pt-[140px]"');
code = code.replace(/className="pt-48 /g, 'className="pt-[140px] ');

fs.writeFileSync('src/App.tsx', code);
