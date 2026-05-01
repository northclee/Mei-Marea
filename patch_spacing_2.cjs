const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/className="pt-\[140px\]"/g, 'className="pt-[110px]"');
code = code.replace(/className="pt-\[140px\] /g, 'className="pt-[110px] ');

// Remove extra padding from hero section
code = code.replace(/className="px-4 md:px-16 py-12 md:py-24 flex flex-col md:flex-row items-center gap-12 md:gap-24"/, 'className="px-4 md:px-16 pt-4 pb-12 items-center flex flex-col md:flex-row gap-12 md:gap-24"');

fs.writeFileSync('src/App.tsx', code);
