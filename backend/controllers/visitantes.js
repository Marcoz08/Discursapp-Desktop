import pool from '../config/db.js';

// Mapeo constante de días de la semana
export const diasSemanaMap = {
    1: 'Lunes',
    2: 'Martes',
    3: 'Miércoles',
    4: 'Jueves',
    5: 'Viernes',
    6: 'Sábado',
    7: 'Domingo'
};

// Obtener los datos de la reunión local
export const getReunionLocal = async (req, res) => {
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
};

// Actualizar los datos de la reunión local
export const updateReunionLocal = async (req, res) => {
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
};

// Obtener la programación de visitantes filtrada por mes y año
export const getVisitantesProgramacion = async (req, res) => {
    const { mes, anio } = req.query; // mes llega como 0-11 desde el frontend
    try {
        const query = `
            SELECT * FROM oradores_visitantes 
            WHERE CAST(strftime('%m', fecha_discurso) AS INTEGER) = ? AND CAST(strftime('%Y', fecha_discurso) AS INTEGER) = ?
        `;
        // MONTH() en SQL es 1-12, sumamos 1 al mes recibido
        const [rows] = await pool.query(query, [parseInt(mes) + 1, parseInt(anio)]);
        res.json(rows);
    } catch (err) {
        console.error('Error al obtener programación de visitantes:', err);
        res.status(500).json({ error: err.message });
    }
};

// Guardar o actualizar la programación completa de un mes
export const saveVisitantesProgramacion = async (req, res) => {
    const { mes, anio, programacion } = req.body; // mes llega como 0-11
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Limpiamos registros previos para ese mes y año para evitar duplicidad al sobreescribir
        await connection.query(
            "DELETE FROM oradores_visitantes WHERE CAST(strftime('%m', fecha_discurso) AS INTEGER) = ? AND CAST(strftime('%Y', fecha_discurso) AS INTEGER) = ?",
            [parseInt(mes) + 1, parseInt(anio)]
        );

        // 2. Preparamos los valores para la inserción masiva
        const values = programacion
            .filter(p => p.nombre && p.nombre.trim() !== "")
            .map(p => [
                p.nombre, p.num_bosquejo || null, p.tema || null, 
                p.cancion || null, p.fecha_discurso, p.congregacion || null, p.asistio || 0
            ]);

        if (values.length > 0) {
            const placeholders = values.map(() => '(?, ?, ?, ?, ?, ?, ?)').join(', ');
            const flatValues = values.flat();
            const query = `INSERT INTO oradores_visitantes (nombre, num_bosquejo, tema, cancion, fecha_discurso, congregacion, asistio) VALUES ${placeholders}`;
            await connection.query(query, flatValues);
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
};

// Confirmar asistencia de un orador visitante y actualizar historial del bosquejo
export const confirmarAsistencia = async (req, res) => {
    const { num, fecha } = req.body;
    if (!num || !fecha) return res.status(400).json({ error: "Datos incompletos" });

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        await connection.query("UPDATE lista_bosquejos SET fecha_ant = fecha_ult, fecha_ult = ? WHERE num = ?", [fecha, num]);
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
};

// Dashboard: Obtener el visitante de la semana actual
export const getVisitanteSemana = async (req, res) => {
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
};