const fs = require('fs');
const path = 'frontend/auction/auction-detail.html';
let content = fs.readFileSync(path, 'utf8');

// Replace malformed onclick
content = content.replace(
  'if(window.bmExploreModal){window.bmExploreModal.open()=>window.location.reload()});}else{window.location.href=\'/auth/login.html\';}',
  'window.location.href=\'/auth/login.html\';'
);

fs.writeFileSync(path, content, 'utf8');
console.log('Cleaned up auction-detail.html successfully');

