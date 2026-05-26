import { app, BrowserWindow } from 'electron';
import { fork } from 'child_process';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let serverProcess;

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1100,
    height: 780
  })

  win.loadFile('src/pages/home.html')
}

const waitForServerReady = () => new Promise((resolve, reject) => {
  if (!serverProcess) {
    reject(new Error('No se pudo iniciar el proceso del servidor backend'));
    return;
  }

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

  serverProcess.on('exit', (code) => {
    reject(new Error(`El backend finalizó antes de estar listo. Código: ${code}`));
  });

  checkServer();
});

app.whenReady().then(async () => {
  // Iniciamos el servidor backend (server.js) como un subproceso
  // path.join asegura que la ruta funcione correctamente en cualquier sistema operativo
  serverProcess = fork(path.join(__dirname, 'backend', 'server.js'));

  serverProcess.on('error', (err) => {
    console.error('Error al iniciar el servidor backend:', err);
  });

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
  // Matamos el proceso del servidor si existe al cerrar las ventanas
  if (serverProcess) serverProcess.kill();
  
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Aseguramos la limpieza del proceso en cualquier caso de salida
app.on('before-quit', () => {
  if (serverProcess) serverProcess.kill();
});