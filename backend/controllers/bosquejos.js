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

// Actualizar un bosquejo (título o fecha)
export const updateBosquejo = async (req, res) => {
    const { num } = req.params;
    const { fecha_ult, titulo, s34 } = req.body;
    console.log(`Petición de actualización para Núm ${num}:`, { fecha_ult, titulo, s34 });
    try {
        let result;
        if (titulo !== undefined) {
            [result] = await pool.query("UPDATE lista_bosquejos SET titulo = ? WHERE num = ?", [titulo, num]);
        } else if (s34 !== undefined) {
            [result] = await pool.query("UPDATE lista_bosquejos SET s34 = ? WHERE num = ?", [s34 ? 1 : 0, num]);
        } else {
            [result] = await pool.query("UPDATE lista_bosquejos SET fecha_ult = ? WHERE num = ?", [fecha_ult || null, num]);
        }

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
