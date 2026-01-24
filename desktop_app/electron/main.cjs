const path = require("path");
const { app, BrowserWindow, ipcMain } = require("electron");
const { spawn } = require("child_process");
const fs = require("fs");
const os = require("os");

// --- LOGGING SETUP ---
const logFile = path.join(app.getPath("userData"), "app_debug.log");
function log(msg) {
  const time = new Date().toISOString();
  const entry = `[${time}] ${msg}\n`;
  console.log(entry.trim());
  fs.appendFileSync(logFile, entry);
}

log("-----------------------------------------");
log("App Starting...");
log(`UserData Path: ${app.getPath("userData")}`);
log(`Resources Path: ${process.resourcesPath}`);

let backendProcess = null;
let mainWindow = null;

function getBackendPath() {
  const isDev = !app.isPackaged;
  if (isDev) {
    // Attempt to find venv python
    const venvPython = path.join(__dirname, "..", "..", "backend", "venv", "Scripts", "python.exe");
    if (fs.existsSync(venvPython)) {
      log("Dev Mode: Found venv python");
      return { cmd: venvPython, args: ["main.py"], cwd: path.join(__dirname, "..", "..", "backend") };
    }
    log("Dev Mode: venv python not found, trying system 'python'");
    return { cmd: "python", args: ["main.py"], cwd: path.join(__dirname, "..", "..", "backend") };
  } else {
    // Production
    // We expect the backend folder to be at resources/backend
    const backendDir = path.join(process.resourcesPath, "backend");
    const exePath = path.join(backendDir, "main.exe");

    log(`Checking for backend at: ${exePath}`);
    if (fs.existsSync(exePath)) {
      return { cmd: exePath, args: [], cwd: backendDir };
    }

    // Fallback/Debug check
    // Sometimes boilerplate puts it elsewhere, log directory listing if missing
    try {
      log(`Backend MISSING. Listing contents of ${process.resourcesPath}:`);
      fs.readdirSync(process.resourcesPath).forEach(f => log(` - ${f}`));
    } catch (e) { log(`Error listing resources: ${e.message}`); }

    return null;
  }
}

function startBackend() {
  log("Attempting to start backend...");

  if (process.env.SKIP_BACKEND === "true") {
    log("SKIP_BACKEND set. Skipping spawn.");
    return;
  }

  const config = getBackendPath();
  if (!config) {
    log("CRITICAL: Backend executable not found.");
    return;
  }

  log(`Spawning: ${config.cmd} ${config.args.join(" ")} in ${config.cwd}`);

  try {
    backendProcess = spawn(config.cmd, config.args, {
      cwd: config.cwd,
      detached: false, // Keep attached so we can kill it easily
      shell: false
      // stdio: 'pipe' by default
    });

    backendProcess.stdout.on("data", (data) => {
      log(`[BACKEND STDOUT]: ${data.toString().trim()}`);
    });

    backendProcess.stderr.on("data", (data) => {
      log(`[BACKEND STDERR]: ${data.toString().trim()}`);
    });

    backendProcess.on("error", (err) => {
      log(`[BACKEND SPAWN ERROR]: ${err.message}`);
    });

    backendProcess.on("close", (code) => {
      log(`[BACKEND EXIT] Code: ${code}`);
    });

  } catch (e) {
    log(`EXCEPTION spawning backend: ${e.message}`);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const isDev = !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    const indexPath = path.join(__dirname, "..", "dist", "index.html");
    log(`Loading frontend from: ${indexPath}`);
    mainWindow.loadFile(indexPath);
  }

  mainWindow.on('closed', () => mainWindow = null);
}

app.whenReady().then(() => {
  startBackend();
  createWindow();

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  log("App closing...");
  if (backendProcess) {
    log("Killing backend...");
    backendProcess.kill();
  }
  if (process.platform !== "darwin") app.quit();
});
