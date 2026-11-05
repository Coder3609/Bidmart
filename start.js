/**
 * Windows-friendly project launcher.
 * Run with: node start.js
 * This deliberately avoids npm.ps1, which is often blocked by PowerShell's
 * execution policy on fresh Windows installations.
 */
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const mysql = require('./backend/node_modules/mysql2/promise');
const dotenv = require('./backend/node_modules/dotenv');

const backendDir = path.join(__dirname, 'backend');
const required = [
  path.join(backendDir, '.env'),
  path.join(backendDir, 'node_modules', 'express'),
];

const missing = required.filter((file) => !fs.existsSync(file));
function launch() {
  process.chdir(backendDir);
  require('./backend/server');
}

function databaseOptions() {
  return {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'marketplace_db',
  };
}

async function ensureDatabase() {
  const options = databaseOptions();
  let connection;
  try {
    connection = await mysql.createConnection(options);
    await connection.end();
    return;
  } catch (err) {
    if (connection) await connection.end();
    if (err.code !== 'ER_BAD_DB_ERROR') throw err;
  }

  // The configured database does not exist, so it is safe to run the
  // project's fresh-install schema and demo seed. Existing databases are
  // never modified by this launcher.
  console.log(`Creating and seeding missing database "${options.database}"...`);
  const bootstrap = await mysql.createConnection({ ...options, database: undefined, multipleStatements: true });
  try {
    const schema = fs.readFileSync(path.join(__dirname, 'db', 'schema.sql'), 'utf8');
    const seed = fs.readFileSync(path.join(__dirname, 'db', 'seed.sql'), 'utf8');
    await bootstrap.query(schema);
    await bootstrap.query(seed);
    console.log('✔ Database setup complete.');
  } finally {
    await bootstrap.end();
  }
}

async function isMarketplaceAlreadyRunning() {
  const port = process.env.PORT || 5000;
  try {
    const response = await fetch(`http://localhost:${port}/api/health`, { signal: AbortSignal.timeout(1500) });
    if (!response.ok) return false;
    const body = await response.json();
    return body && body.success === true;
  } catch (_) {
    return false;
  }
}

function ask(question) {
  const terminal = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => terminal.question(question, (answer) => {
    terminal.close();
    resolve(answer);
  }));
}

function configuredPassword() {
  if (process.env.DB_PASSWORD) return process.env.DB_PASSWORD;
  const envFile = path.join(backendDir, '.env');
  const line = fs.readFileSync(envFile, 'utf8')
    .split(/\r?\n/)
    .find((entry) => entry.startsWith('DB_PASSWORD='));
  return line ? line.slice('DB_PASSWORD='.length).trim() : '';
}

async function main() {
  if (missing.length) {
  console.error('✘ Setup is incomplete. Run this once from Command Prompt: npm.cmd run install:backend');
  console.error('  Also copy backend/.env.example to backend/.env and configure MySQL.');
  process.exitCode = 1;
    return;
  }

  if (!configuredPassword()) {
    const password = await ask('MySQL root password (input is not saved): ');
    if (!password) {
      console.error('✘ A MySQL password is required. Enter it above, or set DB_PASSWORD in backend/.env.');
      process.exitCode = 1;
      return;
    }
    // dotenv does not replace an existing environment variable, so this is
    // used by the backend for this run without writing a secret to disk.
    process.env.DB_PASSWORD = password;
  }

  dotenv.config({ path: path.join(backendDir, '.env') });
  await ensureDatabase();
  if (await isMarketplaceAlreadyRunning()) {
    console.log(`✔ Marketplace is already running at http://localhost:${process.env.PORT || 5000}`);
    return;
  }
  launch();
}

main().catch((err) => {
  console.error(`✘ Startup failed: ${err.message}`);
  process.exitCode = 1;
});
