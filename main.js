import { app, BrowserWindow } from 'electron';
import { fork } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let serverProcess;

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600
  })

  win.loadFile('src/pages/home.html')
}

app.whenReady().then(() => {
  // Iniciamos el servidor backend (server.js) como un subproceso
  // path.join asegura que la ruta funcione correctamente en cualquier sistema operativo
  serverProcess = fork(path.join(__dirname, 'backend', 'server.js'));

  serverProcess.on('error', (err) => {
    console.error('Error al iniciar el servidor backend:', err);
  });

  createWindow()

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