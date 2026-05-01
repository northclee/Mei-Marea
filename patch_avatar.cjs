const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const avatarCode = `
const UploadableAvatar = ({ size = 20, className = "" }) => {
  const { config, updateField, isEditMode } = useEditor();
  const inputId = React.useId();

  const currentSize = config?.theme?.iconSizes?.['userAvatar'] || size;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const file = e.target.files?.[0];
    if (file) {
      compressImage(file, (base64String) => {
        updateField('theme.userAvatar', base64String);
      });
    }
  };

  const hasImage = config?.theme?.userAvatar;

  const content = (
    <div 
      className={\`\${className} \${isEditMode ? 'cursor-pointer hover:ring-2 ring-blue-400 rounded-full group/icon' : ''} relative inline-flex justify-center items-center\`} 
      title={isEditMode ? "Click to change avatar. Use +/- to resize." : ""}
      style={{ width: currentSize, height: currentSize }}
    >
      {isEditMode && (
        <input 
          id={inputId}
          type="file" 
          onChange={handleImageUpload} 
          className="hidden" 
          accept="image/png, image/jpeg, image/gif"
        />
      )}
      {hasImage ? (
        <img src={hasImage} alt="User Avatar" className="w-full h-full object-cover rounded-full" />
      ) : (
        <AudreyIcon size={currentSize} className="w-full h-full" />
      )}
      
      {isEditMode && (
        <div 
          className="absolute top-[80%] left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black text-white rounded shadow-2xl p-1 z-[9999] pointer-events-auto opacity-0 invisible group-hover/icon:opacity-100 group-hover/icon:visible transition-all group-hover/icon:translate-y-2 cursor-default" 
          onClick={(e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); }}
        >
           <div 
             onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateField('theme.iconSizes.userAvatar', Math.max(10, currentSize - 4)); }} 
             className="w-6 h-6 flex items-center justify-center text-xs hover:bg-gray-800 rounded text-gray-300 cursor-pointer pointer-events-auto"
           >-</div>
           <span className="text-[10px] w-6 text-center">{currentSize}</span>
           <div 
             onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateField('theme.iconSizes.userAvatar', Math.min(200, currentSize + 4)); }} 
             className="w-6 h-6 flex items-center justify-center text-xs hover:bg-gray-800 rounded text-gray-300 cursor-pointer pointer-events-auto"
           >+</div>
        </div>
      )}
    </div>
  );

  return isEditMode ? <label htmlFor={inputId} className="cursor-pointer inline-block" onClick={e => e.stopPropagation()}>{content}</label> : content;
};
`;

code = code.replace("const AudreyIcon = ", avatarCode + "\n\nconst AudreyIcon = ");

fs.writeFileSync('src/App.tsx', code);
