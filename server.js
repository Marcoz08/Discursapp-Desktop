import express from 'express'; // Framework para crear el servidor web y manejar rutas
import mysql from 'mysql2/promise'; // Driver para conectar con MySQL usando promesas (async/await)
import bodyParser from 'body-parser'; // Middleware para procesar el cuerpo de las peticiones JSON
import cors from 'cors'; // Middleware para permitir peticiones desde otros dominios (el frontend)

const app = express();
const port = 3000; // Puerto donde correrá el servidor localmente

/*
ESTRUCTURA DE LA TABLA EN SQL:
Tabla: lista_bosquejos
Columnas:
  - id: INT AUTO_INCREMENT PRIMARY KEY (Identificador único)
  - num: INT (Número de bosquejo o discurso)
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
app.put('/api/bosquejos/:id', async (req, res) => {
    const { id } = req.params;
    const { fecha_ult, titulo } = req.body;
    console.log(`Petición de actualización para ID ${id}:`, { fecha_ult, titulo });
    try {
        let result;
        if (titulo !== undefined) {
            [result] = await pool.query("UPDATE lista_bosquejos SET titulo = ? WHERE id = ?", [titulo, id]);
        } else {
            [result] = await pool.query("UPDATE lista_bosquejos SET fecha_ult = ? WHERE id = ?", [fecha_ult || null, id]);
        }

        if (result.affectedRows === 0) return res.status(404).json({ error: "No se encontró el registro con ese ID" });
        res.json({ message: "Actualizado con éxito" });
    } catch (err) {
        console.error('Error en la base de datos:', err);
        res.status(500).json({ error: err.message });
    }
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});