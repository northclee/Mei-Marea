const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const replacementUploadableIcon = `
const UploadableIcon = ({ iconId, fallback: Fallback, size = 20, className = "", fill, strokeWidth, ...props }: any) => {
  const { config, updateField, isEditMode } = useEditor();
  const inputId = React.useId();

  const currentSize = config?.theme?.iconSizes?.[iconId] || size;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const file = e.target.files?.[0];
    if (file) {
      compressImage(file, (base64String) => {
        updateField(\`theme.icons.\${iconId}\`, base64String);
      });
    }
  };

  const hasImage = config?.theme?.icons?.[iconId];

  const content = (
    <div 
      className={\`\${className} \${isEditMode ? 'cursor-pointer hover:ring-2 ring-blue-400 rounded-lg group/icon' : ''} inline-flex items-center justify-center relative\`} 
      title={isEditMode ? "Click to change icon. Use +/- to resize." : ""}
      style={{ width: currentSize, height: currentSize }}
    >
      {isEditMode && (
        <input 
          id={inputId}
          type="file" 
          onChange={handleImageUpload} 
          className="hidden" 
          accept="image/png, image/jpeg, image/gif, image/svg+xml"
        />
      )}
      {hasImage ? (
        <img src={hasImage} alt={\`Icon \${iconId}\`} className="w-full h-full object-contain" />
      ) : (
        <Fallback size={currentSize} className="w-full h-full" fill={fill} strokeWidth={strokeWidth} {...props} />
      )}

      {isEditMode && (
        <div 
          className="absolute top-[80%] left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black text-white rounded shadow-2xl p-1 z-[9999] pointer-events-auto opacity-0 invisible group-hover/icon:opacity-100 group-hover/icon:visible transition-all group-hover/icon:translate-y-2 cursor-default"
          onClick={(e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); }}
        >
           <div 
             onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateField(\`theme.iconSizes.\${iconId}\`, Math.max(10, currentSize - 4)); }} 
             className="w-6 h-6 flex items-center justify-center text-xs hover:bg-gray-800 rounded text-gray-300 cursor-pointer pointer-events-auto"
           >-</div>
           <span className="text-[10px] w-6 text-center">{currentSize}</span>
           <div 
             onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateField(\`theme.iconSizes.\${iconId}\`, Math.min(200, currentSize + 4)); }} 
             className="w-6 h-6 flex items-center justify-center text-xs hover:bg-gray-800 rounded text-gray-300 cursor-pointer pointer-events-auto"
           >+</div>
        </div>
      )}
    </div>
  );

  return isEditMode ? <label htmlFor={inputId} className="cursor-pointer inline-block" onClick={e => e.stopPropagation()}>{content}</label> : content;
};
`;

code = code.replace(/const UploadableIcon = \(\{ iconId, fallback: Fallback, size = 20, className = "", fill, strokeWidth, \.\.\.props \}: any\) => \{[\s\S]*?;\n};\n/m, replacementUploadableIcon);

fs.writeFileSync('src/App.tsx', code);
