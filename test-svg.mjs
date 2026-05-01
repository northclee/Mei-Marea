import fs from 'fs';

const svg = `
<svg width="24" height="24" viewBox="-15 -15 130 130" fill="none" xmlns="http://www.w3.org/2000/svg">
  {/* Outer circle */}
  <circle cx="50" cy="50" r="60" stroke="#a3a3a3" strokeWidth="4" fill="none" />
  
  {/* Shoulders / Arms */}
  <path d="M 28 85 C 18 85, 14 92, 14 110 L 28 110 Z" fill="#000" />
  <path d="M 72 85 C 82 85, 86 92, 86 110 L 72 110 Z" fill="#000" />
  <path d="M 30 85 C 18 85, 14 92, 14 110" stroke="#000" strokeWidth="3" fill="none" />
  <path d="M 70 85 C 82 85, 86 92, 86 110" stroke="#000" strokeWidth="3" fill="none" />

  {/* Body (Dress) */}
  <path d="M 30 110 C 30 75, 37 72, 50 72 C 63 72, 70 75, 70 110 Z" fill="#000" />
  
  {/* Neck */}
  <path d="M 43 54 L 43 72 M 57 54 L 57 72" stroke="#000" strokeWidth="3" fill="none" />

  {/* Face Base */}
  <path d="M 38 45 C 38 70, 62 70, 62 45 Z" fill="#fff" stroke="#000" strokeWidth="2" />

  {/* Earrings */}
  <circle cx="35" cy="56" r="3" fill="#000" />
  <circle cx="65" cy="56" r="3" fill="#000" />
  <path d="M 35 55 L 35 50 M 65 55 L 65 50" stroke="#000" strokeWidth="2" />

  {/* Sunglasses */}
  <path d="M 33 46 C 36 41, 47 41, 49 46 L 49 52 C 47 58, 36 58, 33 52 Z" fill="#000" />
  <path d="M 67 46 C 64 41, 53 41, 51 46 L 51 52 C 53 58, 64 58, 67 52 Z" fill="#000" />
  <path d="M 49 46 Q 50 44 51 46" stroke="#000" strokeWidth="2" fill="none" />
  
  {/* Lips */}
  <path d="M 46 60 Q 50 63 54 60 Q 50 64 46 60 Z" fill="#000" />

  {/* Pearl Necklace */}
  <circle cx="40" cy="67" r="3" fill="#000" />
  <circle cx="45" cy="70" r="3.5" fill="#000" />
  <circle cx="50" cy="71" r="4" fill="#000" />
  <circle cx="55" cy="70" r="3.5" fill="#000" />
  <circle cx="60" cy="67" r="3" fill="#000" />

  {/* Hat Base */}
  <ellipse cx="50" cy="38" rx="65" ry="14" fill="#000" />
  <path d="M 26 38 C 29 6, 71 6, 74 38 Z" fill="#000" />
  <path d="M 27 28 L 73 28 L 74 34 L 26 34 Z" fill="#fff" />
  
  {/* Bow */}
  <path d="M 60 32 C 70 20, 85 28, 75 36 C 68 38, 62 35, 60 32 Z" fill="#000" />
  <path d="M 65 26 C 70 24, 75 28, 70 32 L 67 31 Z" fill="#fff" />
</svg>
`;

fs.writeFileSync('test-svg.svg', svg.replace(/\{([^}]+)\}/g, ''));
