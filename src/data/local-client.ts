/**
 * Cliente local que imita la parte de la API de `@supabase/supabase-js`
 * que usa esta app (auth, query builder `.from(...)`, `.rpc(...)` y el
 * canal realtime `.channel(...)`), pero hablando con el servidor Express
 * local de `server/` en vez de con Supabase.
 *
 * El objetivo es que el resto del codigo no cambie: `supabase.config.ts`
 * exporta el resultado de `createLocalClient()` como `supabase`.
 *
 * El filtrado de las consultas (`.eq`, `.in`, `.or`, `.order`, `.limit`,
 * `.single`) se resuelve en el navegador sobre la tabla completa. Con el
 * volumen de datos de esta app (demo) es mas que suficiente y mantiene el
 * servidor trivial.
 */

import { io, type Socket } from 'socket.io-client';

// --------------------------------------------------------------- config
function envValue(key: string, fallback: string): string {
  try {
    const g = globalThis as any;
    const fromProcess = g?.process?.env ? g.process.env[key] : undefined;
    const fromStorage =
      typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
    return fromProcess || fromStorage || fallback;
  } catch {
    return fallback;
  }
}

const API_URL = envValue('API_URL', 'http://localhost:3000').replace(/\/$/, '');
const IS_BROWSER = typeof window !== 'undefined';
const SESSION_KEY = 'sb-local-session';

// -------------------------------------------------------------- session
interface LocalUser {
  id: string;
  email: string;
}
interface LocalSession {
  access_token: string;
  token_type: string;
  user: LocalUser;
}

function loadSession(): LocalSession | null {
  try {
    const raw =
      typeof localStorage !== 'undefined' ? localStorage.getItem(SESSION_KEY) : null;
    return raw ? (JSON.parse(raw) as LocalSession) : null;
  } catch {
    return null;
  }
}

function saveSession(session: LocalSession | null): void {
  try {
    if (typeof localStorage === 'undefined') return;
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

let currentSession: LocalSession | null = loadSession();

// ------------------------------------------------------------------ http
interface ApiResult {
  ok: boolean;
  status: number;
  body: any;
}

async function apiFetch(path: string, init: RequestInit = {}): Promise<ApiResult> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((init.headers as Record<string, string>) ?? {}),
  };
  if (currentSession?.access_token) {
    headers['Authorization'] = `Bearer ${currentSession.access_token}`;
  }
  const resp = await fetch(`${API_URL}${path}`, { ...init, headers });
  const body = await resp.json().catch(() => null);
  return { ok: resp.ok, status: resp.status, body };
}

// A pequeña cache de tablas por ejecución de consulta (para resolver embeds)
async function fetchTable(table: string): Promise<any[]> {
  const { ok, body } = await apiFetch(`/rest/${table}`);
  if (!ok) throw new Error(body?.error?.message ?? `No se pudo leer ${table}`);
  return Array.isArray(body) ? body : [];
}

// ------------------------------------------------------------------ auth
const auth = {
  async signInWithPassword(credentials: { email: string; password: string }) {
    try {
      const { ok, body } = await apiFetch('/auth/signin', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      if (!ok) {
        return { data: { user: null, session: null }, error: body?.error ?? { message: 'Error' } };
      }
      currentSession = body.session;
      saveSession(currentSession);
      return { data: { user: body.user, session: body.session }, error: null };
    } catch (e: any) {
      return { data: { user: null, session: null }, error: { message: e?.message ?? String(e) } };
    }
  },

  async signUp(credentials: { email: string; password: string }) {
    try {
      const { ok, body } = await apiFetch('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      if (!ok) {
        return { data: { user: null, session: null }, error: body?.error ?? { message: 'Error' } };
      }
      currentSession = body.session;
      saveSession(currentSession);
      return { data: { user: body.user, session: body.session }, error: null };
    } catch (e: any) {
      return { data: { user: null, session: null }, error: { message: e?.message ?? String(e) } };
    }
  },

  async signOut() {
    try {
      await apiFetch('/auth/signout', { method: 'POST' });
    } catch {
      /* ignore */
    }
    currentSession = null;
    saveSession(null);
    return { error: null };
  },

  async getUser() {
    if (!currentSession) {
      return { data: { user: null }, error: { message: 'Not authenticated' } };
    }
    return { data: { user: currentSession.user }, error: null };
  },

  async getSession() {
    return { data: { session: currentSession }, error: null };
  },

  onAuthStateChange(_cb?: (event: string, session: LocalSession | null) => void) {
    return { data: { subscription: { unsubscribe() {} } } };
  },
};

// --------------------------------------------------------- query builder
type FilterOp =
  | { kind: 'eq'; col: string; val: any }
  | { kind: 'neq'; col: string; val: any }
  | { kind: 'in'; col: string; arr: any[] }
  | { kind: 'or'; expr: string };

class Query implements PromiseLike<any> {
  private selectStr = '*';
  private selectOpts: { head?: boolean; count?: string } = {};
  private filters: FilterOp[] = [];
  private orderBy: { col: string; asc: boolean } | null = null;
  private limitN: number | null = null;
  private wantSingle = false;
  private insertRows: any[] | null = null;

  constructor(private table: string) {}

  select(columns = '*', opts: { head?: boolean; count?: string } = {}) {
    this.selectStr = columns || '*';
    this.selectOpts = opts || {};
    return this;
  }

  insert(rows: any | any[]) {
    this.insertRows = Array.isArray(rows) ? rows : [rows];
    return this;
  }

  eq(col: string, val: any) {
    this.filters.push({ kind: 'eq', col, val });
    return this;
  }
  neq(col: string, val: any) {
    this.filters.push({ kind: 'neq', col, val });
    return this;
  }
  in(col: string, arr: any[]) {
    this.filters.push({ kind: 'in', col, arr });
    return this;
  }
  or(expr: string) {
    this.filters.push({ kind: 'or', expr });
    return this;
  }
  order(col: string, opts: { ascending?: boolean } = {}) {
    this.orderBy = { col, asc: opts.ascending !== false };
    return this;
  }
  limit(n: number) {
    this.limitN = n;
    return this;
  }
  single() {
    this.wantSingle = true;
    return this;
  }
  maybeSingle() {
    this.wantSingle = true;
    return this;
  }

  then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return this.exec().then(onfulfilled ?? undefined, onrejected ?? undefined);
  }

  private async exec(): Promise<any> {
    try {
      return this.insertRows ? await this.execInsert() : await this.execSelect();
    } catch (e: any) {
      return { data: null, error: { message: e?.message ?? String(e) } };
    }
  }

  private async execInsert(): Promise<any> {
    const { ok, body } = await apiFetch(`/rest/${this.table}`, {
      method: 'POST',
      body: JSON.stringify(this.insertRows),
    });
    if (!ok) return { data: null, error: body?.error ?? { message: 'Error al insertar' } };
    const rows: any[] = Array.isArray(body) ? body : [];
    if (this.wantSingle) return { data: rows[0] ?? null, error: null };
    return { data: rows, error: null };
  }

  private async execSelect(): Promise<any> {
    let rows = await fetchTable(this.table);
    rows = this.applyFilters(rows);

    if (this.orderBy) {
      const { col, asc } = this.orderBy;
      const dir = asc ? 1 : -1;
      rows = [...rows].sort((a, b) => {
        const av = a[col];
        const bv = b[col];
        if (av === bv) return 0;
        if (av === null || av === undefined) return -dir;
        if (bv === null || bv === undefined) return dir;
        return (av > bv ? 1 : -1) * dir;
      });
    }

    if (this.limitN !== null) rows = rows.slice(0, this.limitN);

    if (this.selectOpts.head) {
      return { data: null, count: rows.length, error: null };
    }

    rows = await this.resolveEmbeds(rows);

    if (this.wantSingle) {
      if (rows.length === 0) {
        return { data: null, error: { message: 'No rows found', code: 'PGRST116' } };
      }
      return { data: rows[0], error: null };
    }
    return { data: rows, error: null, count: rows.length };
  }

  private applyFilters(rows: any[]): any[] {
    let out = rows;
    for (const f of this.filters) {
      if (f.kind === 'eq') {
        out = out.filter((r) => String(r[f.col]) === String(f.val));
      } else if (f.kind === 'neq') {
        out = out.filter((r) => String(r[f.col]) !== String(f.val));
      } else if (f.kind === 'in') {
        const set = new Set(f.arr.map(String));
        out = out.filter((r) => set.has(String(r[f.col])));
      } else if (f.kind === 'or') {
        const conds = f.expr.split(',').map((s) => s.trim());
        out = out.filter((r) =>
          conds.some((c) => {
            const m = c.match(/^([\w]+)\.([\w]+)\.(.*)$/);
            if (!m) return false;
            const [, col, op, rawVal] = m;
            if (op === 'ilike' || op === 'like') {
              const needle = rawVal.replace(/%/g, '').toLowerCase();
              return String(r[col] ?? '').toLowerCase().includes(needle);
            }
            if (op === 'eq') return String(r[col]) === rawVal;
            if (op === 'neq') return String(r[col]) !== rawVal;
            return false;
          })
        );
      }
    }
    return out;
  }

  private async resolveEmbeds(rows: any[]): Promise<any[]> {
    // patrones tipo  alias:tabla(cols)  o  tabla(cols)
    const re = /(?:(\w+)\s*:\s*)?(\w+)\s*\(([^)]*)\)/g;
    const embeds: { alias: string; table: string }[] = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(this.selectStr)) !== null) {
      embeds.push({ alias: m[1] || m[2], table: m[2] });
    }
    if (embeds.length === 0) return rows;

    let out = rows;
    for (const emb of embeds) {
      let ref: any[];
      try {
        ref = await fetchTable(emb.table);
      } catch {
        continue;
      }
      const byId = new Map(ref.map((r) => [String(r.id), r]));
      const singular = emb.table.replace(/s$/, '');
      const fkCandidates = [`${singular}_id`, 'usuario_id', 'user_id'];
      out = out.map((r) => {
        const fk = fkCandidates.find((k) => r[k] !== undefined && r[k] !== null);
        const linked = fk ? byId.get(String(r[fk])) ?? null : null;
        return { ...r, [emb.alias]: linked };
      });
    }
    return out;
  }
}

// --------------------------------------------------------------- rpc
async function rpc(name: string, params: Record<string, any> = {}) {
  try {
    const { ok, body } = await apiFetch(`/rpc/${name}`, {
      method: 'POST',
      body: JSON.stringify(params ?? {}),
    });
    if (!ok) return { data: null, error: body?.error ?? { message: 'Error en RPC' } };
    return { data: body, error: null };
  } catch (e: any) {
    return { data: null, error: { message: e?.message ?? String(e) } };
  }
}

// ------------------------------------------------------ realtime channel
let sharedSocket: Socket | null = null;
function getSocket(): Socket | null {
  if (!IS_BROWSER) return null;
  if (!sharedSocket) {
    sharedSocket = io(API_URL, { transports: ['websocket', 'polling'] });
  }
  return sharedSocket;
}

interface ChannelHandler {
  event: string;
  table: string;
  cb: (payload: any) => void;
}

class Channel {
  private handlers: ChannelHandler[] = [];
  private bound = false;

  constructor(private name: string) {}

  on(_type: string, filter: any, cb: (payload: any) => void) {
    this.handlers.push({
      event: filter?.event ?? '*',
      table: filter?.table ?? '*',
      cb,
    });
    return this;
  }

  subscribe(statusCb?: (status: string) => void) {
    const socket = getSocket();
    if (socket && !this.bound) {
      this.bound = true;
      socket.on('db-change', (change: any) => {
        for (const h of this.handlers) {
          const eventOk = h.event === '*' || h.event === change.eventType;
          const tableOk = h.table === '*' || h.table === change.table;
          if (eventOk && tableOk) {
            h.cb({ new: change.new ?? {}, old: change.old ?? {}, eventType: change.eventType });
          }
        }
      });
    }
    statusCb?.('SUBSCRIBED');
    return this;
  }

  unsubscribe() {
    this.handlers = [];
    return this;
  }
}

// ------------------------------------------------------------- factory
export function createLocalClient() {
  return {
    auth,
    from: (table: string) => new Query(table),
    rpc,
    channel: (name: string) => new Channel(name),
    removeChannel: (_channel?: any) => {},
    removeAllChannels: () => {},
  };
}

export type LocalClient = ReturnType<typeof createLocalClient>;
