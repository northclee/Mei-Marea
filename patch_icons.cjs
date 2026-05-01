const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Setup default avatar URL in Initial Config
code = code.replace(/photoFilter: 'grayscale\(100%\)',/g, "photoFilter: 'grayscale(100%)',\n    userAvatar: '',");

// 2. Add New Components: KissMark, MultipleBags, UploadableAvatar
const newComponents = `
const KissMark = ({ size = 20, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M15 45 C15 30 25 20 40 25 C45 27 55 27 60 25 C75 20 85 30 85 45 C85 60 70 65 60 70 C50 75 40 75 30 70 C20 65 15 60 15 45 Z" fill="#E60000" />
    <path d="M40 25 C45 22 55 22 60 25 C70 15 90 25 85 45 C82 55 75 60 60 70 C50 75 40 75 30 70 C15 60 8 55 15 45 C10 25 30 15 40 25 Z" fill="#E60000" />
    <path d="M10 50 C20 65 40 70 50 70 C60 70 80 65 90 50 C95 40 85 30 80 35 C70 45 60 55 50 55 C40 55 30 45 20 35 C15 30 5 40 10 50 Z" fill="#FF1A1A" />
    <path d="M25 45 C35 55 45 60 50 60 C55 60 65 55 75 45 C75 35 65 40 50 40 C35 40 25 35 25 45 Z" fill="#fff" opacity="0.3" />
  </svg>
);

const MultipleBags = ({ size = 20, className = "" }) => (
  <div className={\`relative \${className}\`} style={{ width: size, height: size }}>
    <ShoppingBag size={size * 0.85} strokeWidth={1} className="absolute bottom-0 right-0 text-gray-800" />
    <ShoppingBag size={size * 0.85} strokeWidth={1} className="absolute top-0 left-0 bg-white text-gray-800" />
  </div>
);

const UploadableAvatar = ({ size = 20, className = "" }) => {
  const { config, updateField, isEditMode } = useEditor();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        updateField('theme.userAvatar', base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerUpload = () => {
    if (isEditMode && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const hasImage = config.theme?.userAvatar;

  return (
    <div 
      className={\`\${className} \${isEditMode ? 'cursor-pointer hover:ring-2 ring-blue-400 rounded-full' : ''}\`} 
      onClick={triggerUpload}
      title={isEditMode ? "Click to change avatar" : ""}
      style={{ width: size, height: size }}
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImageUpload} 
        className="hidden" 
        accept="image/png, image/jpeg, image/gif"
      />
      {hasImage ? (
        <img src={config.theme.userAvatar} alt="User Avatar" className="w-full h-full object-cover rounded-full" />
      ) : (
        <AudreyIcon size={size} className="w-full h-full" />
      )}
    </div>
  );
};
`;

code = code.replace(/\/\/ --- ICONS & COMPONENTS ---/, "// --- ICONS & COMPONENTS ---\n" + newComponents);

// Replace Heart -> KissMark in navbar and wishlist and detail
code = code.replace(/<Heart /g, '<KissMark ');
code = code.replace(/<ShoppingBag size=\{20\} /g, '<MultipleBags size={20} ');

// Replace AudreyIcon used in user profile mapping with UploadableAvatar
code = code.replace(/<AudreyIcon size=\{20\}/g, '<UploadableAvatar size={20}');
// in the login modal, use UploadableAvatar with size 80
code = code.replace(/<AudreyIcon size=\{80\}/g, '<UploadableAvatar size={80}');

// Remove the big blank space between main banner and navbar
// that is probably "pt-[104px]" or something in the Page Content area
// in App.tsx: Navbar is fixed or sticky? Let's fix that later, we can just run the replacements first.
fs.writeFileSync('src/App.tsx', code);
