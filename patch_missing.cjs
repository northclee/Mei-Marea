const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Remove all UploadableAvatar functions.
code = code.replace(/const UploadableAvatar = \(\{ size = 20, className = "" \}\) => \{[\s\S]*?return isEditMode [\s\S]*?;\n\n};\n/g, "");
code = code.replace(/const UploadableAvatar = \(\{ size = 20, className = "" \}\) => \{[\s\S]*?return isEditMode [\s\S]*?;\n};\n/g, "");

// 2. We'll add KissMark, MultipleBags, and UploadableAvatar right before AudreyIcon
const newComponents = `
const KissMark = ({ size = 20, className = "", fill, ...props }: any) => {
  const isFilled = fill && fill !== "none" && fill !== "transparent";
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} style={{ filter: !isFilled ? 'grayscale(100%) opacity(40%) blur(0.5px)' : 'none', transition: 'all 0.3s' }} xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M50 85 C30 85, 10 70, 10 50 C10 30, 30 20, 50 35 C70 20, 90 30, 90 50 C90 70, 70 85, 50 85 Z" fill={isFilled ? fill : "#cc0000"} stroke="#cc0000" strokeWidth="4"/>
    </svg>
  );
};

const MultipleBags = ({ size = 20, className = "", strokeWidth = 1.2, ...props }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
);

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

code = code.replace("const AudreyIcon = ", newComponents + "\n\nconst AudreyIcon = ");

fs.writeFileSync('src/App.tsx', code);
