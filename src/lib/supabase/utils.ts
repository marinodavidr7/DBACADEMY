export type Row = Record<string, any>;

export interface DocRef {
  id: string;
  _table: string;
  _fsPath?: string[];
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

export function pkFor(table: string): string {
  if (table === 'users' || table === 'users_private') return 'uid';
  if (table === 'settings') return 'key';
  return 'id';
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

function nowIso(): string {
  return new Date().toISOString();
}

export function cleanWriteValue(v: any): any {
  if (v && typeof v === 'object' && v.__serverTimestamp === true) return nowIso();
  if (v instanceof Date) return v.toISOString();
  if (v && typeof v === 'object' && typeof v.toDate === 'function') {
    return (v.toDate() as Date).toISOString();
  }
  if (Array.isArray(v)) return v.map(cleanWriteValue);
  if (v && typeof v === 'object' && !(v instanceof Uint8Array)) {
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

export function rowToSnapshot(row: Row | null, table = 'unknown_table'): DocSnapshot {
  const pk = pkFor(table);
  const rowId = row ? String(row[pk] ?? row.id ?? '') : '';
  const out: Row = {};
  if (row) {
    for (const key of Object.keys(row)) {
      out[snakeToCamel(key)] = row[key];
    }
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
