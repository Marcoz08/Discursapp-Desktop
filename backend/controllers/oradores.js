import pool from '../config/db.js';

// Obtener oradores con sus temas
export const getOradoresTemas = async (req, res) => {
    console.log('Peticion recibida: GET /api/oradores-temas');
    try {
        const query = `
            SELECT 
                t.id_tituloOrador,
                o.id_orador,
                o.nombre, 
                o.telefono,
                o.congregacion, 
                o.privilegio, 
                o.aprobado,
                t.numero_tema, 
                COALESCE(t.titulo, lb.titulo) AS titulo, 
                t.cancion_sugerida 
            FROM oradores o 
            LEFT JOIN temas_orador t ON o.id_orador = t.id_orador 
            LEFT JOIN lista_bosquejos lb ON t.numero_tema = lb.num
            ORDER BY o.nombre ASC;
        `;
        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (err) {
        console.error('Error en getOradoresTemas:', err);
        res.status(500).json({ error: err.message });
    }
};

// Añadir un nuevo orador
export const createOrador = async (req, res) => {
    const { nombre, telefono, privilegio, congregacion, aprobado } = req.body;
    if (!nombre) return res.status(400).json({ error: "El nombre del orador es obligatorio." });

    try {
        const query = `
            INSERT INTO oradores (nombre, telefono, privilegio, congregacion, aprobado)
            VALUES (?, ?, ?, ?, ?)
        `;
        const [result] = await pool.query(query, [
            nombre,
            telefono || null,
            privilegio,
            congregacion || 'El Castillo',
            aprobado
        ]);
        res.status(201).json({ message: "Orador añadido con éxito", id_orador: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Actualizar datos de un orador
export const updateOrador = async (req, res) => {
    const { id } = req.params;
    const { nombre, telefono, privilegio, congregacion, aprobado } = req.body;
    if (!nombre) return res.status(400).json({ error: "El nombre es obligatorio." });

    try {
        const query = `UPDATE oradores SET nombre = ?, telefono = ?, privilegio = ?, congregacion = ?, aprobado = ? WHERE id_orador = ?`;
        const [result] = await pool.query(query, [nombre, telefono, privilegio, congregacion, aprobado, id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: "No se encontró el orador" });
        res.json({ message: "Orador actualizado con éxito" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Eliminar un orador y sus temas (Transacción)
export const deleteOrador = async (req, res) => {
    const { id } = req.params;
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        await connection.query("DELETE FROM temas_orador WHERE id_orador = ?", [id]);
        const [result] = await connection.query("DELETE FROM oradores WHERE id_orador = ?", [id]);
        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ error: "No se encontró el orador" });
        }
        await connection.commit();
        res.json({ message: "Orador y sus temas eliminados correctamente" });
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
};

// --- Métodos para Temas ---

export const createTema = async (req, res) => {
    const { id_orador, numero_tema, titulo, cancion_sugerida } = req.body;
    if (!id_orador) return res.status(400).json({ error: "El ID del orador es obligatorio." });
    try {
        const query = "INSERT INTO temas_orador (id_orador, numero_tema, titulo, cancion_sugerida) VALUES (?, ?, ?, ?)";
        await pool.query(query, [id_orador, numero_tema || null, titulo || null, cancion_sugerida || null]);
        res.status(201).json({ message: "Tema añadido con éxito" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const updateTema = async (req, res) => {
    const { id } = req.params;
    const { numero_tema, titulo, cancion_sugerida } = req.body;
    let updates = [];
    let params = [];

    if (numero_tema !== undefined) { updates.push("numero_tema = ?"); params.push(numero_tema); }
    if (titulo !== undefined) { updates.push("titulo = ?"); params.push(titulo); }
    if (cancion_sugerida !== undefined) { updates.push("cancion_sugerida = ?"); params.push(cancion_sugerida); }

    if (updates.length === 0) return res.status(400).json({ error: "No hay campos para actualizar." });

    params.push(id);
    try {
        const query = `UPDATE temas_orador SET ${updates.join(', ')} WHERE id_tituloOrador = ?`;
        const [result] = await pool.query(query, params);
        if (result.affectedRows === 0) return res.status(404).json({ error: "No se encontró el tema" });
        res.json({ message: "Tema actualizado con éxito" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const deleteTema = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query("DELETE FROM temas_orador WHERE id_tituloOrador = ?", [id]);
        res.json({ message: "Tema eliminado con éxito" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};