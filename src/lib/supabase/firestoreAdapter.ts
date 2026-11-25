/**
 * Firestore API adapter → Supabase (Postgres).
 *
 * DBACADEMY está en proceso de migrar a Supabase; este adaptador expone la
 * superficie de la API de Firestore que usan PlatformContext, ForumView,
 * StudentManagement y CertificatesView (collection/doc/query/where/getDocs/
 * setDoc/updateDoc/deleteDoc/serverTimestamp/writeBatch/onSnapshot).
 *
 * Semántica v1:
 * - `serverTimestamp()` se materializa como ISO 8601 en writes.
 * - `onSnapshot()` funciona con polling (1.5 s), es un PUENTE temporal;
 *   Postgres con PostgREST streams su propia forma de hacerlo en el futuro.
 * - Tablas: una tabla por colección de Firestore (ver supabase/migrations/).
 *
 * Nota: `Timestamp` es un shim mínimo para cumplir imports de tipos antiguos.
 */
import { getSupabaseClient } from './client';
import { auth, isAuthorizedAdminEmail } from '../../firebase';

export { getSupabaseClient };

type Row = Record<string, any>;
type Where = { col: string; op: string; val: any };

export interface DocRef {
  id: string;
  _table: string;
}

export interface DocSnapshot {
  id: string;
  data: () => Row;
  exists: () => boolean;
  ref: DocRef;
}

export interface Snapshot {
  docs: DocSnapshot[];
  empty: boolean;
}

/* ---------------------------------- utilidades ---------------------------------- */

const SERVER_TS_MARKER = { __serverTimestamp: true as const };

function pkFor(table: string): string {
  if (table === 'users' || table === 'users_private') return 'uid';
  if (table === 'settings') return 'key';
  return 'id';
}

/** Marcador de firebase-compat para usar en writes (Placeholder de Firestore). */
export function serverTimestamp(): typeof SERVER_TS_MARKER {
  return { ...SERVER_TS_MARKER };
}

function nowIso(): string {
  return new Date().toISOString();
}

function cleanWriteValue(v: any): any {
  if (v && typeof v === 'object' && v.__serverTimestamp === true) return nowIso();
  if (Array.isArray(v)) return v.map(cleanWriteValue);
  if (v && typeof v === 'object' && !(v instanceof Date) && !(v instanceof Uint8Array)) {
    const out: Row = {};
    for (const k of Object.keys(v)) out[k] = cleanWriteValue((v as Row)[k]);
    return out;
  }
  return v;
}

export function cleanWrite(data: Row): Row {
  const out: Row = {};
  for (const k of Object.keys(data ?? {})) {
    const key = toSnake(k);
    out[key === 'id' ? 'id' : key] = cleanWriteValue(data[k]);
  }
  return out;
}

export function toSnake(key: string): string {
  if (!/[A-Z]/.test(key)) return key;
  return key
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    .replace(/([a-z\d])([A-Z])/g, '$1_$2')
    .toLowerCase();
}

export function snakeToCamel(key: string): string {
  return key.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());
}

export function rowToSnapshot(row: Row | null, table = 'unknown_table'): DocSnapshot {
  const pk = pkFor(table);
  const rowId = row ? String(row[pk] ?? row.id ?? '') : '';
  const out: Row = {};
  if (row) {
    for (const key of Object.keys(row)) {
      out[snakeToCamel(key)] = row[key];
    }
    // Ensure both id and pk alias are present in data for compatibility
    out.id = rowId;
    if (pk !== 'id') out[snakeToCamel(pk)] = rowId;
  }
  return {
    id: rowId,
    data: () => out,
    exists: () => Boolean(row),
    ref: { id: rowId, _table: table },
  };
}

async function singleRow(table: string, id: string): Promise<Row | null> {
  if (SERVER_TABLES.has(table)) {
    const url = isAdminUser() || table !== 'gift_cards'
      ? `/api/admin/${table}/${encodeURIComponent(id)}`
      : `/api/gift-cards/${encodeURIComponent(id)}`;
    const res = await adminFetch('GET', url);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Admin ${table}.get failed: ${await adminError(res)}`);
    return (await res.json()) as Row;
  }
  const pk = pkFor(table);
  const { data, error } = await getSupabaseClient()
    .from(table)
    .select('*')
    .eq(pk, id)
    .limit(1)
    .maybeSingle();
  if (error && error.code !== 'PGRST116') throw new Error(`Supabase ${table}.get failed: ${error.message}`);
  return data ?? null;
}

/* --------------------------------- queries --------------------------------- */

type SupabaseFilter = 'eq' | 'neq' | 'lt' | 'lte' | 'gt' | 'gte' | 'in' | 'contains';

function fireOpToSupabase(op: string): SupabaseFilter {
  switch (op) {
    case '==': return 'eq';
    case '!=': return 'neq';
    case '<': return 'lt';
    case '<=': return 'lte';
    case '>': return 'gt';
    case '>=': return 'gte';
    case 'in': return 'in';
    case 'array-contains': return 'contains';
    default: throw new Error(`firestoreAdapter: operador '${op}' no soportado en where()`);
  }
}

function applyFilter(q: any, f: Where, table: string): any {
  const op = fireOpToSupabase(f.op);
  let col = toSnake(f.col);
  const pk = pkFor(table);
  if (col === 'id' && pk !== 'id') col = pk;
  switch (op) {
    case 'eq': return q.eq(col, f.val);
    case 'neq': return q.neq(col, f.val);
    case 'lt': return q.lt(col, f.val);
    case 'lte': return q.lte(col, f.val);
    case 'gt': return q.gt(col, f.val);
    case 'gte': return q.gte(col, f.val);
    case 'in': return q.in(col, f.val as any[]);
    case 'contains': return q.contains(col, f.val as any[]);
  }
}

class CollectionQuery {
  constructor(
    public table: string,
    public filters: Where[] = [],
    public order?: { col: string; desc?: boolean }
  ) {}

  where(col: string, op: string, val: any): CollectionQuery {
    return new CollectionQuery(this.table, [...this.filters, { col, op, val }], this.order);
  }

  orderBy(col: string, dir: 'asc' | 'desc' = 'asc'): CollectionQuery {
    return new CollectionQuery(this.table, this.filters, { col, desc: dir === 'desc' });
  }

  doc(id: string): DocRef {
    return { id, _table: this.table };
  }

  async get(): Promise<Snapshot> {
    return getDocs(this);
  }

  /* Interfaz usada: PlatformContext */
}

function collectionTable(path: string[]): string {
  // Collection anidada: forumThreads/{id}/replies → tabla forum_replies
  if (path.length >= 3 && path[0] === 'forumThreads') return 'forum_replies';
  return toSnake(path[path.length - 1]);
}

export function collection(_db: unknown, ...path: string[]): CollectionQuery {
  return new CollectionQuery(collectionTable(path));
}

export function where(col: string, op: string, val: any): Where {
  return { col, op, val };
}

export function query(q: CollectionQuery, ...wheres: Where[]): CollectionQuery {
  let result = q;
  for (const w of wheres) result = result.where(w.col, w.op, w.val);
  return result;
}

export async function getDocs(q: CollectionQuery): Promise<Snapshot> {
  if (SERVER_TABLES.has(q.table)) {
    // Los listados de tablas protegidas se sirven desde el backend con service_role.
    const url = isAdminUser()
      ? `/api/admin/${q.table}`
      : q.table === 'gift_card_redemptions'
        ? '/api/gift-card-redemptions'
        : `/api/admin/${q.table}`;
    const res = await adminFetch('GET', url);
    if (!res.ok) throw new Error(`Admin ${q.table}.list failed: ${await adminError(res)}`);
    const rows = (await res.json()) as Row[];
    const docs = rows.map((row) => rowToSnapshot(row, q.table));
    return { docs, empty: docs.length === 0 };
  }
  let sb: any = getSupabaseClient().from(q.table).select('*');
  for (const f of q.filters) sb = applyFilter(sb, f, q.table) as typeof sb;
  if (q.order) {
    let orderCol = toSnake(q.order.col);
    const pk = pkFor(q.table);
    if (orderCol === 'id' && pk !== 'id') orderCol = pk;
    sb = sb.order(orderCol, { ascending: !q.order.desc }) as typeof sb;
  }
  const { data, error } = await sb;
  if (error) throw new Error(`Supabase ${q.table}.select failed: ${error.message}`);
  const docs = (data as Row[]).map((row) => rowToSnapshot(row, q.table));
  return { docs, empty: docs.length === 0 };
}

/* --------------------------------- refs --------------------------------- */

/**
 * Tablas cuyas escrituras (insert/update/delete) se redirigen al backend
 * admin (server.ts con service_role) porque RLS solo permite lectura pública.
 */
const ADMIN_WRITE_TABLES = new Set(['courses', 'gift_cards', 'gift_card_redemptions']);

/** Tablas con RLS sólo para service_role: se leen/escriben vía backend, nunca con la key anónima. */
// `courses` tiene lectura pública (public_read) y se sigue leyendo con la key del cliente.
const SERVER_TABLES = new Set(['gift_cards', 'gift_card_redemptions']);
const isAdminUser = (): boolean => isAuthorizedAdminEmail(auth.currentUser?.email);

async function adminFetch(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  body?: Row,
): Promise<Response> {
  const token: string | null = auth.currentUser
    ? await auth.currentUser.getIdToken().catch(() => null)
    : null;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return fetch(path, { method, headers, body: body != null ? JSON.stringify(body) : undefined });
}

/** Extrae el motivo real del error del backend (antes sólo se veía "Not Found"). */
async function adminError(res: Response): Promise<string> {
  const body = await res.json().catch(() => null) as { error?: unknown } | null;
  const detail = typeof body?.error === 'string' && body.error.trim() ? body.error.trim() : res.statusText;
  return `${res.status} ${detail || 'sin detalle'}`.trim();
}

export async function getDoc(ref: DocRef): Promise<DocSnapshot> {
  const row = await singleRow(ref._table, ref.id);
  return rowToSnapshot(row);
}

export async function setDoc(ref: DocRef, data: Row, _options?: unknown): Promise<void> {
  if (ADMIN_WRITE_TABLES.has(ref._table)) {
    // PUT /api/admin/:table/:id ya es un UPSERT en el servidor (crea o actualiza).
    // No se hace fallback a POST: si la ruta PUT no existe, el POST tampoco y
    // sólo convierte el error en un engañoso "Not Found" (issue courses.set).
    const res = await adminFetch(
      'PUT',
      `/api/admin/${ref._table}/${encodeURIComponent(ref.id)}`,
      data
    );
    if (!res.ok) {
      const detail = await adminError(res);
      if (res.status === 404) {
        throw new Error(
          `Admin ${ref._table}.set failed: ${detail} — el endpoint PUT /api/admin/${ref._table}/:id no está disponible en este despliegue (se necesita el servidor Express, no sólo el build estático).`
        );
      }
      throw new Error(`Admin ${ref._table}.set failed: ${detail}`);
    }
    return;
  }
  const pk = pkFor(ref._table);
  const cleaned = cleanWrite(data);
  if (pk !== 'id') delete cleaned.id;
  cleaned[pk] = ref.id;
  const existing = await singleRow(ref._table, ref.id);
  const { error } = existing
    ? await getSupabaseClient().from(ref._table).update(cleaned).eq(pk, ref.id).select('*').maybeSingle()
    : await getSupabaseClient().from(ref._table).insert(cleaned).select('*').maybeSingle();
  if (error) throw new Error(`Supabase ${ref._table}.set/${existing ? 'update' : 'insert'} failed: ${error.message}`);
}

export async function updateDoc(ref: DocRef, data: Row, _options?: unknown): Promise<void> {
  if (ADMIN_WRITE_TABLES.has(ref._table)) {
    const res = await adminFetch(
      'PUT',
      `/api/admin/${ref._table}/${encodeURIComponent(ref.id)}`,
      data
    );
    if (!res.ok) throw new Error(`Admin ${ref._table}.update failed: ${await adminError(res)}`);
    return;
  }
  const pk = pkFor(ref._table);
  const existing = await singleRow(ref._table, ref.id);
  if (!existing) throw new Error(`Supabase updateDoc: documento ${ref.id} de '${ref._table}' no existe`);
  const cleaned = cleanWrite(data);
  if (pk !== 'id') delete cleaned.id;
  const { error } = await getSupabaseClient().from(ref._table).update(cleaned).eq(pk, ref.id);
  if (error) throw new Error(`Supabase ${ref._table}.update failed: ${error.message}`);
}

export async function deleteDoc(ref: DocRef): Promise<void> {
  if (ADMIN_WRITE_TABLES.has(ref._table)) {
    const res = await adminFetch('DELETE', `/api/admin/${ref._table}/${encodeURIComponent(ref.id)}`);
    if (!res.ok) throw new Error(`Admin ${ref._table}.delete failed: ${await adminError(res)}`);
    return;
  }
  const pk = pkFor(ref._table);
  const { error } = await getSupabaseClient().from(ref._table).delete().eq(pk, ref.id).select('*').maybeSingle();
  if (error) throw new Error(`Supabase ${ref._table}.delete failed: ${error.message}`);
}

/**
 * Marcador aplicado por PlatformContext con `collection(db, 'x')`; el valor
 * real no se usa porque todas las operaciones vienen argumentadas.
 */
export const db: unknown = undefined;

export function doc(db: unknown, ...path: string[]): DocRef {
  // Documentos anidados: users/{uid}/private/info → tabla users_private (id = uid)
  if (path[0] === 'users' && path.length >= 3 && path[2]?.toLowerCase() === 'private') {
    return { id: String(path[1]), _table: 'users_private' };
  }
  // path = ['collection', 'docId']  → table=collection, id=docId
  // path = ['col', 'parentId', 'subCol', 'docId'] → table=subCol, id=docId
  const table = toSnake(path[path.length - 2]);  // colección (penúltimo)
  const id    = path[path.length - 1];           // id del documento (último)
  return { id: String(id), _table: table };
}

/* ------------------------------ write batch ------------------------------ */

export interface Batch {
  set(ref: DocRef, data: Row, _options?: unknown): Batch;
  update(ref: DocRef, data: Row, _options?: unknown): Batch;
  delete(ref: DocRef): Batch;
  commit(): Promise<void>;
}

interface PendingOp {
  type: 'insert' | 'update' | 'delete';
  table: string;
  id: string;
  data?: Row;
}

export function writeBatch(_db: unknown): Batch {
  const ops: PendingOp[] = [];
  return {
    set(ref: DocRef, data: Row, _options?: unknown) {
      const pk = pkFor(ref._table);
      const cleaned = cleanWrite(data);
      if (pk !== 'id') delete cleaned.id;
      cleaned[pk] = ref.id;
      ops.push({ type: 'insert', table: ref._table, id: ref.id, data: cleaned });
      return this;
    },
    update(ref: DocRef, data: Row, _options?: unknown) {
      const pk = pkFor(ref._table);
      const cleaned = cleanWrite(data);
      if (pk !== 'id') delete cleaned.id;
      ops.push({ type: 'update', table: ref._table, id: ref.id, data: cleaned });
      return this;
    },
    delete(ref: DocRef) {
      ops.push({ type: 'delete', table: ref._table, id: ref.id });
      return this;
    },
    async commit() {
      for (const op of ops) {
        if (ADMIN_WRITE_TABLES.has(op.table)) {
          const res =
            op.type === 'delete'
              ? await adminFetch('DELETE', `/api/admin/${op.table}/${encodeURIComponent(op.id)}`)
              : await adminFetch('PUT', `/api/admin/${op.table}/${encodeURIComponent(op.id)}`, op.data ?? {});
          if (!res.ok) {
            throw new Error(`Admin ${op.table}.batch.${op.type} failed: ${await adminError(res)}`);
          }
          continue;
        }
        const pk = pkFor(op.table);
        if (op.type === 'delete') {
          const { error } = await getSupabaseClient().from(op.table).delete().eq(pk, op.id).select(pk).maybeSingle();
          if (error) throw new Error(`Supabase ${op.table}.batch.delete failed: ${error.message}`);
        } else if (op.type === 'insert') {
          // upsert semantics for set
          const { error } = await getSupabaseClient().from(op.table).upsert(op.data ?? {}, { onConflict: pk }).select(pk).maybeSingle();
          if (error) throw new Error(`Supabase ${op.table}.batch.insert failed: ${error.message}`);
        } else {
          const { error } = await getSupabaseClient().from(op.table).update(op.data ?? {}).eq(pk, op.id).select(pk).maybeSingle();
          if (error) throw new Error(`Supabase ${op.table}.batch.update failed: ${error.message}`);
        }
      }
    },
  };
}

/* --------------------------------- misc API --------------------------------- */

export function enableNetwork(_db: unknown): Promise<void> {
  return Promise.resolve();
}

export class Timestamp {
  private readonly _iso: string;
  private constructor(iso: string) { this._iso = iso; }
  static fromDate(date: Date): Timestamp { return new Timestamp(date.toISOString()); }
  toDate(): Date { return new Date(this._iso); }
  toMillis(): number { return this.toDate().getTime(); }
  toISOString(): string { return this._iso; }
}

export async function runTransaction(_db: unknown, fn: (tx: any) => Promise<any> | any): Promise<any> {
  const tx = {
    get: (ref: DocRef) => getDoc(ref),
    set: (ref: DocRef, data: Row) => setDoc(ref, data),
    update: (ref: DocRef, data: Row) => updateDoc(ref, data),
    delete: (ref: DocRef) => deleteDoc(ref),
  };
  return fn(tx);
}

/* ------------------------------ onSnapshot ------------------------------ */

export function onSnapshot(
  target: CollectionQuery,
  listener: (snap: Snapshot) => void,
  errorListener?: (err: any) => void
): () => void;
export function onSnapshot(
  target: DocRef,
  listener: (snap: DocSnapshot) => void,
  errorListener?: (err: any) => void
): () => void;
export function onSnapshot(
  target: CollectionQuery | DocRef,
  listener: (snap: any) => void,
  errorListener?: (err: any) => void
): () => void {
  const isQuery = 'table' in target && 'filters' in target;
  let lastHash = '';
  const poll = async () => {
    try {
      let hash: string;
      if (isQuery) {
        const snap = await getDocs(target as CollectionQuery);
        const rows = await Promise.all(snap.docs.map(async (d) => ({ id: d.id, data: await d.data() })));
        hash = rows.map((r) => `${r.id}:${JSON.stringify(r.data)}`).join('|');
        if (hash !== lastHash) { lastHash = hash; listener(snap); }
      } else {
        const snap = await getDoc(target as DocRef);
        const data = snap.data();
        hash = `${snap.id}:${JSON.stringify(data)}`;
        if (hash !== lastHash) { lastHash = hash; listener(snap); }
      }
    } catch (err) {
      if (errorListener) errorListener(err);
      else console.warn('onSnapshot poll error:', err);
    }
  };
  void poll();
  const timer = window.setInterval(() => void poll(), 1500);
  return () => window.clearInterval(timer);
}

export type { Snapshot as FirestoreSnapshot };
