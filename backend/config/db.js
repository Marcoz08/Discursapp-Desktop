import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fs from 'fs';
import { app } from 'electron';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let dbPath;

if (app && app.isPackaged) {
    const userDataPath = app.getPath('userData');
    const dbDir = path.join(userDataPath, 'data');
    if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
    }
    dbPath = path.join(dbDir, 'discursapp_sqlite.db');
    
    const originalDbPath = path.resolve(__dirname, '../data/discursapp_sqlite.db');
    if (!fs.existsSync(dbPath) && fs.existsSync(originalDbPath)) {
        fs.copyFileSync(originalDbPath, dbPath);
    }
} else {
    // Ajustamos la ruta de la base de datos ya que ahora estamos dentro de /backend/config
    dbPath = path.resolve(__dirname, '../data/discursapp_sqlite.db');
}

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('Error al conectar a SQLite:', err.message);
    else {
        console.log('Conexion exitosa a la base de datos SQLite.');
        db.run('PRAGMA foreign_keys = ON');
    }
});

// Wrapper para simular el comportamiento de mysql2/promise (abstracción de la conexión)
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
    },
    getConnection: () => {
        return Promise.resolve({
            query: pool.query,
            beginTransaction: () => pool.query('BEGIN TRANSACTION'),
            commit: () => pool.query('COMMIT'),
            rollback: () => pool.query('ROLLBACK'),
            release: () => {}
        });
    }
};

export default pool;