const fs = require('fs');
let text = fs.readFileSync('src/App.tsx', 'utf8');
text = text.replace(/typeof INITIAL_CONFIG/g, 'typeof INITIAL_CONFIG_KR');
text = text.replace(/INITIAL_CONFIG\./g, 'INITIAL_CONFIG_KR.');
fs.writeFileSync('src/App.tsx', text);
