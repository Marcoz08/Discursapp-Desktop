import { app, BrowserWindow } from 'electron';
import http from 'http';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import squirrelStartup from 'electron-squirrel-startup';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

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

      if (response.statusCode === 200) {
        resolve();
        return;
      }

      scheduleRetry();
    });

    request.on('error', () => {
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
  // Iniciamos el servidor backend (server.js) dentro del proceso principal
  const serverScriptPath = getServerScriptPath();

  try {
    console.log('Iniciando backend local:', serverScriptPath);
    await import(pathToFileURL(serverScriptPath).href);
  } catch (err) {
    console.error('Error al cargar el servidor backend:', err);
  }

  try {
    await waitForServerReady();
    createWindow();
  } catch (error) {
    console.error('No se pudo iniciar el backend:', error);
    createWindow();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// El backend corre en el mismo proceso principal.
app.on('before-quit', () => {
  // Ningún subproceso adicional que limpiar.
});