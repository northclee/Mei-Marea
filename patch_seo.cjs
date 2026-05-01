const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add seo object to config if not exists
code = code.replace(/const INITIAL_CONFIG_KR = \{/, 'const INITIAL_CONFIG_KR = {\n  seo: {},\n');
code = code.replace(/const INITIAL_CONFIG_EN = \{/, 'const INITIAL_CONFIG_EN = {\n  seo: {},\n');

fs.writeFileSync('src/App.tsx', code);
