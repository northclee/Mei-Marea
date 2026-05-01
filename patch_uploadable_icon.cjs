const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const uploadableIconCode = `
const UploadableIcon = ({ iconId, fallback: Fallback, size = 20, className = "", fill, strokeWidth, ...props }: any) => {
  const { config, updateField, isEditMode } = useEditor();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        updateField(\`theme.icons.\${iconId}\`, base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerUpload = (e: React.MouseEvent) => {
    if (isEditMode && fileInputRef.current) {
      e.preventDefault();
      e.stopPropagation();
      fileInputRef.current.click();
    }
  };

  const hasImage = config?.theme?.icons?.[iconId];

  return (
    <div 
      className={\`\${className} \${isEditMode ? 'cursor-pointer hover:ring-2 ring-blue-400 rounded-full' : ''} inline-flex items-center justify-center relative\`} 
      onClick={triggerUpload}
      title={isEditMode ? "Click to change icon" : ""}
      style={{ width: size, height: size }}
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImageUpload} 
        className="hidden" 
        accept="image/png, image/jpeg, image/gif, image/svg+xml"
      />
      {hasImage ? (
        <img src={hasImage} alt={\`Icon \${iconId}\`} className="w-full h-full object-contain" />
      ) : (
        <Fallback size={size} className="w-full h-full" fill={fill} strokeWidth={strokeWidth} {...props} />
      )}
    </div>
  );
};
`;

code = code.replace(/\/\/ --- ICONS & COMPONENTS ---/, "// --- ICONS & COMPONENTS ---\n" + uploadableIconCode);

fs.writeFileSync('src/App.tsx', code);
