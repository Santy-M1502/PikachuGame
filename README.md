# ⚡ PikachuGame

Página web de entretenimiento con temática Pokémon, centrada en Pikachu.

🌐 Demo: [pikachu-game-eta.vercel.app](https://pikachu-game-eta.vercel.app)

## ✨ Contenido

- 🎮 Juegos clásicos y simples para pasar el rato
- ⚡ Un juego especial de Pikachu (en desarrollo)
- 📝 Blog de noticias y tips relacionados con los juegos
- 💬 Chat en vivo para interactuar con otros jugadores

El diseño sigue una temática Pikachu, con colores cálidos y elementos divertidos inspirados en el personaje.

> Nota: algunas secciones, como el juego de Pikachu y el chat en vivo, están en desarrollo.

## 🛠️ Tecnologías utilizadas

- Angular (framework principal)
- TypeScript
- HTML / CSS

## 🚀 Instalación y ejecución

```bash
git clone https://github.com/Santy-M1502/PikachuGame.git
cd PikachuGame
npm install
```

Necesitás **dos procesos** corriendo a la vez (dos terminales):

```bash
npm run server    # API local + base de datos (http://localhost:3000)
npm start         # ng serve (http://localhost:4200)
```

Luego abrir [http://localhost:4200](http://localhost:4200) en el navegador.

### 💾 Base de datos

La app usaba Supabase. Ahora corre contra un backend local propio
(**Express + SQLite**, carpeta `server/`) que no necesita Docker ni ningún
servicio externo. Ver [`server/README.md`](server/README.md) para el detalle
(esquema, usuarios de prueba, cómo resetear los datos).

| Comando           | Qué hace                                             |
|-------------------|-----------------------------------------------------|
| `npm run server`  | Levanta la API; crea `server/data.sqlite` la 1ª vez |
| `npm run db:reset`| Borra la base local (se recrea al iniciar el server)|
