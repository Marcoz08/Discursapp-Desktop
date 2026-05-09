import pool from '../config/db.js';

// Obtener programación de salidas (JOIN relacional)
export const getSalidasProgramacion = async (req, res) => {
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
};

// Guardar/actualizar programación de salidas
export const saveSalidasProgramacion = async (req, res) => {
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
};

// Dashboard: Obtener la salida de la semana actual
export const getSalidaSemana = async (req, res) => {
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
};