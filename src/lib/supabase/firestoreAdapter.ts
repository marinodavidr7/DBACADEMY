/**
 * Firestore API adapter → Supabase (Postgres), con fallback automático a Firebase Firestore
 * cuando las variables de entorno de Supabase (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)
 * no están configuradas en el entorno actual (p. ej. preview de AI Studio).
 */
import {
  collection as fsCollection,
  deleteDoc as fsDeleteDoc,
  doc as fsDoc,
  enableNetwork as fsEnableNetwork,
  getDoc as fsGetDoc,
  getDocs as fsGetDocs,
  onSnapshot as fsOnSnapshot,
  orderBy as fsOrderBy,
  query as fsQuery,
  runTransaction as fsRunTransaction,
  serverTimestamp as fsServerTimestamp,
  setDoc as fsSetDoc,
  Timestamp,
  updateDoc as fsUpdateDoc,
  where as fsWhere,
  writeBatch as fsWriteBatch,
  type DocumentData,
  type DocumentReference,
  type DocumentSnapshot as FsDocumentSnapshot,
  type Query,
  type QueryConstraint,
  type SetOptions,
  type WhereFilterOp,
} from 'firebase/firestore';
import { getSupabaseClient, isSupabaseConfigured } from './client';
import {
  cleanWrite,
  pkFor,
  rowToSnapshot,
  snakeToCamel,
  toSnake,
  type DocRef,
  type DocSnapshot,
  type Row,
  type Snapshot,
} from './utils';
import { auth, db as firestoreDb, isAuthorizedAdminEmail } from '../../firebase';

export { getSupabaseClient, isSupabaseConfigured };
export { cleanWrite, rowToSnapshot, toSnake, snakeToCamel };
export type { DocRef, DocSnapshot, Snapshot };
export { Timestamp };

type Where = { col: string; op: string; val: any };

const SERVER_TS_MARKER = { __serverTimestamp: true as const };

/** Marcador de firebase-compat para usar en writes (Placeholder de Firestore). */
export function serverTimestamp(): any {
  return isSupabaseConfigured() ? { ...SERVER_TS_MARKER } : fsServerTimestamp();
}

/* -------------------------- Firestore fallback helpers -------------------------- */

function toFsDocRef(ref: DocRef): DocumentReference<DocumentData> {
  if (ref._fsPath && ref._fsPath.length >= 2) {
    const [first, ...rest] = ref._fsPath;
    return fsDoc(firestoreDb, first, ...rest);
  }
  return fsDoc(firestoreDb, ref._table, ref.id);
}

function toFsQuery(q: CollectionQuery): Query<DocumentData> {
  const [first, ...rest] = q.path.length > 0 ? q.path : [q.table];
  const base = fsCollection(firestoreDb, first, ...rest);
  const constraints: QueryConstraint[] = q.filters.map((f) =>
    fsWhere(f.col, f.op as WhereFilterOp, f.val)
  );
  if (q.order) {
    constraints.push(fsOrderBy(q.order.col, q.order.desc ? 'desc' : 'asc'));
  }
  return constraints.length > 0 ? fsQuery(base, ...constraints) : base;
}

function wrapFsDocSnap(
  fsSnap: FsDocumentSnapshot<DocumentData>,
  table: string,
  fsPath?: string[]
): DocSnapshot {
  const pathParts =
    fsPath ?? (fsSnap.ref?.path ? fsSnap.ref.path.split('/') : [table, fsSnap.id]);
  const raw = fsSnap.exists() ? (fsSnap.data() as Row) : null;
  return {
    id: fsSnap.id,
    data: () => (raw ? { ...raw, id: raw.id ?? fsSnap.id } : {}),
    exists: () => fsSnap.exists(),
    ref: { id: fsSnap.id, _table: table, _fsPath: pathParts },
  };
}

/* ---------------------------------- Supabase helpers ---------------------------------- */

async function singleRow(table: string, id: string): Promise<Row | null> {
  if (SERVER_TABLES.has(table)) {
    if (isAdminUser()) {
      const res = await adminFetch('GET', `/api/admin/${table}/${encodeURIComponent(id)}`);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`Admin ${table}.get failed: ${await adminError(res)}`);
      return (await res.json()) as Row;
    }
    if (table === 'gift_cards') {
      const res = await adminFetch('GET', `/api/gift-cards/${encodeURIComponent(id)}`);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`Supabase gift_cards.get failed: ${await adminError(res)}`);
      return (await res.json()) as Row;
    }
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
    public order?: { col: string; desc?: boolean },
    public path: string[] = [table]
  ) {}

  where(col: string, op: string, val: any): CollectionQuery {
    return new CollectionQuery(this.table, [...this.filters, { col, op, val }], this.order, this.path);
  }

  orderBy(col: string, dir: 'asc' | 'desc' = 'asc'): CollectionQuery {
    return new CollectionQuery(this.table, this.filters, { col, desc: dir === 'desc' }, this.path);
  }

  doc(id: string): DocRef {
    return { id, _table: this.table, _fsPath: [...this.path, id] };
  }

  async get(): Promise<Snapshot> {
    return getDocs(this);
  }
}

function collectionTable(path: string[]): string {
  // Collection anidada: forumThreads/{id}/replies → tabla forum_replies
  if (path.length >= 3 && path[0] === 'forumThreads') return 'forum_replies';
  return toSnake(path[path.length - 1]);
}

export function collection(_db: unknown, ...path: string[]): CollectionQuery {
  return new CollectionQuery(collectionTable(path), [], undefined, path);
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
  if (!isSupabaseConfigured()) {
    const snap = await fsGetDocs(toFsQuery(q));
    const docs = snap.docs.map((d) => wrapFsDocSnap(d, q.table, [...q.path, d.id]));
    return { docs, empty: docs.length === 0 };
  }
  if (SERVER_TABLES.has(q.table) && isAdminUser()) {
    // Listados del panel de administración: se sirven con service_role.
    const res = await adminFetch('GET', `/api/admin/${q.table}`);
    if (!res.ok) throw new Error(`Admin ${q.table}.list failed: ${await adminError(res)}`);
    const rows = (await res.json()) as Row[];
    const docs = rows.map((row) => rowToSnapshot(row, q.table));
    return { docs, empty: docs.length === 0 };
  }
  if (q.table === 'gift_card_redemptions' && !isAdminUser()) {
    const res = await adminFetch('GET', '/api/gift-card-redemptions');
    if (!res.ok) throw new Error(`Supabase gift_card_redemptions.list failed: ${await adminError(res)}`);
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

const ADMIN_WRITE_TABLES = new Set(['courses', 'gift_cards', 'gift_card_redemptions']);

const SERVER_TABLES = new Set([
  'gift_cards', 'gift_card_redemptions', 'enrollments', 'payments', 'certificates', 'users_private',
]);
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

async function adminError(res: Response): Promise<string> {
  const body = await res.json().catch(() => null) as { error?: unknown } | null;
  const detail = typeof body?.error === 'string' && body.error.trim() ? body.error.trim() : res.statusText;
  return `${res.status} ${detail || 'sin detalle'}`.trim();
}

export async function getDoc(ref: DocRef): Promise<DocSnapshot> {
  if (!isSupabaseConfigured()) {
    const fsSnap = await fsGetDoc(toFsDocRef(ref));
    return wrapFsDocSnap(fsSnap, ref._table, ref._fsPath);
  }
  const row = await singleRow(ref._table, ref.id);
  return rowToSnapshot(row, ref._table);
}

export async function setDoc(ref: DocRef, data: Row, options?: unknown): Promise<void> {
  if (!isSupabaseConfigured()) {
    if (options && typeof options === 'object') {
      await fsSetDoc(toFsDocRef(ref), data, options as SetOptions);
    } else {
      await fsSetDoc(toFsDocRef(ref), data);
    }
    return;
  }
  if (ADMIN_WRITE_TABLES.has(ref._table)) {
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
  if (!isSupabaseConfigured()) {
    await fsUpdateDoc(toFsDocRef(ref), data);
    return;
  }
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
  if (!isSupabaseConfigured()) {
    await fsDeleteDoc(toFsDocRef(ref));
    return;
  }
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
 * En Supabase no se usa el objeto `db`; cuando cae en fallback Firestore usa la instancia real.
 */
export const db: unknown = firestoreDb;

export function doc(_db: unknown, ...path: string[]): DocRef {
  // Documentos anidados: users/{uid}/private/info → tabla users_private (id = uid)
  if (path[0] === 'users' && path.length >= 3 && path[2]?.toLowerCase() === 'private') {
    return { id: String(path[1]), _table: 'users_private', _fsPath: path };
  }
  const table = toSnake(path[path.length - 2]);
  const id = path[path.length - 1];
  return { id: String(id), _table: table, _fsPath: path };
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
  if (!isSupabaseConfigured()) {
    const fsBatch = fsWriteBatch(firestoreDb);
    const wrapped: Batch = {
      set(ref, data, options) {
        if (options && typeof options === 'object') {
          fsBatch.set(toFsDocRef(ref), data, options as SetOptions);
        } else {
          fsBatch.set(toFsDocRef(ref), data);
        }
        return wrapped;
      },
      update(ref, data) {
        fsBatch.update(toFsDocRef(ref), data);
        return wrapped;
      },
      delete(ref) {
        fsBatch.delete(toFsDocRef(ref));
        return wrapped;
      },
      commit() {
        return fsBatch.commit();
      },
    };
    return wrapped;
  }

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
  if (!isSupabaseConfigured()) {
    return fsEnableNetwork(firestoreDb);
  }
  return Promise.resolve();
}

export async function runTransaction(_db: unknown, fn: (tx: any) => Promise<any> | any): Promise<any> {
  if (!isSupabaseConfigured()) {
    return fsRunTransaction(firestoreDb, async (fsTx) => {
      const tx = {
        get: async (ref: DocRef) => {
          const snap = await fsTx.get(toFsDocRef(ref));
          return wrapFsDocSnap(snap, ref._table, ref._fsPath);
        },
        set: (ref: DocRef, data: Row, options?: unknown) => {
          if (options && typeof options === 'object') {
            fsTx.set(toFsDocRef(ref), data, options as SetOptions);
          } else {
            fsTx.set(toFsDocRef(ref), data);
          }
        },
        update: (ref: DocRef, data: Row) => fsTx.update(toFsDocRef(ref), data),
        delete: (ref: DocRef) => fsTx.delete(toFsDocRef(ref)),
      };
      return fn(tx);
    });
  }
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

  if (!isSupabaseConfigured()) {
    if (isQuery) {
      const q = target as CollectionQuery;
      return fsOnSnapshot(
        toFsQuery(q),
        (fsSnap) => {
          const docs = fsSnap.docs.map((d) => wrapFsDocSnap(d, q.table, [...q.path, d.id]));
          listener({ docs, empty: docs.length === 0 });
        },
        (err) => {
          if (errorListener) errorListener(err);
          else console.warn('Firestore onSnapshot query error:', err);
        }
      );
    }
    const ref = target as DocRef;
    return fsOnSnapshot(
      toFsDocRef(ref),
      (fsSnap) => {
        listener(wrapFsDocSnap(fsSnap, ref._table, ref._fsPath));
      },
      (err) => {
        if (errorListener) errorListener(err);
        else console.warn('Firestore onSnapshot doc error:', err);
      }
    );
  }

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
