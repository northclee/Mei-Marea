const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/userAvatar: '',/g, "userAvatar: '',\n    icons: {} as Record<string, string>,");

fs.writeFileSync('src/App.tsx', code);
