/**
 * La app usaba Supabase directamente desde el navegador. Ahora usa un
 * backend local (Express + SQLite, ver carpeta `server/`) a traves de un
 * cliente que imita la API de `@supabase/supabase-js`.
 *
 * Para desarrollo:
 *   1. `npm run server`   -> levanta la API en http://localhost:3000
 *   2. `npm start`        -> ng serve; la app ya apunta ahi
 *
 * La URL de la API se puede cambiar con la variable de entorno `API_URL`
 * o, en runtime, con `localStorage.setItem('API_URL', 'http://...')`.
 *
 * Si algun dia vuelve Supabase, restaurar el cliente real:
 *   import { createClient } from '@supabase/supabase-js';
 *   export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
 */

import { createLocalClient } from './data/local-client';

export const supabase: any = createLocalClient();
