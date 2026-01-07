const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow;
let backendProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const isDev = !app.isPackaged;
  // In dev, Vite runs on 5173. 
  const startUrl = process.env.ELECTRON_START_URL || 'http://localhost:5173';
  
  // If in production, load the index.html from dist
  const prodUrl = `file://${path.join(__dirname, '../dist/index.html')}`;

  mainWindow.loadURL(isDev ? startUrl : prodUrl);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
}

function startBackend() {
  // If SKIP_BACKEND_SPAWN is set, we assume it's running externally
  if (process.env.SKIP_BACKEND_SPAWN === 'true') {
    console.log('Skipping backend spawn (SKIP_BACKEND_SPAWN is set)');
    return;
  }

  const isDev = !app.isPackaged;
  let cmd;
  let args;
  let cwd;

  if (isDev) {
    // DEV MODE: Try to use the venv python
    console.log('Starting Backend in DEV mode...');
    const venvPythonPoints = [
      path.join(__dirname, '../../backend/venv/Scripts/python.exe'), // Windows
      path.join(__dirname, '../../backend/venv/bin/python'),       // Unix
    ];
    
    // We are on Windows, so index 0
    cmd = venvPythonPoints[0];
    
    // Fallback to system python if venv not found (simplification)
    // For now we assume venv exists as per install instructions
    
    args = ['main.py'];
    cwd = path.join(__dirname, '../../backend');
  } else {
    // PROD MODE: Bundled executable
    console.log('Starting Backend in PROD mode...');
    const backendPath = path.join(process.resourcesPath, 'backend_dist', 'main.exe');
    cmd = backendPath;
    args = [];
    cwd = path.dirname(backendPath);
  }

  console.log(`Spawning backend: ${cmd} ${args.join(' ')} in ${cwd}`);

  try {
    backendProcess = spawn(cmd, args, { cwd });

    backendProcess.stdout.on('data', (data) => {
      console.log(`[Backend]: ${data}`);
    });

    backendProcess.stderr.on('data', (data) => {
      console.error(`[Backend Error]: ${data}`);
    });

    backendProcess.on('close', (code) => {
      console.log(`Backend process exited with code ${code}`);
    });
  } catch (e) {
    console.error('Failed to spawn backend:', e);
  }
}

app.whenReady().then(() => {
  startBackend();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (backendProcess) {
    console.log('Killing backend process...');
    backendProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
