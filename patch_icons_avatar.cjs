const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const updatedUploadableAvatar = `
const UploadableAvatar = ({ size = 20, className = "" }) => {
  const { config, updateField, isEditMode } = useEditor();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentSize = config?.theme?.iconSizes?.['userAvatar'] || size;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
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

  const triggerUpload = (e: React.MouseEvent) => {
    if (isEditMode && fileInputRef.current) {
      e.stopPropagation();
      fileInputRef.current.click();
    }
  };

  const hasImage = config?.theme?.userAvatar;

  return (
    <div 
      className={\`\${className} \${isEditMode ? 'cursor-pointer hover:ring-2 ring-blue-400 rounded-full group' : ''} relative inline-flex justify-center items-center\`} 
      onClick={triggerUpload}
      title={isEditMode ? "Click to change avatar. Use +/- to resize." : ""}
      style={{ width: currentSize, height: currentSize }}
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImageUpload} 
        className="hidden" 
        accept="image/png, image/jpeg, image/gif"
      />
      {hasImage ? (
        <img src={hasImage} alt="User Avatar" className="w-full h-full object-cover rounded-full" />
      ) : (
        <AudreyIcon size={currentSize} className="w-full h-full" />
      )}
      
      {isEditMode && (
        <div 
          className="absolute top-full mt-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 flex items-center gap-1 bg-black text-white rounded-md shadow-2xl p-1 z-[9999] pointer-events-auto transition-opacity" 
          onClick={e => e.stopPropagation()}
        >
           <button 
             onClick={(e) => { e.stopPropagation(); updateField('theme.iconSizes.userAvatar', Math.max(10, currentSize - 4)); }} 
             className="w-6 h-6 flex items-center justify-center text-xs hover:bg-gray-800 rounded text-gray-300"
           >-</button>
           <span className="text-[10px] w-6 text-center">{currentSize}</span>
           <button 
             onClick={(e) => { e.stopPropagation(); updateField('theme.iconSizes.userAvatar', Math.min(200, currentSize + 4)); }} 
             className="w-6 h-6 flex items-center justify-center text-xs hover:bg-gray-800 rounded text-gray-300"
           >+</button>
        </div>
      )}
    </div>
  );
};
`;

code = code.replace(/const UploadableAvatar = \(\{ size = 20, className = "" \}\) => \{[\s\S]*?\}\);\n};\n/m, updatedUploadableAvatar);

fs.writeFileSync('src/App.tsx', code);
