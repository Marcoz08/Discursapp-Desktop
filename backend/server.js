import express from 'express';           // Framework para crear el servidor web y manejar rutas
import bodyParser from 'body-parser';    // Middleware para procesar el cuerpo de las peticiones JSON
import cors from 'cors';                 // Middleware para permitir peticiones desde otros dominios (el frontend)
import dotenv from 'dotenv';
import pool from './config/db.js';

import * as oradoresController from './controllers/oradores.js';
import * as bosquejosController from './controllers/bosquejos.js';
import * as visitantesController from './controllers/visitantes.js';
import * as agendaController from './controllers/agenda.js';
import * as salidasController from './controllers/salidas.js';

dotenv.config();

const app = express();
const port = 3000; // Puerto donde correrá el servidor localmente

/////////////////////////// BACKEND PAGINA registros.html ////////////////////////////////////////

/*
ESTRUCTURA DE LA TABLA EN SQL:
Tabla: lista_bosquejos
Columnas:
  - num: INT PRIMARY KEY (Número de bosquejo o discurso)
  - titulo: VARCHAR(255) (Título del discurso)
  - fecha_ult: DATE (Última fecha en que se presentó)
  - fecha_ant: DATE (Registro histórico de la ultima fecha que se presentó )
*/

// Middleware
app.use(cors()); // Habilita CORS para que tu navegador no bloquee las peticiones al API
app.use(bodyParser.json()); // Configura el servidor para entender datos en formato JSON

console.log('💻 Servidor en modo: LOCAL (SQLite)');

// Rutas API

// Ruta para obtener todos los bosquejos y mostrarlos en la página
app.get('/api/bosquejos', bosquejosController.getBosquejos);

// Ruta para actualizar la fecha de un bosquejo
app.put('/api/bosquejos/:num', bosquejosController.updateBosquejo);
/////////////////////////// FIN BACKEND PAGINA registros.html ////////////////////////////////////////

/////////////////////////// BACKEND PAGINA oradores.html ////////////////////////////////////////////
/*ESTRUCTURA DE LA TABLA EN SQL:
Tabla: oradores
Columnas:
  - id_orador: INT, AUTO_INCREMENT, PRIMARY KEY (ID interno generado por el sistema.)
  - nombre: VARCHAR(100), NOT NULL (Nombre completo del orador.)
  - telefono: VARCHAR(20), NULL (Número de contacto.) 
  - privilegio: BOOLEAN, DEFAULT TRUE ('TRUE' para Ancianos, 'FALSE' para Siervos Ministeriales.)
  - congregacion: VARCHAR(100), DEFAULT 'El Castillo' (Nombre de la congregación de origen.)
  - aprobado: BOOLEAN, DEFAULT NULL (Si esta aprovado "TRUE"puede salir a discursar)

Tabla: temas_orador
Columnas:
  - id_registro: INT, AUTO_INCREMENT, PRIMARY KEY (ID único)
  - id_orador: INT, FOREIGN KEY 'oradores' (Vinculación con el hermano presentador del tema.)
  - numero_tema: INT, FOREIGN KEY 'lista_bosquejos' (Número del bosquejo oficial, puede ser NULL)
  - titulo: VARCHAR(255), NULL (Título del discurso, puede ser manual para temas nuevos o automático) 
  - cancion_sugerida: INT, NULL (Número de canción preferida por el orador para ese tema.)
*/

// Ruta para obtener oradores con sus temas
app.get('/api/oradores-temas', oradoresController.getOradoresTemas);

// Ruta para eliminar un orador y todos sus temas asociados
app.delete('/api/oradores/:id', oradoresController.deleteOrador);

// Ruta para añadir un nuevo orador
app.post('/api/oradores', oradoresController.createOrador);

// Ruta para actualizar los datos de un orador
app.put('/api/oradores/:id', oradoresController.updateOrador);

// Ruta para eliminar un tema específico por su ID de registro
app.delete('/api/temas-orador/:id', oradoresController.deleteTema);

// Ruta para añadir un nuevo tema a un orador específico
app.post('/api/temas-orador', oradoresController.createTema);

// Ruta para actualizar un tema específico por su ID de registro
app.put('/api/temas-orador/:id', oradoresController.updateTema);
/////////////////////////// FIN BACKEND PAGINA oradores.html ////////////////////////////////////////

/////////////////////////// BACKEND PAGINA visitantes.html ////////////////////////////////////////////

// Ruta para obtener los datos de la reunión local
app.get('/api/reunion-local', visitantesController.getReunionLocal);

// Ruta para actualizar los datos de la reunión local
app.put('/api/reunion-local/:id', visitantesController.updateReunionLocal);

// Ruta para obtener la programación de visitantes filtrada por mes y año
app.get('/api/visitantes-programacion', visitantesController.getVisitantesProgramacion);

// Ruta para guardar o actualizar la programación completa de un mes
app.post('/api/visitantes-programacion', visitantesController.saveVisitantesProgramacion);

/////////////////////////// FIN BACKEND PAGINA visitantes.html ////////////////////////////////////////

/////////////////////////// BACKEND PAGINA agenda.html ////////////////////////////////////////////

// Ruta para obtener los registros de la agenda filtrados por año
app.get('/api/agenda', agendaController.getAgenda);

// Ruta para guardar un nuevo acuerdo
app.post('/api/agenda', agendaController.createAgenda);

// Ruta para actualizar un acuerdo existente
app.put('/api/agenda/:id', agendaController.updateAgenda);

// Ruta para eliminar un acuerdo
app.delete('/api/agenda/:id', agendaController.deleteAgenda);

// Ruta para confirmar asistencia de un orador visitante y actualizar historial del bosquejo
app.post('/api/confirmar-asistencia', visitantesController.confirmarAsistencia);

/////////////////////////// BACKEND PAGINA salidas.html ////////////////////////////////////////

// Ruta para obtener programación de salidas (JOIN relacional)
app.get('/api/salidas-programacion', salidasController.getSalidasProgramacion);

// Ruta para guardar/actualizar programación de salidas
app.post('/api/salidas-programacion', salidasController.saveSalidasProgramacion);

// Ruta para obtener el acuerdo confirmado para una salida específica (mes/año)
app.get('/api/agenda/confirmada', agendaController.getAgendaConfirmada);

// Endpoint para el dashboard: Obtener el visitante de la semana actual
app.get('/api/dashboard/visitante-semana', visitantesController.getVisitanteSemana);

// Endpoint para el dashboard: Obtener la salida de la semana actual
app.get('/api/dashboard/salida-semana', salidasController.getSalidaSemana);

// Endpoint para el dashboard: Obtener los últimos 5 discursos presentados
app.get('/api/dashboard/ultimos-discursos', bosquejosController.getUltimosDiscursos);

/////////////////////////// FIN BACKEND PAGINA salidas.html ////////////////////////////////////////

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});