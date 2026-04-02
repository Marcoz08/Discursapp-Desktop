import express from 'express'; // Framework para crear el servidor web y manejar rutas
import mysql from 'mysql2/promise'; // Driver para conectar con MySQL usando promesas (async/await)
import bodyParser from 'body-parser'; // Middleware para procesar el cuerpo de las peticiones JSON
import cors from 'cors'; // Middleware para permitir peticiones desde otros dominios (el frontend)

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

// Conexión a la base de datos MySQL en Railway
const dbUrl = 'mysql://root:euEOadxPhCCJqARPCvrGEJVSdMdWZIhV@hopper.proxy.rlwy.net:59843/railway';

// Creamos un "pool" de conexiones. Es más eficiente que una conexión única porque reutiliza conexiones abiertas.
const pool = mysql.createPool(dbUrl);

console.log('Servidor configurado para conectar a la base de datos en la nube.');

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
/////////////////////////// FIN BACKEND PAGINA oradores.html ////////////////////////////////////////

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});