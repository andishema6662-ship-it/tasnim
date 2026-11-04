const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');

const isDev = !app.isPackaged;
let mainWindow = null;

function userDataPaths() {
  const root = app.getPath('userData');
  return {
    root,
    dbDir: path.join(root, 'db'),
    docsDir: path.join(root, 'documents'),
    configPath: path.join(root, 'config.json'),
    vaultPath: path.join(root, 'admin.vault.json'),
  };
}

function ensureDirs() {
  const p = userDataPaths();
  fs.mkdirSync(p.dbDir, { recursive: true });
  fs.mkdirSync(p.docsDir, { recursive: true });
  return p;
}

function getTessdataPath() {
  if (isDev) {
    return path.join(__dirname, '..', 'ocr_models', 'fas');
  }
  return path.join(process.resourcesPath, 'tessdata');
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1180,
    minHeight: 720,
    backgroundColor: '#f3f3f3',
    show: false,
    title: 'سندبان — سامانه بایگانی و نویسه‌خوان اسناد',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());

  if (isDev) {
    mainWindow.loadURL('http://127.0.0.1:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

app.whenReady().then(() => {
  ensureDirs();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('app:getPaths', async () => {
  const p = ensureDirs();
  return {
    ...p,
    tessdata: getTessdataPath(),
    version: app.getVersion(),
    offline: true,
  };
});

ipcMain.handle('app:readConfig', async () => {
  const { configPath } = ensureDirs();
  if (!fs.existsSync(configPath)) {
    return {
      installPathHint: 'C:\\\\Program Files\\\\ArchiveOCR',
      repoPath: '',
      ocrLang: 'fas',
      firstRunComplete: false,
    };
  }
  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
});

ipcMain.handle('app:writeConfig', async (_e, config) => {
  const { configPath } = ensureDirs();
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
  return true;
});

ipcMain.handle('auth:hasAdmin', async () => {
  const { vaultPath } = ensureDirs();
  return fs.existsSync(vaultPath);
});

ipcMain.handle('auth:setupAdmin', async (_e, password) => {
  if (!password || password.length < 10) {
    throw new Error('Password too short');
  }
  const { vaultPath } = ensureDirs();
  if (fs.existsSync(vaultPath)) {
    throw new Error('Admin already configured');
  }
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  const recoveryKey = crypto.randomBytes(24).toString('base64url');
  const recoveryHash = crypto
    .scryptSync(recoveryKey, salt, 64)
    .toString('hex');
  const vault = {
    user: 'admin',
    salt,
    hash,
    recoveryHash,
    createdAt: new Date().toISOString(),
  };
  fs.writeFileSync(vaultPath, JSON.stringify(vault, null, 2), 'utf8');
  return { user: 'admin', recoveryKey };
});

ipcMain.handle('auth:login', async (_e, password) => {
  const { vaultPath } = ensureDirs();
  if (!fs.existsSync(vaultPath)) return { ok: false, reason: 'no-admin' };
  const vault = JSON.parse(fs.readFileSync(vaultPath, 'utf8'));
  const hash = crypto.scryptSync(password, vault.salt, 64).toString('hex');
  if (hash !== vault.hash) return { ok: false, reason: 'bad-password' };
  return { ok: true, user: vault.user };
});

ipcMain.handle('auth:recover', async (_e, recoveryKey, newPassword) => {
  const { vaultPath } = ensureDirs();
  if (!fs.existsSync(vaultPath)) return { ok: false, reason: 'no-admin' };
  const vault = JSON.parse(fs.readFileSync(vaultPath, 'utf8'));
  const recoveryHash = crypto
    .scryptSync(recoveryKey, vault.salt, 64)
    .toString('hex');
  if (recoveryHash !== vault.recoveryHash) {
    return { ok: false, reason: 'bad-key' };
  }
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(newPassword, salt, 64).toString('hex');
  const nextKey = crypto.randomBytes(24).toString('base64url');
  const nextRecoveryHash = crypto.scryptSync(nextKey, salt, 64).toString('hex');
  const next = {
    user: 'admin',
    salt,
    hash,
    recoveryHash: nextRecoveryHash,
    createdAt: vault.createdAt,
    recoveredAt: new Date().toISOString(),
  };
  fs.writeFileSync(vaultPath, JSON.stringify(next, null, 2), 'utf8');
  return { ok: true, recoveryKey: nextKey };
});

ipcMain.handle('fs:pickFolder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'createDirectory'],
  });
  if (result.canceled || !result.filePaths[0]) return null;
  return result.filePaths[0];
});

ipcMain.handle('fs:pickImages', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'tif', 'tiff', 'bmp', 'webp'] },
      { name: 'PDF', extensions: ['pdf'] },
    ],
  });
  if (result.canceled) return [];
  return result.filePaths;
});

ipcMain.handle('fs:readFileBase64', async (_e, filePath) => {
  const buf = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase().replace('.', '') || 'png';
  return {
    name: path.basename(filePath),
    path: filePath,
    mime: ext === 'jpg' ? 'image/jpeg' : `image/${ext}`,
    dataUrl: `data:image/${ext === 'jpg' ? 'jpeg' : ext};base64,${buf.toString('base64')}`,
  };
});

ipcMain.handle('fs:saveDocument', async (_e, { id, fileName, dataBase64 }) => {
  const { docsDir } = ensureDirs();
  const safe = String(fileName || id).replace(/[^\w.\u0600-\u06FF-]+/g, '_');
  const dest = path.join(docsDir, `${id}_${safe}`);
  const raw = Buffer.from(String(dataBase64).replace(/^data:[^;]+;base64,/, ''), 'base64');
  fs.writeFileSync(dest, raw);
  return dest;
});

ipcMain.handle('db:readSqlite', async () => {
  const { dbDir } = ensureDirs();
  const dbPath = path.join(dbDir, 'archive.sqlite');
  if (!fs.existsSync(dbPath)) return null;
  return fs.readFileSync(dbPath);
});

ipcMain.handle('db:writeSqlite', async (_e, bytes) => {
  const { dbDir } = ensureDirs();
  const dbPath = path.join(dbDir, 'archive.sqlite');
  fs.writeFileSync(dbPath, Buffer.from(bytes));
  return dbPath;
});

ipcMain.handle('tess:listModels', async () => {
  const dir = getTessdataPath();
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.traineddata'))
    .map((f) => ({
      name: f,
      size: fs.statSync(path.join(dir, f)).size,
      path: path.join(dir, f),
    }));
});

ipcMain.handle('shell:openPath', async (_e, target) => shell.openPath(target));
