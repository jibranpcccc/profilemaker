import sqlite3 from 'sqlite3';
import path from 'path';
import os from 'os';

// Path to the ProfileSubmissionAssistant database
const localAppData = process.env.LOCALAPPDATA 
  || (process.platform === 'darwin' 
      ? path.join(os.homedir(), 'Library', 'Application Support')
      : process.platform === 'linux'
      ? path.join(os.homedir(), '.config')
      : path.join(os.homedir(), 'AppData', 'Local'));
const DB_PATH = path.join(localAppData, 'ProfileSubmissionAssistant', 'data.db');

// Use a single shared connection in read-write mode
// OPEN_READWRITE | OPEN_CREATE lets us write status updates back
let _db: sqlite3.Database | null = null;

function getDb(readWrite: boolean = false): sqlite3.Database {
  if (readWrite) {
    // For write operations, always open a fresh connection (avoids WAL conflicts)
    return new sqlite3.Database(
      DB_PATH,
      sqlite3.OPEN_READWRITE,
      (err) => { if (err) console.error('[DB] Write-open error:', err.message); }
    );
  }
  if (!_db) {
    _db = new sqlite3.Database(
      DB_PATH,
      sqlite3.OPEN_READWRITE,
      (err) => {
        if (err) {
          console.error('[DB] Connect error:', err.message);
          // Fallback to readonly if file is locked by WPF app
          _db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READONLY, () => {});
        }
      }
    );
    // Enable WAL mode for concurrent access
    _db.run('PRAGMA journal_mode=WAL;');
    _db.run('PRAGMA busy_timeout=5000;');
  }
  return _db;
}

export function queryDb<T>(sql: string, params: any[] = []): Promise<T[]> {
  const isWrite = /^\s*(INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|PRAGMA\s+journal)/i.test(sql);
  
  return new Promise((resolve, reject) => {
    if (isWrite) {
      // Use a dedicated connection per write to avoid locking
      const db = getDb(true);
      db.run('PRAGMA busy_timeout=5000;');
      
      if (sql.trim().toUpperCase().startsWith('SELECT')) {
        db.all(sql, params, (err, rows) => {
          db.close();
          if (err) reject(err); else resolve(rows as T[]);
        });
      } else {
        db.run(sql, params, function(err) {
          db.close();
          if (err) reject(err); else resolve([{ changes: this.changes, lastID: this.lastID } as any] as T[]);
        });
      }
    } else {
      getDb().all(sql, params, (err, rows) => {
        if (err) reject(err); else resolve(rows as T[]);
      });
    }
  });
}
