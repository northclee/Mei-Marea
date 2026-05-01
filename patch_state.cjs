const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex1 = /export default function App\(\) \{\s*const \[config, setConfig\] = useState\(INITIAL_CONFIG_KR\);\s*const \[isEditMode, setIsEditMode\] = useState\(false\);\s*const \[user, setUser\] = useState<User \| null>\(null\);\s*const \[activeMainMenuId, setActiveMainMenuId\] = useState\('women'\);\s*const \[lang, setLang\] = useState<'KR'\|'EN'>\('KR'\);/g;

const replacement1 = `export default function App() {
  const [lang, setLang] = useState<'KR'|'EN'>('KR');
  const [fullConfig, setFullConfig] = useState(() => {
    const saved = localStorage.getItem('siteConfig');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.KR && parsed.EN) return parsed;
        // Migrate legacy config if valid object
        if (parsed.brand) {
          return { KR: { ...INITIAL_CONFIG_KR, ...parsed }, EN: INITIAL_CONFIG_EN };
        }
      } catch (e) {
        console.error("Failed to parse config", e);
      }
    }
    return { KR: INITIAL_CONFIG_KR, EN: INITIAL_CONFIG_EN };
  });

  const config = fullConfig[lang];
  const [isEditMode, setIsEditMode] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [activeMainMenuId, setActiveMainMenuId] = useState('women');`;

code = code.replace(regex1, replacement1);

// Now remove the persistence `useEffect` that uses setConfig.
const regex2 = /  \/\/ Persistence & Auth Listener\s*useEffect\(\(\) => \{\s*const saved = localStorage.getItem\('siteConfig'\);\s*if \(saved\) \{\s*try \{\s*const parsed = JSON.parse\(saved\);\s*setConfig\(prev => \(\{\s*\.\.\.INITIAL_CONFIG_KR,\s*\.\.\.parsed,\s*labels: \{ \.\.\.INITIAL_CONFIG_KR\.labels, \.\.\.\(parsed\.labels \|\| \{\}\) \},\s*brand: \{ \.\.\.INITIAL_CONFIG_KR\.brand, \.\.\.\(parsed\.brand \|\| \{\}\) \},\s*theme: \{ \.\.\.INITIAL_CONFIG_KR\.theme, \.\.\.\(parsed\.theme \|\| \{\}\) \},\s*marquee: \{ \.\.\.INITIAL_CONFIG_KR\.marquee, \.\.\.\(parsed\.marquee \|\| \{\}\) \}\s*\}\)\);\s*\} catch \(e\) \{ console\.error\(e\); \}\s*\}\s*return onAuthStateChanged\(auth, async \(u\) => \{/g;

const replacement2 = `  // Persistence & Auth Listener
  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {`;
    
code = code.replace(regex2, replacement2);


// Replace `updateField` and others to update `fullConfig`.
const regex3 = /  const updateField = \(path: string, value: string\) => \{\s*setConfig\(prevConfig => \{\s*const keys = path\.split\('\.'\);\s*const nextConfig = JSON\.parse\(JSON\.stringify\(prevConfig\)\);\s*let current = nextConfig;\s*for \(let i = 0; i < keys\.length - 1; i\+\+\) \{\s*current = current\[keys\[i\]\];\s*\}\s*current\[keys\[keys\.length - 1\]\] = value;\s*localStorage\.setItem\('siteConfig', JSON\.stringify\(nextConfig\)\);\s*return nextConfig;\s*\}\);\s*\};\s*const updateListItem = \(listPath: string, id: string, field: string, value: string\) => \{\s*setConfig\(prevConfig => \{\s*const nextConfig = JSON\.parse\(JSON\.stringify\(prevConfig\)\);\s*const keys = listPath\.split\('\.'\);\s*let list = nextConfig;\s*for \(const key of keys\) \{ list = list\[key\]; \}\s*const index = list\.findIndex\(\(item: any\) => item\.id === id\);\s*if \(index !== -1\) \{\s*list\[index\]\[field\] = value;\s*localStorage\.setItem\('siteConfig', JSON\.stringify\(nextConfig\)\);\s*\}\s*return nextConfig;\s*\}\);\s*\};\s*const updateImageFilter = \(url: string, filterClass: string\) => \{\s*setConfig\(prevConfig => \{\s*const nextConfig = JSON\.parse\(JSON\.stringify\(prevConfig\)\);\s*if \(\!nextConfig\.theme\) nextConfig\.theme = \{\};\s*if \(\!nextConfig\.theme\.imageFilters\) nextConfig\.theme\.imageFilters = \{\};\s*nextConfig\.theme\.imageFilters\[url\] = filterClass;\s*localStorage\.setItem\('siteConfig', JSON\.stringify\(nextConfig\)\);\s*return nextConfig;\s*\}\);\s*\};/g;

const replacement3 = `  const updateField = (path: string, value: string) => {
    setFullConfig(prevConfig => {
      const keys = path.split('.');
      const nextConfig = JSON.parse(JSON.stringify(prevConfig));
      let current = nextConfig[lang];
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      localStorage.setItem('siteConfig', JSON.stringify(nextConfig));
      return nextConfig;
    });
  };

  const updateListItem = (listPath: string, id: string, field: string, value: string) => {
    setFullConfig(prevConfig => {
      const nextConfig = JSON.parse(JSON.stringify(prevConfig));
      const keys = listPath.split('.');
      let list = nextConfig[lang];
      for (const key of keys) { list = list[key]; }
      
      const index = list.findIndex((item: any) => item.id === id);
      if (index !== -1) {
        list[index][field] = value;
        localStorage.setItem('siteConfig', JSON.stringify(nextConfig));
      }
      return nextConfig;
    });
  };

  const updateImageFilter = (url: string, filterClass: string) => {
    setFullConfig(prevConfig => {
      const nextConfig = JSON.parse(JSON.stringify(prevConfig));
      if (!nextConfig[lang].theme) nextConfig[lang].theme = {};
      if (!nextConfig[lang].theme.imageFilters) nextConfig[lang].theme.imageFilters = {};
      nextConfig[lang].theme.imageFilters[url] = filterClass;
      localStorage.setItem('siteConfig', JSON.stringify(nextConfig));
      return nextConfig;
    });
  };`;

code = code.replace(regex3, replacement3);

fs.writeFileSync('src/App.tsx', code);
