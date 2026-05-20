import pool from '../config/db.js';

/**
 * Controlador para manejar la inserción manual de registros en el historial.
 * Se utiliza para registrar eventos que no forman parte de la programación automática.
 */
export const createHistorico = async (req, res) => {
    const { fecha, nombre, titulo, congregacion, tipo_registro } = req.body;

    // Validación de integridad básica
    if (!fecha || !nombre) {
        return res.status(400).json({ error: "La fecha y el nombre del orador son obligatorios." });
    }

    try {
        const query = `
            INSERT INTO historico (fecha, nombre, titulo, congregacion, tipo_registro)
            VALUES (?, ?, ?, ?, ?)
        `;
        const [result] = await pool.query(query, [fecha, nombre, titulo || null, congregacion || null, tipo_registro || 0]);
        res.status(201).json({ message: "Registro añadido al historial correctamente", id: result.insertId });
    } catch (err) {
        console.error('Error al insertar en la tabla historico:', err);
        res.status(500).json({ error: "Error interno al guardar el registro manual." });
    }
};