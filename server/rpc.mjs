// Reimplementacion en SQL de las funciones RPC que la app llamaba con
// `supabase.rpc(...)`. Todas devuelven columnas: nombre, apellido, puntos
// y (cuando aplica) tiempo -- que es lo que espera la pagina Experiencia.

export function runRpc(db, name, params = {}) {
  const limit = Number.isFinite(+params.limit_param) ? +params.limit_param : 10;
  const juego = params.juego_id_param;

  switch (name) {
    // Suma de puntos por usuario, todos los juegos
    case 'get_usuarios_con_mas_puntos':
      return db.prepare(`
        SELECT u.nombre, u.apellido, COALESCE(SUM(p.puntos), 0) AS puntos
        FROM usuarios u
        JOIN puntajes p ON p.user_id = u.id
        GROUP BY u.id
        ORDER BY puntos DESC
        LIMIT ?
      `).all(limit);

    // Suma de puntos por usuario para un juego
    case 'get_usuarios_con_mas_puntos_por_juego':
      return db.prepare(`
        SELECT u.nombre, u.apellido, COALESCE(SUM(p.puntos), 0) AS puntos
        FROM usuarios u
        JOIN puntajes p ON p.user_id = u.id
        WHERE p.juego_id = ?
        GROUP BY u.id
        ORDER BY puntos DESC
        LIMIT ?
      `).all(juego, limit);

    // Mejor (menor) tiempo por usuario para un juego.
    // En SQLite, con MIN() y GROUP BY, las columnas "sueltas" toman el
    // valor de la fila que contiene el minimo.
    case 'get_usuarios_con_mejor_tiempo':
      return db.prepare(`
        SELECT u.nombre, u.apellido, p.puntos, MIN(p.tiempo) AS tiempo
        FROM usuarios u
        JOIN puntajes p ON p.user_id = u.id
        WHERE p.juego_id = ? AND p.tiempo IS NOT NULL
        GROUP BY u.id
        ORDER BY tiempo ASC
        LIMIT ?
      `).all(juego, limit);

    // Top de puntajes individuales para un juego
    case 'get_top_puntajes_por_juego':
      return db.prepare(`
        SELECT u.nombre, u.apellido, p.puntos, p.tiempo
        FROM puntajes p
        JOIN usuarios u ON u.id = p.user_id
        WHERE p.juego_id = ?
        ORDER BY p.puntos DESC
        LIMIT ?
      `).all(juego, limit);

    default:
      throw new Error(`RPC desconocida: ${name}`);
  }
}
