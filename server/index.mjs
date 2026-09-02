// API local que reemplaza a Supabase para desarrollo.
//
//   npm run server        -> levanta en http://localhost:3000
//   npm run db:reset      -> borra la base y la vuelve a sembrar
//
// Expone:
//   POST /auth/signup | /auth/signin | /auth/signout   GET /auth/user
//   GET  /rest/:tabla            (todas las filas; el filtrado lo hace el cliente)
//   POST /rest/:tabla            (insert, acepta objeto o array)
//   POST /rpc/:nombre            (rankings)
//   socket.io  ->  evento 'db-change' cuando se inserta un mensaje

import express from 'express';
import { createServer } from 'node:http';
import { Server as IOServer } from 'socket.io';
import { randomUUID } from 'node:crypto';

import { db, hashPassword, verifyPassword, seedIfEmpty } from './db.mjs';
import { runRpc } from './rpc.mjs';

seedIfEmpty();

const PORT = process.env.PORT || 3000;
const TABLES = new Set(['usuarios', 'juegos', 'puntajes', 'messages', 'encuestas']);
const COLUMN_RE = /^[a-z_][a-z0-9_]*$/;

const app = express();
const httpServer = createServer(app);
const io = new IOServer(httpServer, { cors: { origin: '*' } });

app.use(express.json());

// CORS abierto (dev): ng serve corre en :4200, la API en :3000
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// ------------------------------------------------------------------ auth
function bearer(req) {
  const h = req.headers.authorization || '';
  return h.startsWith('Bearer ') ? h.slice(7) : null;
}

function createSession(userId) {
  const token = randomUUID();
  db.prepare('INSERT INTO sessions (token, user_id) VALUES (?, ?)').run(token, userId);
  return token;
}

function currentUser(req) {
  const token = bearer(req);
  if (!token) return null;
  const s = db.prepare('SELECT user_id FROM sessions WHERE token = ?').get(token);
  if (!s) return null;
  return db.prepare('SELECT id, email FROM auth_users WHERE id = ?').get(s.user_id) || null;
}

app.post('/auth/signup', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: { message: 'Email y contraseña son obligatorios' } });
  }
  if (db.prepare('SELECT 1 FROM auth_users WHERE email = ?').get(email)) {
    return res.status(400).json({ error: { message: 'User already registered' } });
  }
  const id = randomUUID();
  db.prepare('INSERT INTO auth_users (id, email, password_hash) VALUES (?, ?, ?)')
    .run(id, email, hashPassword(password));
  const token = createSession(id);
  const user = { id, email };
  res.json({ user, session: { access_token: token, token_type: 'bearer', user } });
});

app.post('/auth/signin', (req, res) => {
  const { email, password } = req.body || {};
  const row = db.prepare('SELECT * FROM auth_users WHERE email = ?').get(email || '');
  if (!row || !verifyPassword(password || '', row.password_hash)) {
    return res.status(400).json({ error: { message: 'Invalid login credentials' } });
  }
  const token = createSession(row.id);
  const user = { id: row.id, email: row.email };
  res.json({ user, session: { access_token: token, token_type: 'bearer', user } });
});

app.post('/auth/signout', (req, res) => {
  const token = bearer(req);
  if (token) db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
  res.json({ error: null });
});

app.get('/auth/user', (req, res) => {
  const user = currentUser(req);
  if (!user) return res.status(401).json({ user: null, error: { message: 'Not authenticated' } });
  res.json({ user });
});

// ------------------------------------------------------------------ rest
app.get('/rest/:table', (req, res) => {
  const { table } = req.params;
  if (!TABLES.has(table)) return res.status(404).json({ error: { message: `Tabla desconocida: ${table}` } });
  res.json(db.prepare(`SELECT * FROM ${table}`).all());
});

app.post('/rest/:table', (req, res) => {
  const { table } = req.params;
  if (!TABLES.has(table)) return res.status(404).json({ error: { message: `Tabla desconocida: ${table}` } });

  const rows = Array.isArray(req.body) ? req.body : [req.body];
  const inserted = [];

  try {
    for (const raw of rows) {
      const obj = raw && typeof raw === 'object' ? raw : {};
      const keys = Object.keys(obj).filter((k) => COLUMN_RE.test(k));
      if (keys.length === 0) throw new Error('Fila sin columnas validas');
      const placeholders = keys.map(() => '?').join(', ');
      const values = keys.map((k) => {
        const v = obj[k];
        return v !== null && typeof v === 'object' ? JSON.stringify(v) : v;
      });
      const info = db
        .prepare(`INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`)
        .run(...values);
      inserted.push(db.prepare(`SELECT * FROM ${table} WHERE rowid = ?`).get(info.lastInsertRowid));
    }
  } catch (e) {
    return res.status(400).json({ error: { message: e.message } });
  }

  if (table === 'messages') {
    for (const m of inserted) io.emit('db-change', { table: 'messages', eventType: 'INSERT', new: m });
  }
  res.json(inserted);
});

// ------------------------------------------------------------------- rpc
app.post('/rpc/:name', (req, res) => {
  try {
    res.json(runRpc(db, req.params.name, req.body || {}));
  } catch (e) {
    res.status(400).json({ error: { message: e.message } });
  }
});

app.get('/', (_req, res) => res.json({ ok: true, service: 'pikachu-games local api' }));

io.on('connection', () => {
  /* el cliente solo escucha 'db-change'; no hace falta manejar nada aca */
});

httpServer.listen(PORT, () => {
  console.log(`API local escuchando en http://localhost:${PORT}`);
});
