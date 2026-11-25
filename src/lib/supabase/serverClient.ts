/**
 * Supabase SERVICE client (server-side) — DBACADEMY.
 *
 * Ámbito: operaciones de servidor con poder (coupons, referidos) usado por
 * `server.ts` (del repo raíz). Antes esto era `firebase-admin`.
 *
 * Variables requeridas (cualquiera de los dos esquemas):
 *   SUPABASE_URL  +  SUPABASE_SERVICE_KEY   (service_role legacy)
 *   SUPABASE_URL  +  SUPABASE_SECRET_KEY    (nuevo formato sb_secret_...)
 * Nunca usar variables VITE_* para la clave de servicio: se exponen al navegador.
 * (construcción lazy: el error sucede en la primera operación).
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { cleanWrite, rowToSnapshot, toSnake, type DocRef, type DocSnapshot, type Snapshot } from './firestoreAdapter';

let client: SupabaseClient | null = null;

/** Configuración del servidor compatible con claves legacy y nuevas (secret key). */
export function getSupabaseServerEnv(): { url: string; key: string } {
  const url = process.env.SUPABASE_URL?.trim() || process.env.VITE_SUPABASE_URL?.trim() || '';
  const key = process.env.SUPABASE_SERVICE_KEY?.trim() || process.env.SUPABASE_SECRET_KEY?.trim() || '';
  return { url, key };
}

/** booleano para health-check: no expone valores. */
export function isSupabaseAdminConfigured(): boolean {
  const { url, key } = getSupabaseServerEnv();
  return Boolean(url && key);
}

export function getSupabaseServiceClient(): SupabaseClient {
  const { url, key } = getSupabaseServerEnv();
  if (!url || !key) {
    throw new Error(
      'DBACADEMY server: falta SUPABASE_URL o una clave de servicio (SUPABASE_SERVICE_KEY o SUPABASE_SECRET_KEY). Env, sin imprimir valores.'
    );
  }
  if (!client) {
    client = createClient(url, key, { auth: { autoRefreshToken: false } });
  }
  return client;
}

type SbTable = ReturnType<ReturnType<typeof createClient>['from']>;
type Where = [string, string, any];

function applyFilter(q: SbTable, f: Where): SbTable {
  const col = toSnake(f[0]);
  switch (f[1]) {
    case '==': return q.eq(col, f[2]) as SbTable;
    case '!=': return q.neq(col, f[2]) as SbTable;
    case '>': return q.gt(col, f[2]) as SbTable;
    case '<': return q.lt(col, f[2]) as SbTable;
    case '>=': return q.gte(col, f[2]) as SbTable;
    case '<=': return q.lte(col, f[2]) as SbTable;
    case 'in': return q.in(col, f[2] as any[]) as SbTable;
    default: throw new Error(`serverClient: operador '${f[1]}' no soportado`);
  }
}

function queryRows(
  table: string,
  opts: { where?: Where[]; orderBy?: { col: string; dir: 'asc' | 'desc' }[]; limitN?: number } = {}
): Promise<any[]> {
  let q: any = getSupabaseServiceClient().from(table).select('*');
  for (const f of opts.where ?? []) q = applyFilter(q, f);
  for (const o of opts.orderBy ?? []) q = q.order(toSnake(o.col), { ascending: o.dir === 'asc' });
  if (opts.limitN) q = q.limit(opts.limitN);
  return q.then((res: any) => {
    if (res.error) throw new Error(`Supabase server ${table}.select: ${res.error.message}`);
    return res.data ?? [];
  });
}

function serverDocGet(table: string, id: string): Promise<DocSnapshot> {
  return queryRows(table, { where: [['id', '==', id]], limitN: 1 }).then((rows) => rowToSnapshot(rows[0] ?? null, table));
}

async function serverDocSet(table: string, id: string, data: any): Promise<void> {
  // UPSERT idempotente: el id del documento siempre debe viajar en el payload.
  // `.eq()` después de `upsert()` no es válido en PostgREST y puede reportar
  // errores engañosos; la columna de conflicto ya garantiza la identidad.
  const payload = cleanWrite(data);
  payload.id = id;
  const { error } = await getSupabaseServiceClient()
    .from(table)
    .upsert(payload, { onConflict: 'id' });
  if (error) throw new Error(`Supabase server ${table}.set(${id}): ${error.message}`);
}

async function serverDocUpdate(table: string, id: string, data: any): Promise<void> {
  const { error } = await getSupabaseServiceClient()
    .from(table)
    .update(cleanWrite(data))
    .eq('id', id)
    .select('id');
  if (error) throw new Error(`Supabase server ${table}.update(${id}): ${error.message}`);
}

async function serverDocDelete(table: string, id: string): Promise<void> {
  const { error } = await getSupabaseServiceClient().from(table).delete().eq('id', id);
  if (error) throw new Error(`Supabase server ${table}.delete(${id}): ${error.message}`);
}

export interface ServerDoc {
  id: string;
  get(): Promise<DocSnapshot>;
  set(data: any, _options?: unknown): Promise<void>;
  update(data: any): Promise<void>;
  delete(): Promise<void>;
}

export interface ServerCollection {
  doc(id: string): ServerDoc;
  where(col: string, op: string, val: any): ServerCollection;
  orderBy(col: string, dir?: 'asc' | 'desc'): ServerCollection;
  limit(n: number): ServerCollection;
  get(): Promise<Snapshot>;
}

function makeCollection(
  table: string,
  opts: { where?: Where[]; orderBy?: { col: string; dir: 'asc' | 'desc' }[]; limitN?: number } = {}
): ServerCollection {
  return {
    doc(id: string): ServerDoc {
      return {
        id,
        get: () => serverDocGet(table, id),
        set: (data, _options) => serverDocSet(table, id, data),
        update: (data) => serverDocUpdate(table, id, data),
        delete: () => serverDocDelete(table, id),
      };
    },
    where(col, op, val): ServerCollection {
      return makeCollection(table, { ...opts, where: [...(opts.where ?? []), [col, op, val]] });
    },
    orderBy(col, dir = 'asc'): ServerCollection {
      return makeCollection(table, { ...opts, orderBy: [...(opts.orderBy ?? []), { col, dir }] });
    },
    limit(n): ServerCollection {
      return makeCollection(table, { ...opts, limitN: n });
    },
    async get(): Promise<Snapshot> {
      const rows = await queryRows(table, opts);
      const docs = rows.map((r) => rowToSnapshot(r, table));
      return { docs, empty: docs.length === 0 };
    },
  };
}

export interface ServerBatch {
  update(ref: DocRef, data: any): ServerBatch;
  delete(ref: DocRef): ServerBatch;
  commit(): Promise<void>;
}

export async function runTransaction(fn: (tx: any) => Promise<any>, _tx?: any): Promise<any> {
  const tx = {
    get: (ref: any) => serverDocGet(ref._table, ref.id),
    set: (ref: any, data: any) => serverDocSet(ref._table, ref.id, data),
    update: (ref: any, data: any) => serverDocUpdate(ref._table, ref.id, data),
    delete: (ref: any) => serverDocDelete(ref._table, ref.id),
  };
  return fn(tx);
}

export function serverBatch(): ServerBatch {
  const ops: Array<{ type: 'set' | 'update' | 'delete'; ref: DocRef; data?: any }> = [];
  return {
    update(ref, data) {
      ops.push({ type: 'update', ref, data: cleanWrite(data) });
      return this;
    },
    delete(ref) {
      ops.push({ type: 'delete', ref });
      return this;
    },
    async commit() {
      for (const op of ops) {
        if (op.type === 'delete') await serverDocDelete(op.ref._table, op.ref.id);
        else if (op.type === 'set') await serverDocSet(op.ref._table, op.ref.id, op.data);
        else await serverDocUpdate(op.ref._table, op.ref.id, op.data);
      }
    },
  };
}

/**
 * Shims Firestore-ish API del `server.ts`. Usa cliente Supabase con
 * SUPABASE_URL + SUPABASE_SERVICE_KEY.
 */
export const serverDb = {
  collection(table: string): ServerCollection {
    return makeCollection(table);
  },
  runTransaction,
  batch: () => serverBatch(),
};
