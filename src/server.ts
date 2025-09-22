import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { Pool } from 'pg';

const app = express();
app.use(cors());
app.use(bodyParser.json());

const pool = new Pool({
  host: 'localhost',
  user: 'tu_usuario',    // reemplazar con tu user de PostgreSQL
  password: 'tu_pass',   // reemplazar con tu pass
  database: 'tu_db',     // reemplazar con tu base de datos
  port: 5432
});


app.get('/messages', async (req, res) => {
  const result = await pool.query(`
    SELECT m.id, m.text, m.created_at, u.nombre, u.apellido
    FROM messages m
    JOIN usuarios u ON m.user_id = u.id
    ORDER BY m.created_at ASC
    LIMIT 50
  `);
  res.json(result.rows);
});

app.post('/messages', async (req, res) => {
  const { user_id, text } = req.body;
  await pool.query('INSERT INTO messages (user_id, text) VALUES ($1, $2)', [user_id, text]);
  res.json({ ok: true });
});

app.listen(3000, () => console.log('Backend corriendo en http://localhost:3000'));
