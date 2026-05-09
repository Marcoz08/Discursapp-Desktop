import pool from '../config/db.js';
import { diasSemanaMap } from './visitantes.js';

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

// Obtener los registros de la agenda filtrados por año
export const getAgenda = async (req, res) => {
    const { anio } = req.query;
    try {
        const query = `
            SELECT a.*, 
            GROUP_CONCAT(m.mes, ' - ') as meses_texto,
            GROUP_CONCAT(m.id_mes) as meses_ids
            FROM agenda a
            LEFT JOIN agenda_meses am ON a.id_rol = am.id_rol
            LEFT JOIN meses m ON am.id_mes = m.id_mes
            WHERE CAST(strftime('%Y', a.fecha_ini) AS INTEGER) = ? OR CAST(strftime('%Y', a.fecha_fin) AS INTEGER) = ?
            GROUP BY a.id_rol
            ORDER BY a.fecha_ini ASC
        `;
        const [rows] = await pool.query(query, [parseInt(anio), parseInt(anio)]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Guardar un nuevo acuerdo
export const createAgenda = async (req, res) => {
    const { fecha_ini, fecha_fin, congregacion, estatus, notas, meses, hora_reunion, dia_rp, direccion } = req.body;
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
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
        if (meses && meses.length > 0) {
            const placeholders = meses.map(() => '(?, ?)').join(', ');
            const flatValues = meses.map(id_mes => [id_rol, id_mes]).flat();
            const queryMeses = `INSERT INTO agenda_meses (id_rol, id_mes) VALUES ${placeholders}`;
            await connection.query(queryMeses, flatValues);
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
};

// Actualizar un acuerdo existente
export const updateAgenda = async (req, res) => {
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
        await connection.query("DELETE FROM agenda_meses WHERE id_rol = ?", [id]);
        if (meses && meses.length > 0) {
            const placeholders = meses.map(() => '(?, ?)').join(', ');
            const flatValues = meses.map(id_mes => [id, id_mes]).flat();
            const queryMeses = `INSERT INTO agenda_meses (id_rol, id_mes) VALUES ${placeholders}`;
            await connection.query(queryMeses, flatValues);
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
};

// Eliminar un acuerdo
export const deleteAgenda = async (req, res) => {
    const { id } = req.params;
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
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
};

// Obtener el acuerdo confirmado para una salida específica (mes/año)
export const getAgendaConfirmada = async (req, res) => {
    const { mes, anio } = req.query;
    try {
        const query = `
            SELECT a.id_rol, a.congregacion, a.fecha_ini, a.fecha_fin, a.notas, a.dia_rp, a.hora_reunion
            FROM agenda a
            JOIN agenda_meses am ON a.id_rol = am.id_rol
            WHERE am.id_mes = ? 
            AND (CAST(strftime('%Y', a.fecha_ini) AS INTEGER) = ? OR CAST(strftime('%Y', a.fecha_fin) AS INTEGER) = ?)
            AND a.estatus = 1
            LIMIT 1
        `;
        const [rows] = await pool.query(query, [parseInt(mes) + 1, parseInt(anio), parseInt(anio)]);
        if (rows.length > 0) {
            rows[0].nombre_dia = diasSemanaMap[rows[0].dia_rp] || "No definido";
        }
        res.json(rows.length > 0 ? rows[0] : null);
    } catch (err) {
        console.error('Error al obtener rol confirmado:', err);
        res.status(500).json({ error: err.message });
    }
};