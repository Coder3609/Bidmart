/**
 * Windows-friendly project launcher.
 * Run with: node start.js
 */
const path = require('path');
const dotenv = require('./backend/node_modules/dotenv');

const backendDir = path.join(__dirname, 'backend');
dotenv.config({ path: path.join(backendDir, '.env') });

function launch() {
  process.chdir(backendDir);
  require('./backend/server');
}

launch();
