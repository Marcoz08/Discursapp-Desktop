import express from 'express'; // Framework para crear el servidor web y manejar rutas
import bodyParser from 'body-parser'; // Middleware para procesar el cuerpo de las peticiones JSON
import cors from 'cors'; // Middleware para permitir peticiones desde otros dominios (el frontend)
import dotenv from 'dotenv';
import pool from './config/db.js';

import * as oradoresController from './controllers/oradores.js';
import * as bosquejosController from './controllers/bosquejos.js';
import * as visitantesController from './controllers/visitantes.js';
import * as agendaController from './controllers/agenda.js';

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
/*ESTRUCTURA DE LA TABLA EN SQL:
Tabla: salidas_discursar (Almacena el orador y los datos necesarios para sus salida a discursar)
Columnas:
  - id_registro: Tipo: INT NOT NULL Descipcion: (Dato proveniente de la tabla temas_orador, nos regresa el nombre del orador "id_orador", numero_tema, titulo y cancion sugerida)
  - id_rol: Tipo INT Descripcion: Se relaciona con la tabla agenda y nos dice a cual rol pertenece la salida.
  - fecha_salida: Tipo DATE Descripcion: Nos indica la fecha programada para la salida a discursar.
  - id_orador: Tipo INT Descripcion: se relaciona con tabla oradores, nos da los datos del discursante
*/

// Ruta para obtener programación de salidas (JOIN relacional)
app.get('/api/salidas-programacion', async (req, res) => {
    const { mes, anio } = req.query;
    try {
        const query = `
            SELECT 
                s.id_registro, s.id_rol, s.fecha_salida, s.id_orador,
                o.nombre AS nombre_orador,
                t.numero_tema AS num_bosquejo,
                t.titulo AS tema,
                t.cancion_sugerida AS cancion
            FROM salidas_discursar s
            JOIN oradores o ON s.id_orador = o.id_orador
            JOIN temas_orador t ON s.id_registro = t.id_registro
            WHERE CAST(strftime('%m', s.fecha_salida) AS INTEGER) = ? AND CAST(strftime('%Y', s.fecha_salida) AS INTEGER) = ?
        `;
        const [rows] = await pool.query(query, [parseInt(mes) + 1, parseInt(anio)]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Ruta para guardar/actualizar programación de salidas
app.post('/api/salidas-programacion', async (req, res) => {
    const { mes, anio, programacion } = req.body;
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        // Limpiar registros del mes para evitar duplicados
        await connection.query(
            "DELETE FROM salidas_discursar WHERE CAST(strftime('%m', fecha_salida) AS INTEGER) = ? AND CAST(strftime('%Y', fecha_salida) AS INTEGER) = ?",
            [parseInt(mes) + 1, parseInt(anio)]
        );

        const values = programacion.map(p => [
            p.id_registro, p.id_rol, p.fecha_salida, p.id_orador
        ]);

        if (values.length > 0) {
            const placeholders = values.map(() => '(?, ?, ?, ?)').join(', ');
            const flatValues = values.flat();
            const query = `INSERT INTO salidas_discursar (id_registro, id_rol, fecha_salida, id_orador) VALUES ${placeholders}`;
            await connection.query(query, flatValues);
        }
        await connection.commit();
        res.json({ message: "Programación de salidas actualizada correctamente" });
    } catch (err) {
        await connection.rollback();
        console.error('Error al guardar salidas:', err);
        res.status(500).json({ error: err.message });
    } finally { connection.release(); }
});


// Ruta para obtener el acuerdo confirmado para una salida específica (mes/año)
app.get('/api/agenda/confirmada', agendaController.getAgendaConfirmada);

// Endpoint para el dashboard: Obtener el visitante de la semana actual
app.get('/api/dashboard/visitante-semana', async (req, res) => {
    try {
        const query = `
            SELECT nombre, tema, fecha_discurso 
            FROM oradores_visitantes 
            WHERE strftime('%W', fecha_discurso) = strftime('%W', 'now', 'localtime')
              AND strftime('%Y', fecha_discurso) = strftime('%Y', 'now', 'localtime')
            LIMIT 1
        `;
        const [rows] = await pool.query(query);
        res.json(rows.length > 0 ? rows[0] : null);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Endpoint para el dashboard: Obtener la salida de la semana actual
app.get('/api/dashboard/salida-semana', async (req, res) => {
    try {
        const query = `
            SELECT o.nombre, t.titulo, s.fecha_salida
            FROM salidas_discursar s
            JOIN oradores o ON s.id_orador = o.id_orador
            JOIN temas_orador t ON s.id_registro = t.id_registro
            WHERE strftime('%W', s.fecha_salida) = strftime('%W', 'now', 'localtime')
              AND strftime('%Y', s.fecha_salida) = strftime('%Y', 'now', 'localtime')
            LIMIT 1
        `;
        const [rows] = await pool.query(query);
        res.json(rows.length > 0 ? rows[0] : null);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Endpoint para el dashboard: Obtener los últimos 5 discursos presentados
app.get('/api/dashboard/ultimos-discursos', async (req, res) => {
    try {
        const query = `
            SELECT num, titulo, fecha_ult 
            FROM lista_bosquejos 
            WHERE fecha_ult IS NOT NULL 
            ORDER BY fecha_ult DESC 
            LIMIT 5
        `;
        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/////////////////////////// FIN BACKEND PAGINA salidas.html ////////////////////////////////////////

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});