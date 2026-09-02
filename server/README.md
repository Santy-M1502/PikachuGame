# Backend local (Express + SQLite)

Reemplaza a Supabase para desarrollo. **No necesita Docker** ni nada externo:
usa el módulo nativo `node:sqlite` (Node 22+) y guarda todo en un solo
archivo, `server/data.sqlite` (ignorado por git).

## Uso

```bash
npm run server     # http://localhost:3000  (crea y siembra la base la 1ª vez)
npm run db:reset   # borra data.sqlite; se recrea al volver a iniciar el server
```

La app Angular (`npm start`) ya apunta a `http://localhost:3000`. Se puede
cambiar con la variable de entorno `API_URL` o, en runtime, desde la consola
del navegador: `localStorage.setItem('API_URL', 'http://otro-host:puerto')`.

## Usuarios de prueba (sembrados automáticamente)

Son los mismos que usan los botones de acceso rápido del login.

| email              | password | rol     |
|--------------------|----------|---------|
| prueba@gmail.com   | prueba   | admin   |
| prueba2@gmail.com  | prueba   | usuario |
| prueba3@gmail.com  | prueba   | usuario |

## Endpoints

| Método | Ruta                | Para qué                                       |
|--------|---------------------|------------------------------------------------|
| POST   | `/auth/signup`      | Crear cuenta → `{ user, session }`             |
| POST   | `/auth/signin`      | Login → `{ user, session }`                    |
| POST   | `/auth/signout`     | Cerrar sesión                                  |
| GET    | `/auth/user`        | Usuario del token (header `Authorization`)     |
| GET    | `/rest/:tabla`      | Todas las filas (el filtrado lo hace el cliente)|
| POST   | `/rest/:tabla`      | Insert (objeto o array)                        |
| POST   | `/rpc/:nombre`      | Rankings (ver `rpc.mjs`)                       |
| WS     | socket.io           | Evento `db-change` al insertarse un mensaje    |

Tablas permitidas: `usuarios`, `juegos`, `puntajes`, `messages`, `encuestas`.

## Archivos

- `db.mjs` — conexión SQLite, esquema (`CREATE TABLE …`), hashing de
  passwords (scrypt) y datos de ejemplo (`seedIfEmpty`).
- `index.mjs` — servidor Express + socket.io y todas las rutas.
- `rpc.mjs` — las 4 funciones de ranking que la app llamaba con
  `supabase.rpc(...)`, reescritas en SQL.
- `reset.mjs` — borra el archivo de la base.

## Cómo se conecta la app

`src/data/local-client.ts` implementa un cliente que imita la API de
`@supabase/supabase-js` (`.auth`, `.from(...)`, `.rpc(...)`, `.channel(...)`)
y habla con este servidor. `src/supabase.config.ts` exporta ese cliente como
`supabase`, así que el resto del código Angular no cambió.

## Notas / limitaciones

- Sin control de acceso: cualquiera con acceso a la API puede leer/escribir
  las tablas. Es un entorno de desarrollo local, no producción.
- El "realtime" solo emite inserts de `messages` (que es lo único que la app
  escucha, para el chat).
- El filtrado de consultas se hace en el navegador sobre la tabla completa.
  Suficiente para el volumen de datos de esta app.
