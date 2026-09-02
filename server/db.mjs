// Base de datos local (SQLite via el modulo nativo `node:sqlite`, sin
// dependencias nativas). El archivo data.sqlite se crea al lado de este
// modulo la primera vez que arranca el servidor.

import { DatabaseSync } from 'node:sqlite';
import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
export const DB_PATH = join(here, 'data.sqlite');

export const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA foreign_keys = ON;');

db.exec(`
CREATE TABLE IF NOT EXISTS auth_users (
  id            TEXT PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  token      TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS usuarios (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  auth_id    TEXT UNIQUE REFERENCES auth_users(id) ON DELETE CASCADE,
  nombre     TEXT NOT NULL,
  apellido   TEXT NOT NULL,
  email      TEXT,
  edad       INTEGER,
  rol        TEXT NOT NULL DEFAULT 'usuario',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS juegos (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre      TEXT NOT NULL UNIQUE,
  descripcion TEXT
);

CREATE TABLE IF NOT EXISTS puntajes (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  juego_id   INTEGER NOT NULL REFERENCES juegos(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  puntos     INTEGER NOT NULL DEFAULT 0,
  tiempo     INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS messages (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  text       TEXT NOT NULL,
  user_id    TEXT,
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS encuestas (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre     TEXT NOT NULL,
  apellido   TEXT NOT NULL,
  edad       INTEGER,
  telefono   TEXT,
  pregunta1  INTEGER,
  pregunta2  INTEGER,
  pregunta3  INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

// ---------------------------------------------------------------------
// Passwords: scrypt + salt (todo con el modulo `crypto` nativo)
// ---------------------------------------------------------------------
export function hashPassword(pw) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(String(pw), salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(pw, stored) {
  const [salt, hash] = String(stored).split(':');
  if (!salt || !hash) return false;
  const test = scryptSync(String(pw), salt, 64).toString('hex');
  const a = Buffer.from(test, 'hex');
  const b = Buffer.from(hash, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}

// ---------------------------------------------------------------------
// Datos de ejemplo. Se cargan solo si la base esta vacia.
// Usuarios de prueba (los de los botones de acceso rapido del login):
//   prueba@gmail.com  / prueba   (rol admin)
//   prueba2@gmail.com / prueba
//   prueba3@gmail.com / prueba
// ---------------------------------------------------------------------
export function seedIfEmpty() {
  const { n } = db.prepare('SELECT COUNT(*) AS n FROM auth_users').get();
  if (n > 0) return;

  const authUsers = [
    ['11111111-1111-1111-1111-111111111111', 'prueba@gmail.com'],
    ['22222222-2222-2222-2222-222222222222', 'prueba2@gmail.com'],
    ['33333333-3333-3333-3333-333333333333', 'prueba3@gmail.com'],
  ];
  const insAuth = db.prepare('INSERT INTO auth_users (id, email, password_hash) VALUES (?, ?, ?)');
  for (const [id, email] of authUsers) insAuth.run(id, email, hashPassword('prueba'));

  const insUser = db.prepare(
    'INSERT INTO usuarios (auth_id, nombre, apellido, email, edad, rol) VALUES (?, ?, ?, ?, ?, ?)'
  );
  insUser.run('11111111-1111-1111-1111-111111111111', 'Ash', 'Ketchum', 'prueba@gmail.com', 15, 'admin');
  insUser.run('22222222-2222-2222-2222-222222222222', 'Misty', 'Waterflower', 'prueba2@gmail.com', 14, 'usuario');
  insUser.run('33333333-3333-3333-3333-333333333333', 'Brock', 'Harrison', 'prueba3@gmail.com', 20, 'usuario');

  const insJuego = db.prepare('INSERT INTO juegos (nombre, descripcion) VALUES (?, ?)');
  insJuego.run('Ahorcado', 'Adivina el nombre del Pokemon letra por letra.');
  insJuego.run('Mayor o Menor', 'Adivina si la siguiente carta es mayor o menor.');
  insJuego.run('Preguntados', 'Trivia de preguntas sobre el mundo Pokemon.');
  insJuego.run('Que Pokemon es', 'Reconoce al Pokemon por su silueta.');

  const insPunt = db.prepare('INSERT INTO puntajes (juego_id, user_id, puntos, tiempo) VALUES (?, ?, ?, ?)');
  const puntajes = [
    [1, 1, 320, 42], [1, 2, 210, 55], [1, 3, 180, 61],
    [2, 1, 145, 30], [2, 2, 260, 25],
    [3, 3, 400, 88], [3, 1, 350, 95],
    [4, 2, 275, 18], [4, 1, 190, 27],
  ];
  for (const p of puntajes) insPunt.run(...p);

  const insMsg = db.prepare('INSERT INTO messages (text, user_id, usuario_id) VALUES (?, ?, ?)');
  insMsg.run('Hola! Bienvenidos a PikachuGames', '11111111-1111-1111-1111-111111111111', 1);
  insMsg.run('Alguien para una partida de Preguntados?', '22222222-2222-2222-2222-222222222222', 2);

  const insEnc = db.prepare(
    'INSERT INTO encuestas (nombre, apellido, edad, telefono, pregunta1, pregunta2, pregunta3) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  insEnc.run('Red', 'Pallet', 21, '1122334455', 5, 4, 5);
  insEnc.run('Blue', 'Oak', 22, '1199887766', 3, 3, 4);

  console.log('Base local sembrada con datos de ejemplo.');
}
