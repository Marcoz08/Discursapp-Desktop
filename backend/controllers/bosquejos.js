import pool from '../config/db.js';

// Obtener todos los bosquejos
export const getBosquejos = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM lista_bosquejos ORDER BY num ASC");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Crear un nuevo bosquejo (útil para discursos especiales)
export const createBosquejo = async (req, res) => {
    const { titulo, clave, s34, num } = req.body;
    try {
        const query = "INSERT INTO lista_bosquejos (titulo, clave, s34, num) VALUES (?, ?, ?, ?)";
        const [result] = await pool.query(query, [titulo, clave || '', s34 !== undefined ? s34 : 1, num || null]);
        res.status(201).json({ message: "Bosquejo creado con éxito", id_bosquejo: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Actualizar un bosquejo (título o fecha)
export const updateBosquejo = async (req, res) => {
    const { id } = req.params; // Cambiamos num por id (id_bosquejo)
    const { fecha_ult, titulo, s34, clave } = req.body;
    console.log(`Petición de actualización para ID ${id}:`, { fecha_ult, titulo, s34, clave });
    try {
        const updates = [];
        const values = [];

        if (titulo !== undefined) {
            updates.push("titulo = ?");
            values.push(titulo);
        }
        if (clave !== undefined) {
            updates.push("clave = ?");
            values.push(clave);
        }
        if (s34 !== undefined) {
            updates.push("s34 = ?");
            values.push(s34 ? 1 : 0);
        }
        if (fecha_ult !== undefined) {
            updates.push("fecha_ult = ?");
            values.push(fecha_ult || null);
        }

        if (updates.length === 0) return res.status(400).json({ error: "No se proporcionaron datos para actualizar" });

        values.push(id);
        const query = `UPDATE lista_bosquejos SET ${updates.join(", ")} WHERE id_bosquejo = ?`;
        const [result] = await pool.query(query, values);

        if (result.affectedRows === 0) return res.status(404).json({ error: "No se encontró el registro con ese número" });
        res.json({ message: "Actualizado con éxito" });
    } catch (err) {
        console.error('Error en la base de datos:', err);
        res.status(500).json({ error: err.message });
    }
};

// Dashboard: Obtener los últimos 5 discursos presentados
export const getUltimosDiscursos = async (req, res) => {
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
};
