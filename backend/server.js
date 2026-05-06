import express from 'express'; // Framework para crear el servidor web y manejar rutas
import mysql from 'mysql2/promise'; // Driver para conectar con MySQL usando promesas (async/await)
import bodyParser from 'body-parser'; // Middleware para procesar el cuerpo de las peticiones JSON
import cors from 'cors'; // Middleware para permitir peticiones desde otros dominios (el frontend)
import dotenv from 'dotenv';

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

// --- CONFIGURACIÓN DE CONEXIÓN (Manual) ---

// OPCIÓN A: Localhost (XAMPP)
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '', // Sin contraseña según tu configuración
    database: 'discursapp',
    port: 3306
};

// OPCIÓN B: Railway (Producción) - Descomenta para usar en la nube
// const dbConfig = process.env.DATABASE_URL;

const pool = mysql.createPool(dbConfig);
// -------------------------------------------

// Mapeo constante de días de la semana para evitar JOINs con tablas innecesarias
const diasSemanaMap = {
    1: 'Lunes',
    2: 'Martes',
    3: 'Miércoles',
    4: 'Jueves',
    5: 'Viernes',
    6: 'Sábado',
    7: 'Domingo'
};

console.log(typeof dbConfig === 'string' ? '🔌 Servidor en modo: PRODUCCIÓN (Railway)' : '💻 Servidor en modo: LOCAL (XAMPP)');

// Rutas API

// Ruta para obtener todos los bosquejos y mostrarlos en la página
app.get('/api/bosquejos', async (req, res) => {
    try {
        // Consulta a la tabla "lista_bosquejos" en Railway
        const [rows] = await pool.query("SELECT * FROM lista_bosquejos ORDER BY num ASC");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Ruta para actualizar la fecha de un bosquejo
app.put('/api/bosquejos/:num', async (req, res) => {
    const { num } = req.params;
    const { fecha_ult, titulo } = req.body;
    console.log(`Petición de actualización para Núm ${num}:`, { fecha_ult, titulo });
    try {
        let result;
        if (titulo !== undefined) {
            [result] = await pool.query("UPDATE lista_bosquejos SET titulo = ? WHERE num = ?", [titulo, num]);
        } else {
            [result] = await pool.query("UPDATE lista_bosquejos SET fecha_ult = ? WHERE num = ?", [fecha_ult || null, num]);
        }

        if (result.affectedRows === 0) return res.status(404).json({ error: "No se encontró el registro con ese número" });
        res.json({ message: "Actualizado con éxito" });
    } catch (err) {
        console.error('Error en la base de datos:', err);
        res.status(500).json({ error: err.message });
    }
});
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
app.get('/api/oradores-temas', async (req, res) => {
    console.log('Petición recibida: GET /api/oradores-temas');
    try {
        const query = `
            SELECT 
                t.id_registro,
                o.id_orador,
                o.nombre, 
                o.telefono,
                o.congregacion, 
                o.privilegio, 
                o.aprobado, -- Incluimos el estado de aprobación en la consulta
                t.numero_tema, 
                t.titulo, 
                t.cancion_sugerida 
            FROM oradores o 
            LEFT JOIN temas_orador t ON o.id_orador = t.id_orador 
            ORDER BY o.nombre ASC;
        `;
        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (err) {
        console.error('Error en /api/oradores-temas:', err);
        res.status(500).json({ error: err.message });
    }
});

// Ruta para eliminar un orador y todos sus temas asociados
app.delete('/api/oradores/:id', async (req, res) => {
    const { id } = req.params;
    const connection = await pool.getConnection(); // Obtenemos conexión para manejar la transacción
    try {
        await connection.beginTransaction(); // Iniciamos la transacción

        // 1. Eliminamos primero los temas asociados (por la relación de llave foránea)
        await connection.query("DELETE FROM temas_orador WHERE id_orador = ?", [id]);

        // 2. Eliminamos al orador de la tabla principal
        const [result] = await connection.query("DELETE FROM oradores WHERE id_orador = ?", [id]);

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ error: "No se encontró el orador para eliminar" });
        }

        await connection.commit(); // Confirmamos los cambios en la BD
        console.log(`Orador ID ${id} eliminado con éxito.`);
        res.json({ message: "Orador y sus temas eliminados correctamente" });
    } catch (err) {
        await connection.rollback(); // Si algo falla, revertimos todo
        console.error('Error al eliminar orador:', err);
        res.status(500).json({ error: err.message });
    } finally {
        connection.release(); // Liberamos la conexión al pool
    }
});

// Ruta para añadir un nuevo orador
app.post('/api/oradores', async (req, res) => {
    const { nombre, telefono, privilegio, congregacion, aprobado } = req.body;

    // Validación básica: el nombre del orador es obligatorio
    if (!nombre) {
        return res.status(400).json({ error: "El nombre del orador es obligatorio." });
    }

    try {
        const query = `
            INSERT INTO oradores (nombre, telefono, privilegio, congregacion, aprobado)
            VALUES (?, ?, ?, ?, ?)
        `;
        const [result] = await pool.query(query, [
            nombre,
            telefono || null, // Permite que el teléfono sea NULL si no se proporciona
            privilegio,       // 1 para Anciano, 0 para Siervo Ministerial
            congregacion || 'El Castillo', // Valor por defecto si no se proporciona
            aprobado          // TRUE o FALSE
        ]);

        res.status(201).json({ message: "Orador añadido con éxito", id_orador: result.insertId });
    } catch (err) {
        console.error('Error al añadir orador:', err);
        res.status(500).json({ error: err.message });
    }
});

// Ruta para actualizar los datos de un orador
app.put('/api/oradores/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, telefono, privilegio, congregacion, aprobado } = req.body;

    if (!nombre) {
        return res.status(400).json({ error: "El nombre es obligatorio." });
    }

    try {
        const query = `
            UPDATE oradores 
            SET nombre = ?, telefono = ?, privilegio = ?, congregacion = ?, aprobado = ? 
            WHERE id_orador = ?
        `;
        const [result] = await pool.query(query, [nombre, telefono, privilegio, congregacion, aprobado, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "No se encontró el orador para actualizar" });
        }

        res.json({ message: "Orador actualizado con éxito" });
    } catch (err) {
        console.error('Error al actualizar orador:', err);
        res.status(500).json({ error: err.message });
    }
});

// Ruta para eliminar un tema específico por su ID de registro
app.delete('/api/temas-orador/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query("DELETE FROM temas_orador WHERE id_registro = ?", [id]);
        res.json({ message: "Tema eliminado con éxito" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Ruta para añadir un nuevo tema a un orador específico
app.post('/api/temas-orador', async (req, res) => {
    const { id_orador, numero_tema, titulo, cancion_sugerida } = req.body;

    if (!id_orador) {
        return res.status(400).json({ error: "El ID del orador es obligatorio." });
    }

    try {
        const query = "INSERT INTO temas_orador (id_orador, numero_tema, titulo, cancion_sugerida) VALUES (?, ?, ?, ?)";
        await pool.query(query, [id_orador, numero_tema || null, titulo || null, cancion_sugerida || null]);
        res.status(201).json({ message: "Tema añadido con éxito" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Ruta para actualizar un tema específico por su ID de registro
app.put('/api/temas-orador/:id', async (req, res) => {
    const { id } = req.params; // id_registro
    const { numero_tema, titulo, cancion_sugerida } = req.body;

    // Construir la cláusula SET dinámicamente según los campos proporcionados en el cuerpo
    let updates = [];
    let params = [];

    if (numero_tema !== undefined) {
        updates.push("numero_tema = ?");
        params.push(numero_tema);
    }
    if (titulo !== undefined) {
        updates.push("titulo = ?");
        params.push(titulo);
    }
    if (cancion_sugerida !== undefined) {
        updates.push("cancion_sugerida = ?");
        params.push(cancion_sugerida);
    }

    if (updates.length === 0) {
        return res.status(400).json({ error: "No se proporcionaron campos para actualizar." });
    }

    params.push(id); // Añadir id_registro al final de los parámetros

    try {
        const query = `UPDATE temas_orador SET ${updates.join(', ')} WHERE id_registro = ?`;
        const [result] = await pool.query(query, params);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "No se encontró el tema con ese ID de registro." });
        }
        res.json({ message: "Tema actualizado con éxito" });
    } catch (err) {
        console.error('Error al actualizar tema:', err);
        res.status(500).json({ error: err.message });
    }
});
/////////////////////////// FIN BACKEND PAGINA oradores.html ////////////////////////////////////////

/////////////////////////// BACKEND PAGINA visitantes.html ////////////////////////////////////////////
/*ESTRUCTURA DE LA TABLA EN SQL:
Tabla: reuniones
Columnas:
  - id_reunion: INT AUTO_INCREMENT, PRIMARY KEY (ID interno generado para identificar la reunion)
  - dia_rp: INT NOT NULL, (Dia de la reunion: 1="Lunes", 2="Martes", etc)
  - hora_reunion: TIME DEFAULT '09:00:00', (Hora a la que se hace la reunion, se establece cada año)
  - congregacion: VARCHAR(100), (Nombre de la congregacion local)


Tabla: dias_semana
Columnas:
  - id_dia INT PRIMARY KEY,
  - nombre_dia VARCHAR(15) NOT NULL, {(1, 'Lunes'), (2, 'Martes'), (3, 'Miércoles'), (4, 'Jueves'), (5, 'Viernes'), (6, 'Sábado'), (7, 'Domingo')}

Tabla: oradores_visitantes
Columnas:
  - id_visitante: INT AUTO_INCREMENT, PRIMARY KEY (ID interno generado para identificar el discursante visitante)
  - nombre: VARCHAR(55) (almacena el nombre del discursante)
  - num_bosquejo: VARCHAR(5) (almacena el numero de bosquejo)
  - tema: VARCHAR(255) (Almacena el titulo del discurso)
  - cancion: VARCHAR(5) (almacena el numero de cancion)
  - telefono: (VARCHAR) (14) (almacena el numero de telefono)
  - fecha_discurso: DATE (Almacena la fecha en la que se programo el discurso)
  - congregacion: VARCHART(20) (congregacion de origen del orador)
  - asistio: BOOLEAN (TRUE si asistio, FALSE si no se presento)

*/

// Ruta para obtener los datos de la reunión local
app.get('/api/reunion-local', async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM reuniones LIMIT 1");
        if (rows.length === 0) return res.status(404).json({ error: "Configuración de reunión no encontrada" });
        
        // Añadimos el nombre del día dinámicamente desde el mapa
        rows[0].nombre_dia = diasSemanaMap[rows[0].dia_rp] || "No definido";
        res.json(rows[0]);
    } catch (err) {
        console.error('Error al obtener reunión local:', err);
        res.status(500).json({ error: err.message });
    }
});

// Ruta para actualizar los datos de la reunión local
app.put('/api/reunion-local/:id', async (req, res) => {
    const { id } = req.params;
    const { dia_rp, hora_reunion, congregacion } = req.body;

    try {
        const query = `
            UPDATE reuniones 
            SET dia_rp = ?, hora_reunion = ?, congregacion = ? 
            WHERE id_reunion = ?
        `;
        const [result] = await pool.query(query, [dia_rp, hora_reunion, congregacion, id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: "No se encontró el registro" });
        res.json({ message: "Configuración actualizada correctamente" });
    } catch (err) {
        console.error('Error al actualizar reunión local:', err);
        res.status(500).json({ error: err.message });
    }
});

// Ruta para obtener la programación de visitantes filtrada por mes y año
app.get('/api/visitantes-programacion', async (req, res) => {
    const { mes, anio } = req.query; // mes llega como 0-11 desde el frontend
    try {
        const query = `
            SELECT * FROM oradores_visitantes 
            WHERE MONTH(fecha_discurso) = ? AND YEAR(fecha_discurso) = ?
        `;
        // MONTH() en SQL es 1-12, sumamos 1 al mes recibido
        const [rows] = await pool.query(query, [parseInt(mes) + 1, anio]);
        res.json(rows);
    } catch (err) {
        console.error('Error al obtener programación de visitantes:', err);
        res.status(500).json({ error: err.message });
    }
});

// Ruta para guardar o actualizar la programación completa de un mes
app.post('/api/visitantes-programacion', async (req, res) => {
    const { mes, anio, programacion } = req.body; // mes llega como 0-11
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Limpiamos registros previos para ese mes y año para evitar duplicidad al sobreescribir
        await connection.query(
            "DELETE FROM oradores_visitantes WHERE MONTH(fecha_discurso) = ? AND YEAR(fecha_discurso) = ?",
            [parseInt(mes) + 1, anio]
        );

        // 2. Preparamos los valores para la inserción masiva
        // Filtramos para no guardar filas completamente vacías
        const values = programacion
            .filter(p => p.nombre && p.nombre.trim() !== "")
            .map(p => [
                p.nombre, p.num_bosquejo || null, p.tema || null, 
                p.cancion || null, p.fecha_discurso, p.congregacion || null, p.asistio || 0
            ]);

        if (values.length > 0) {
            const query = "INSERT INTO oradores_visitantes (nombre, num_bosquejo, tema, cancion, fecha_discurso, congregacion, asistio) VALUES ?";
            await connection.query(query, [values]);
        }

        await connection.commit();
        res.json({ message: "Programación actualizada correctamente" });
    } catch (err) {
        await connection.rollback();
        console.error('Error al guardar programación:', err);
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
});

/////////////////////////// FIN BACKEND PAGINA visitantes.html ////////////////////////////////////////

/////////////////////////// BACKEND PAGINA agenda.html ////////////////////////////////////////////
/*ESTRUCTURA DE LA TABLA EN SQL:
Tabla: agenda (Almacena la informacion principal de los eventos, roles o asignaciones.)
Columnas:
  - id_rol: Tipo BIGINT UNSIGNED. Restricciones: PRIMARY KEY, AUTO_INCREMENT. Descripcion: Identificador unico del evento.
  - fecha_ini: Tipo DATE. Descripcion: Fecha de inicio del evento (Formato AAAA-MM-DD).
  - fecha_fin: Tipo DATE. Descripcion: Fecha de finalizacion del evento (Formato AAAA-MM-DD).
  - congregacion: Tipo VARCHAR(255). Descripcion: Nombre o identificador de la congregacion asociada al evento.
  - estatus: Tipo BOOLEAN (TINYINT). Restricciones: DEFAULT FALSE. Descripcion: Estado del evento. TRUE (1) significa Confirmado, FALSE (0) significa Pendiente.
  - notas: Tipo TEXT. Descripcion: Espacio para anadir descripciones detalladas o notas de tamano mediano/largo.
  - hora_reunion:Tipo TIME NULL Descripcion: almacena la hora en la se tienen la reunion
  - dia_rp: INT Descripcion: guarda el dia que tienen la reunion de fin de semana, almacenara un numero 6 o 7 y se relaciona con la tabla dias_semana
  - direccion: Tipo VARCHAR(255) guarda la ubicacion de la congregacion

Tabla: meses
Columnas:
  - id_mes INT PRIMARY KEY,
  - mes SERIAL, {(1, 'Enero'), (2, 'Febrero'), (3, 'Marzo'), (4, 'Abril'), (5, 'Mayo'), (6, 'Junio'), (7, 'Julio'), (8, 'Agosto'), (9, 'Septiembre'), (10, 'Octubre'), (11, 'Noviembre'), (12, 'Diciembre')}

Tabla: agenda_meses (Es el puente que conecta los eventos de la agenda con los meses correspondientes, permitiendo asignar 1 o mas meses a un solo evento sin duplicar datos de la agenda.)
Columnas:
  - id_rol: Tipo BIGINT UNSIGNED. Restricciones: PRIMARY KEY (Compuesta), FOREIGN KEY. Descripcion: Referencia exacta al evento (id_rol) en la tabla agenda.
  - id_mes: Tipo BIGINT UNSIGNED. Restricciones: PRIMARY KEY (Compuesta), FOREIGN KEY. Descripcion: Referencia exacta al mes (id_mes) en la tabla meses.

*/

// Ruta para obtener los registros de la agenda filtrados por año
app.get('/api/agenda', async (req, res) => {
    const { anio } = req.query;
    try {
        // Consultamos la agenda y unimos con los meses asociados para obtener el texto descriptivo
        const query = `
            SELECT a.*, 
                   GROUP_CONCAT(m.mes SEPARATOR ' - ') as meses_texto,
                   GROUP_CONCAT(m.id_mes) as meses_ids
            FROM agenda a
            LEFT JOIN agenda_meses am ON a.id_rol = am.id_rol
            LEFT JOIN meses m ON am.id_mes = m.id_mes
            WHERE YEAR(a.fecha_ini) = ? OR YEAR(a.fecha_fin) = ?
            GROUP BY a.id_rol
            ORDER BY a.fecha_ini ASC
        `;
        const [rows] = await pool.query(query, [anio, anio]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Ruta para guardar un nuevo acuerdo
app.post('/api/agenda', async (req, res) => {
    const { fecha_ini, fecha_fin, congregacion, estatus, notas, meses, hora_reunion, dia_rp, direccion } = req.body;
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Guardamos la información principal en la tabla 'agenda'
        const queryAgenda = `
            INSERT INTO agenda (fecha_ini, fecha_fin, congregacion, estatus, notas, hora_reunion, dia_rp, direccion)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const [result] = await connection.query(queryAgenda, [
            fecha_ini, 
            fecha_fin, 
            congregacion, 
            estatus ? 1 : 0, 
            notas,
            hora_reunion || null,
            dia_rp || null,
            direccion || null
        ]);

        const id_rol = result.insertId;

        // 2. Si hay meses seleccionados, los insertamos en la tabla relacional 'agenda_meses'
        if (meses && meses.length > 0) {
            const queryMeses = "INSERT INTO agenda_meses (id_rol, id_mes) VALUES ?";
            const values = meses.map(id_mes => [id_rol, id_mes]);
            await connection.query(queryMeses, [values]);
        }

        await connection.commit();
        res.status(201).json({ message: "Acuerdo guardado", id_rol });
    } catch (err) {
        await connection.rollback();
        console.error('Error al guardar acuerdo:', err);
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
});

// Ruta para actualizar un acuerdo existente
app.put('/api/agenda/:id', async (req, res) => {
    const { id } = req.params;
    const { fecha_ini, fecha_fin, congregacion, estatus, notas, meses, hora_reunion, dia_rp, direccion } = req.body;
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const queryAgenda = `
            UPDATE agenda 
            SET fecha_ini = ?, fecha_fin = ?, congregacion = ?, estatus = ?, notas = ?, 
                hora_reunion = ?, dia_rp = ?, direccion = ?
            WHERE id_rol = ?
        `;
        await connection.query(queryAgenda, [
            fecha_ini, 
            fecha_fin, 
            congregacion, 
            estatus ? 1 : 0, 
            notas, 
            hora_reunion || null,
            dia_rp || null,
            direccion || null,
            id
        ]);

        // Actualizamos los meses: eliminamos los anteriores y añadimos los nuevos
        await connection.query("DELETE FROM agenda_meses WHERE id_rol = ?", [id]);

        if (meses && meses.length > 0) {
            const queryMeses = "INSERT INTO agenda_meses (id_rol, id_mes) VALUES ?";
            const values = meses.map(id_mes => [id, id_mes]);
            await connection.query(queryMeses, [values]);
        }

        await connection.commit();
        res.json({ message: "Acuerdo actualizado correctamente" });
    } catch (err) {
        await connection.rollback();
        console.error('Error al actualizar acuerdo:', err);
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
});

// Ruta para eliminar un acuerdo
app.delete('/api/agenda/:id', async (req, res) => {
    const { id } = req.params;
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        // Primero eliminamos las relaciones en agenda_meses por la integridad referencial
        await connection.query("DELETE FROM agenda_meses WHERE id_rol = ?", [id]);
        await connection.query("DELETE FROM agenda WHERE id_rol = ?", [id]);
        
        await connection.commit();
        res.json({ message: "Acuerdo eliminado correctamente" });
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
});

// Ruta para confirmar asistencia de un orador visitante y actualizar historial del bosquejo
app.post('/api/confirmar-asistencia', async (req, res) => {
    const { num, fecha } = req.body;
    if (!num || !fecha) return res.status(400).json({ error: "Datos incompletos" });

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Actualizamos lista_bosquejos moviendo la fecha actual al historial y poniendo la nueva fecha
        await connection.query("UPDATE lista_bosquejos SET fecha_ant = fecha_ult, fecha_ult = ? WHERE num = ?", [fecha, num]);

        // 2. Marcamos como asistido en la tabla de programación de visitantes
        await connection.query("UPDATE oradores_visitantes SET asistio = TRUE WHERE num_bosquejo = ? AND fecha_discurso = ?", [num, fecha]);

        await connection.commit();
        res.json({ message: "Asistencia confirmada e historial actualizado" });
    } catch (err) {
        await connection.rollback();
        console.error('Error al confirmar asistencia:', err);
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
});

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
            WHERE MONTH(s.fecha_salida) = ? AND YEAR(s.fecha_salida) = ?
        `;
        const [rows] = await pool.query(query, [parseInt(mes) + 1, anio]);
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
            "DELETE FROM salidas_discursar WHERE MONTH(fecha_salida) = ? AND YEAR(fecha_salida) = ?",
            [parseInt(mes) + 1, anio]
        );

        const values = programacion.map(p => [
            p.id_registro, p.id_rol, p.fecha_salida, p.id_orador
        ]);

        if (values.length > 0) {
            const query = "INSERT INTO salidas_discursar (id_registro, id_rol, fecha_salida, id_orador) VALUES ?";
            await connection.query(query, [values]);
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
app.get('/api/agenda/confirmada', async (req, res) => {
    const { mes, anio } = req.query; // mes llega como 0-11 desde el frontend
    try {
        const query = `
            SELECT a.id_rol, a.congregacion, a.fecha_ini, a.fecha_fin, a.notas, a.dia_rp, a.hora_reunion
            FROM agenda a
            JOIN agenda_meses am ON a.id_rol = am.id_rol
            WHERE am.id_mes = ? 
              AND (YEAR(a.fecha_ini) = ? OR YEAR(a.fecha_fin) = ?)
              AND a.estatus = 1
            LIMIT 1
        `;
        // En la BD los meses son 1-12, por eso sumamos 1 a 'mes'
        const [rows] = await pool.query(query, [parseInt(mes) + 1, anio, anio]);

        if (rows.length > 0) {
            rows[0].nombre_dia = diasSemanaMap[rows[0].dia_rp] || "No definido";
        }
        
        // Si no hay resultados, devolvemos null de forma explícita
        res.json(rows.length > 0 ? rows[0] : null);
    } catch (err) {
        console.error('Error al obtener rol confirmado:', err);
        res.status(500).json({ error: err.message });
    }
});

// Endpoint para el dashboard: Obtener el visitante de la semana actual
app.get('/api/dashboard/visitante-semana', async (req, res) => {
    try {
        const query = `
            SELECT nombre, tema, fecha_discurso 
            FROM oradores_visitantes 
            WHERE YEARWEEK(fecha_discurso, 1) = YEARWEEK(CURDATE(), 1)
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
            WHERE YEARWEEK(s.fecha_salida, 1) = YEARWEEK(CURDATE(), 1)
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