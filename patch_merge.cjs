const fs = require('fs');

const code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /const \[fullConfig, setFullConfig\] = useState\(\(\) => \{[\s\S]*?return \{ KR: INITIAL_CONFIG_KR, EN: INITIAL_CONFIG_EN \};\n  \}\);/m;

const replacement = `const [fullConfig, setFullConfig] = useState(() => {
    const saved = localStorage.getItem('siteConfig');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        
        // Deep merge function
        const deepMerge = (target, source) => {
          if (!source) return target;
          const output = Object.assign({}, target);
          if (isObject(target) && isObject(source)) {
            Object.keys(source).forEach(key => {
              if (isObject(source[key])) {
                if (!(key in target))
                  Object.assign(output, { [key]: source[key] });
                else
                  output[key] = deepMerge(target[key], source[key]);
              } else {
                Object.assign(output, { [key]: source[key] });
              }
            });
          }
          return output;
        };
        
        const isObject = (item) => (item && typeof item === 'object' && !Array.isArray(item));

        if (parsed.KR && parsed.EN) {
             return {
                 KR: deepMerge(INITIAL_CONFIG_KR, parsed.KR),
                 EN: deepMerge(INITIAL_CONFIG_EN, parsed.EN)
             };
        }
        
        // Migrate legacy config if valid object
        if (parsed.brand) {
          return { KR: deepMerge(INITIAL_CONFIG_KR, parsed), EN: INITIAL_CONFIG_EN };
        }
      } catch (e) {
        console.error("Failed to parse config", e);
      }
    }
    return { KR: INITIAL_CONFIG_KR, EN: INITIAL_CONFIG_EN };
  });`;

let newCode = code.replace(regex, replacement);

fs.writeFileSync('src/App.tsx', newCode);
