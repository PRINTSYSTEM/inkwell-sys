const fs = require('fs');
const filePath = 'src/pages/stock/StockInCreate.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Header gradient
content = content.replace(/bg-gradient-to-br from-blue-500 to-indigo-600/g, 'bg-gradient-to-br from-[#93631F] to-[#7a521a]');
content = content.replace(/from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700/g, 'from-[#93631F] to-[#7a521a] hover:opacity-90');
content = content.replace(/shadow-blue-500\/25/g, 'shadow-[#93631F]/25');

// Section gradients
content = content.replace(/bg-gradient-to-r from-blue-500\/5 via-indigo-500\/5 to-purple-500\/5/g, 'bg-gradient-to-r bg-[#93631F]/5');
content = content.replace(/bg-blue-500\/10/g, 'bg-[#93631F]/10');
content = content.replace(/text-blue-600/g, 'text-[#93631F]');
content = content.replace(/bg-blue-50/g, 'bg-[#93631F]/5');
content = content.replace(/border-blue-200/g, 'border-[#93631F]/20');
content = content.replace(/text-blue-500/g, 'text-[#93631F]');
content = content.replace(/hover:bg-blue-500/g, 'hover:bg-[#93631F]');
content = content.replace(/hover:bg-blue-50/g, 'hover:bg-[#93631F]/10');
content = content.replace(/focus:border-blue-500/g, 'focus:border-[#93631F]');
content = content.replace(/focus:ring-blue-500\/20/g, 'focus:ring-[#93631F]/20');
content = content.replace(/border-blue-500/g, 'border-[#93631F]');

fs.writeFileSync(filePath, content);
console.log('Done!');

