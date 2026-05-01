const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/theme: \{\n    photoFilter: 'retro-filter',\n    imageFilters: \{\} as Record<string, string>\n  \},/g, `theme: {\n    photoFilter: 'retro-filter',\n    userAvatar: '',\n    imageFilters: {} as Record<string, string>\n  },`);

fs.writeFileSync('src/App.tsx', code);
