import express from 'express';           // Framework para crear el servidor web y manejar rutas
import bodyParser from 'body-parser';    // Middleware para procesar el cuerpo de las peticiones JSON
import cors from 'cors';                 // Middleware para permitir peticiones desde otros dominios (el frontend)
import dotenv from 'dotenv';
import router from './routes/routes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const port = 3000;       // Puerto donde correrá el servidor localmente

// Middleware
app.use(cors());              // Habilita CORS para que tu navegador no bloquee las peticiones al API
app.use(bodyParser.json());   // Configura el servidor para entender datos en formato JSON

console.log('<-- Servidor en modo: LOCAL (SQLite) -->');

app.use('/api', router);

// Middlewar de manejo de errores (deben ir después de las rutas)
app.use(notFoundHandler);
app.use(errorHandler);

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});