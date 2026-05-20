import pool from '../config/db.js';

/**
 * Borra todo el contenido dinámico de la base de datos.
 * Mantiene la lista de bosquejos pero limpia su historial de fechas.
 */
export const clearDatabaseContents = async (req, res) => {
    try {
        const connection = await pool.getConnection();
        try {
            // Desactivar temporalmente las comprobaciones de FK para facilitar el borrado
            // Importante: En SQLite esto debe ejecutarse fuera de la transacción para que surta efecto.
            await connection.query('PRAGMA foreign_keys = OFF');

            await connection.beginTransaction();

            const tables = [
                'salidas_discursar',
                'temas_orador',
                'oradores_visitantes',
                'agenda_meses',
                'agenda',
                'reuniones_especiales',
                'reuniones',
                'historico',
                'oradores'
            ];

            for (const t of tables) {
                // Usamos DELETE FROM para mantener la tabla (sin DROP)
                try {
                    await connection.query(`DELETE FROM ${t}`);
                } catch (innerErr) {
                    console.warn(`No se pudo limpiar la tabla ${t}:`, innerErr.message);
                    // continuar con las demás tablas
                }
            }

            // Reiniciar historial en la lista de bosquejos (S-34)
            await connection.query("UPDATE lista_bosquejos SET fecha_ult = NULL, fecha_ant = NULL");

            await connection.commit();

            // Reactivar FK una vez finalizada la transacción
            await connection.query('PRAGMA foreign_keys = ON');

            res.json({ message: 'Contenido de la base de datos borrado correctamente' });
        } catch (err) {
            await connection.rollback();
            console.error('Error al borrar contenido de la BD:', err);
            res.status(500).json({ error: err.message });
        } finally {
            connection.release();
        }
    } catch (err) {
        console.error('Error al obtener conexión para limpiar BD:', err);
        res.status(500).json({ error: err.message });
    }
};
