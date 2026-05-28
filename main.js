import { app, BrowserWindow } from 'electron';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import squirrelStartup from 'electron-squirrel-startup';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let logFile;

// ----- Logger a archivo para debug en producción -----
const initLogger = () => {
  const logDir = app.getPath('userData');
  logFile = path.join(logDir, 'discursapp-debug.log');
  fs.writeFileSync(logFile, `=== DiscursApp iniciado: ${new Date().toISOString()} ===\n`);
};

const log = (...args) => {
  const line = `[${new Date().toISOString()}] ${args.join(' ')}\n`;
  console.log(...args);
  if (logFile) {
    try { fs.appendFileSync(logFile, line); } catch (_) {}
  }
};

const logError = (...args) => {
  const line = `[${new Date().toISOString()}] ERROR: ${args.map(a => (a instanceof Error ? a.stack : String(a))).join(' ')}\n`;
  console.error(...args);
  if (logFile) {
    try { fs.appendFileSync(logFile, line); } catch (_) {}
  }
};
// ------------------------------------------------------

if (squirrelStartup) {
  app.quit();
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
  process.exit(0);
}

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.focus();
  }
});

const getServerScriptPath = () => {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'app.asar.unpacked', 'backend', 'server.js');
  }
  return path.join(__dirname, 'backend', 'server.js');
};

const createWindow = () => {
  if (mainWindow) {
    return;
  }

  mainWindow = new BrowserWindow({
    width: 1100,
    height: 780,
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.loadFile('src/pages/home.html');
};

const waitForServerReady = () => new Promise((resolve, reject) => {
  const startedAt = Date.now();

  const checkServer = () => {
    const request = http.get('http://localhost:3000/api/reunion-local', (response) => {
      response.resume();
      log('Ping al servidor → status:', response.statusCode);

      if (response.statusCode === 200) {
        resolve();
        return;
      }

      scheduleRetry();
    });

    request.on('error', (err) => {
      log('Servidor aún no disponible:', err.message);
      scheduleRetry();
    });
  };

  const scheduleRetry = () => {
    if (Date.now() - startedAt >= 15000) {
      reject(new Error('Timeout esperando a que el backend esté listo'));
      return;
    }

    setTimeout(checkServer, 300);
  };

  checkServer();
});

app.whenReady().then(async () => {
  initLogger();

  const serverScriptPath = getServerScriptPath();
  log('app.isPackaged:', app.isPackaged);
  log('__dirname:', __dirname);
  log('process.resourcesPath:', process.resourcesPath);
  log('serverScriptPath:', serverScriptPath);
  log('¿Existe server.js?:', fs.existsSync(serverScriptPath));

  // Pasar la ruta de userData al backend via variable de entorno
  if (app.isPackaged) {
    process.env.DISCURSAPP_USER_DATA = app.getPath('userData');
    log('userData path:', process.env.DISCURSAPP_USER_DATA);
  }

  try {
    const finalServerPath = path.join(__dirname, 'backend', 'server.js');
    const serverUrl = pathToFileURL(finalServerPath).href;
    log('Importando servidor desde:', serverUrl);
    await import(serverUrl);
    log('import() del servidor completado sin excepción');
  } catch (err) {
    logError('Error al cargar el servidor backend:', err);
  }

  try {
    log('Esperando que el servidor esté listo...');
    await waitForServerReady();
    log('Servidor listo. Abriendo ventana.');
    createWindow();
  } catch (error) {
    logError('No se pudo iniciar el backend:', error);
    log('Abriendo ventana de todas formas.');
    createWindow();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  log('Aplicación cerrándose.');
});