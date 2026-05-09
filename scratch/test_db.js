import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../db/discursapp_sqlite.db');

const db = new sqlite3.Database(dbPath);

const pool = {
    query: (sql, params = []) => {
        return new Promise((resolve, reject) => {
            const isSelect = sql.trim().toUpperCase().startsWith('SELECT');
            if (isSelect) {
                db.all(sql, params, (err, rows) => {
                    if (err) reject(err);
                    else resolve([rows]);
                });
            } else {
                db.run(sql, params, function (err) {
                    if (err) reject(err);
                    else resolve([{ affectedRows: this.changes, insertId: this.lastID }]);
                });
            }
        });
    }
};

async function test() {
    try {
        const query = `
            SELECT * FROM oradores_visitantes 
            WHERE CAST(strftime('%m', fecha_discurso) AS INTEGER) = ? AND CAST(strftime('%Y', fecha_discurso) AS INTEGER) = ?
        `;
        const mes = "4";
        const anio = "2026";
        const [rows] = await pool.query(query, [parseInt(mes) + 1, parseInt(anio)]);
        console.log("Rows returned:", rows);
    } catch (e) {
        console.error("Error:", e);
    }
}
test();
