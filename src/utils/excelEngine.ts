export type CellPrimitive = string | number;
export type SheetCells = Record<string, CellPrimitive>;

export const ALL_COLS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'] as const;
export const MAX_ROWS = 40;
export const COLS = ['A', 'B', 'C', 'D'] as const;
export const ROWS = [1, 2, 3, 4, 5, 6] as const;

export function getSheetDimensions(
  cells: SheetCells,
  targetCell?: string,
  minCols = 4,
  minRows = 6,
  extraCells?: SheetCells
): { cols: string[]; rows: number[] } {
  let maxColIdx = Math.max(0, minCols - 1);
  let maxRow = minRows;

  const inspectKey = (key: string) => {
    const match = key.trim().match(/^([A-L])(\d+)$/i);
    if (!match) return;
    const colIdx = ALL_COLS.indexOf(match[1].toUpperCase() as (typeof ALL_COLS)[number]);
    const rowNum = Number(match[2]);
    if (colIdx > maxColIdx) maxColIdx = colIdx;
    if (rowNum > maxRow && rowNum <= MAX_ROWS) maxRow = rowNum;
  };

  Object.keys(cells).forEach(inspectKey);
  if (extraCells) Object.keys(extraCells).forEach(inspectKey);
  if (targetCell) inspectKey(targetCell);

  return {
    cols: ALL_COLS.slice(0, Math.min(ALL_COLS.length, maxColIdx + 1)) as unknown as string[],
    rows: Array.from({ length: Math.min(MAX_ROWS, maxRow) }, (_, i) => i + 1),
  };
}

const EXCEL_ERRORS = new Set([
  '#DIV/0!',
  '#¡VALOR!',
  '#REF!',
  '#N/A',
  '#¿NOMBRE?',
  '#ERROR!',
]);

export function isExcelError(val: unknown): boolean {
  return typeof val === 'string' && EXCEL_ERRORS.has(val);
}

export function toNumeric(v: CellPrimitive): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const trimmed = v.trim();
  if (trimmed === '') return null;
  const n = Number(trimmed.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function splitArgs(raw: string): string[] {
  const args: string[] = [];
  let current = '';
  let depth = 0;
  let inQuotes = false;

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      current += ch;
      continue;
    }
    if (!inQuotes) {
      if (ch === '(') depth++;
      else if (ch === ')') depth = Math.max(0, depth - 1);
      else if ((ch === ';' || ch === ',') && depth === 0) {
        args.push(current.trim());
        current = '';
        continue;
      }
    }
    current += ch;
  }
  if (current.trim().length > 0 || args.length > 0) {
    args.push(current.trim());
  }
  return args;
}

function isWrappedInMatchingParens(s: string): boolean {
  if (!s.startsWith('(') || !s.endsWith(')')) return false;
  let depth = 0;
  let inQuotes = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (!inQuotes) {
      if (ch === '(') depth++;
      else if (ch === ')') {
        depth--;
        if (depth === 0 && i < s.length - 1) return false;
      }
    }
  }
  return depth === 0;
}

function parseCellRef(token: string): { sheet?: string; col: string; row: number } | null {
  const cleaned = token.trim();
  const match = cleaned.match(/^(?:([A-Za-z0-9_]+)!)?\$?([A-L])\$?([1-9]|[1-3][0-9]|40)$/i);
  if (!match) return null;
  return {
    sheet: match[1],
    col: match[2].toUpperCase(),
    row: Number(match[3]),
  };
}

function expandRange(
  rangeToken: string,
  primary: SheetCells,
  secondary?: { name: string; cells: SheetCells },
  visibleRows?: Set<number>
): { values: CellPrimitive[]; allRows: number[] } | null {
  const cleaned = rangeToken.trim();
  const parts = cleaned.split(':');
  if (parts.length !== 2) return null;

  const start = parseCellRef(parts[0]);
  const end = parseCellRef(parts[1]);
  if (!start || !end) return null;

  const sheetName = start.sheet || end.sheet;
  const source =
    sheetName && secondary && sheetName.toLowerCase() === secondary.name.toLowerCase()
      ? secondary.cells
      : primary;

  const c1 = ALL_COLS.indexOf(start.col as (typeof ALL_COLS)[number]);
  const c2 = ALL_COLS.indexOf(end.col as (typeof ALL_COLS)[number]);
  if (c1 < 0 || c2 < 0) return null;

  const minC = Math.min(c1, c2);
  const maxC = Math.max(c1, c2);
  const minR = Math.min(start.row, end.row);
  const maxR = Math.max(start.row, end.row);

  const values: CellPrimitive[] = [];
  const allRows: number[] = [];
  for (let r = minR; r <= maxR; r++) {
    if (visibleRows && !visibleRows.has(r)) continue;
    for (let c = minC; c <= maxC; c++) {
      const addr = `${ALL_COLS[c]}${r}`;
      values.push(source[addr] ?? '');
      allRows.push(r);
    }
  }
  return { values, allRows };
}

function matchCriteria(cellVal: CellPrimitive, rawCriterion: CellPrimitive): boolean {
  const critStr = String(rawCriterion).trim();
  const opMatch = critStr.match(/^(>=|<=|<>|>|<|=)(.*)$/);
  if (opMatch) {
    const [, op, rhsRaw] = opMatch;
    const rhsNum = toNumeric(rhsRaw);
    const cellNum = toNumeric(cellVal);
    if (rhsNum !== null && cellNum !== null) {
      if (op === '>') return cellNum > rhsNum;
      if (op === '<') return cellNum < rhsNum;
      if (op === '>=') return cellNum >= rhsNum;
      if (op === '<=') return cellNum <= rhsNum;
      if (op === '=') return cellNum === rhsNum;
      if (op === '<>') return cellNum !== rhsNum;
    }
    const lhsText = String(cellVal).toLowerCase();
    const rhsText = rhsRaw.trim().toLowerCase();
    if (op === '=') return lhsText === rhsText;
    if (op === '<>') return lhsText !== rhsText;
    return false;
  }

  const critNum = toNumeric(critStr);
  const cellNum = toNumeric(cellVal);
  if (critNum !== null && cellNum !== null) {
    return cellNum === critNum;
  }
  if (critStr.includes('*') || critStr.includes('?')) {
    const escaped = critStr
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    return new RegExp(`^${escaped}$`, 'i').test(String(cellVal));
  }
  return String(cellVal).trim().toLowerCase() === critStr.toLowerCase();
}

function splitByTopLevelOp(s: string, ops: string[]): string[] {
  const parts: string[] = [];
  let cur = '';
  let depth = 0;
  let inQuotes = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      cur += ch;
      continue;
    }
    if (!inQuotes) {
      if (ch === '(') depth++;
      else if (ch === ')') depth--;
      else if (depth === 0 && ops.includes(ch)) {
        parts.push(cur);
        cur = '';
        continue;
      }
    }
    cur += ch;
  }
  parts.push(cur);
  return parts;
}

function findTopLevelComparison(s: string): { left: string; op: string; right: string } | null {
  let depth = 0;
  let inQuotes = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === '"') inQuotes = !inQuotes;
    if (inQuotes) continue;
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    else if (depth === 0) {
      const two = s.slice(i, i + 2);
      if (two === '>=' || two === '<=' || two === '<>') {
        return { left: s.slice(0, i), op: two, right: s.slice(i + 2) };
      }
      if (ch === '>' || ch === '<' || ch === '=') {
        return { left: s.slice(0, i), op: ch, right: s.slice(i + 1) };
      }
    }
  }
  return null;
}

function splitTopLevelArithmetic(
  s: string,
  ops: string[]
): Array<{ op: string; expr: string }> | null {
  const items: Array<{ op: string; expr: string }> = [];
  let cur = '';
  let depth = 0;
  let inQuotes = false;
  let currentOp = '+';

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      cur += ch;
      continue;
    }
    if (!inQuotes) {
      if (ch === '(') depth++;
      else if (ch === ')') depth--;
      else if (depth === 0 && ops.includes(ch)) {
        if (cur.trim() === '' && items.length === 0 && (ch === '-' || ch === '+')) {
          cur += ch;
          continue;
        }
        items.push({ op: currentOp, expr: cur });
        currentOp = ch;
        cur = '';
        continue;
      }
    }
    cur += ch;
  }
  if (items.length === 0) return null;
  items.push({ op: currentOp, expr: cur });
  return items;
}

export function evaluateExcelFormula(
  rawInput: CellPrimitive,
  primary: SheetCells,
  secondary?: { name: string; cells: SheetCells },
  visibleRows?: Set<number>,
  depth = 0
): CellPrimitive {
  if (typeof rawInput === 'number') return rawInput;
  const text = rawInput;
  if (!text.startsWith('=')) return text;
  if (depth > 8) return '#ERROR!';

  const expr = text.slice(1).trim();
  if (!expr) return '';

  const evalCell = (addr: string, sheet?: string): CellPrimitive => {
    const src =
      sheet && secondary && sheet.toLowerCase() === secondary.name.toLowerCase()
        ? secondary.cells
        : primary;
    const raw = src[addr] ?? '';
    if (typeof raw === 'string' && raw.startsWith('=')) {
      return evaluateExcelFormula(raw, primary, secondary, visibleRows, depth + 1);
    }
    return raw;
  };

  const evalExpression = (sub: string): CellPrimitive => {
    const s = sub.trim();
    if (!s) return '';

    if (s.startsWith('"') && s.endsWith('"') && !s.slice(1, -1).includes('"')) {
      return s.slice(1, -1);
    }

    const upper = s.toUpperCase();
    if (upper === 'VERDADERO' || upper === 'TRUE') return 'VERDADERO';
    if (upper === 'FALSO' || upper === 'FALSE') return 'FALSO';

    if (/^-?\d+(\.\d+)?$/.test(s)) {
      return Number(s);
    }

    const singleRef = parseCellRef(s);
    if (singleRef) {
      return evalCell(`${singleRef.col}${singleRef.row}`, singleRef.sheet);
    }

    const concatParts = splitByTopLevelOp(s, ['&']);
    if (concatParts.length > 1) {
      let out = '';
      for (const part of concatParts) {
        const v = evalExpression(part);
        if (isExcelError(v)) return v;
        out += String(v);
      }
      return out;
    }

    const cmp = findTopLevelComparison(s);
    if (cmp) {
      const lhs = evalExpression(cmp.left);
      if (isExcelError(lhs)) return lhs;
      const rhs = evalExpression(cmp.right);
      if (isExcelError(rhs)) return rhs;
      const lNum = toNumeric(lhs);
      const rNum = toNumeric(rhs);
      let ok = false;
      if (lNum !== null && rNum !== null) {
        if (cmp.op === '=') ok = lNum === rNum;
        else if (cmp.op === '<>') ok = lNum !== rNum;
        else if (cmp.op === '>') ok = lNum > rNum;
        else if (cmp.op === '<') ok = lNum < rNum;
        else if (cmp.op === '>=') ok = lNum >= rNum;
        else if (cmp.op === '<=') ok = lNum <= rNum;
      } else {
        const ls = String(lhs).toLowerCase();
        const rs = String(rhs).toLowerCase();
        if (cmp.op === '=') ok = ls === rs;
        else if (cmp.op === '<>') ok = ls !== rs;
      }
      return ok ? 'VERDADERO' : 'FALSO';
    }

    const addSub = splitTopLevelArithmetic(s, ['+', '-']);
    if (addSub) {
      let acc = evalExpression(addSub[0].expr);
      if (isExcelError(acc)) return acc;
      let accNum = acc === '' ? 0 : toNumeric(acc);
      if (accNum === null) return '#¡VALOR!';
      for (let i = 1; i < addSub.length; i++) {
        const v = evalExpression(addSub[i].expr);
        if (isExcelError(v)) return v;
        const vNum = v === '' ? 0 : toNumeric(v);
        if (vNum === null) return '#¡VALOR!';
        accNum = addSub[i].op === '+' ? accNum + vNum : accNum - vNum;
      }
      return Number(accNum.toFixed(6));
    }

    const mulDiv = splitTopLevelArithmetic(s, ['*', '/']);
    if (mulDiv) {
      const first = evalExpression(mulDiv[0].expr);
      if (isExcelError(first)) return first;
      let accNum = first === '' ? 0 : toNumeric(first);
      if (accNum === null) return '#¡VALOR!';
      for (let i = 1; i < mulDiv.length; i++) {
        const v = evalExpression(mulDiv[i].expr);
        if (isExcelError(v)) return v;
        const vNum = v === '' ? 0 : toNumeric(v);
        if (vNum === null) return '#¡VALOR!';
        if (mulDiv[i].op === '/') {
          if (vNum === 0) return '#DIV/0!';
          accNum /= vNum;
        } else {
          accNum *= vNum;
        }
      }
      return Number(accNum.toFixed(6));
    }

    const pow = splitTopLevelArithmetic(s, ['^']);
    if (pow) {
      const baseVal = evalExpression(pow[0].expr);
      if (isExcelError(baseVal)) return baseVal;
      let accNum = toNumeric(baseVal);
      if (accNum === null) return '#¡VALOR!';
      for (let i = 1; i < pow.length; i++) {
        const expVal = evalExpression(pow[i].expr);
        if (isExcelError(expVal)) return expVal;
        const expNum = toNumeric(expVal);
        if (expNum === null) return '#¡VALOR!';
        accNum = Math.pow(accNum, expNum);
      }
      return Number(accNum.toFixed(6));
    }

    // Unary minus or plus before cell/function/parens (e.g., -B2 or -(A1+B1))
    if (s.startsWith('-') && s.length > 1) {
      const inner = evalExpression(s.slice(1));
      if (isExcelError(inner)) return inner;
      const n = toNumeric(inner);
      return n === null ? '#¡VALOR!' : Number((-n).toFixed(6));
    }
    if (s.startsWith('+') && s.length > 1) {
      return evalExpression(s.slice(1));
    }

    if (isWrappedInMatchingParens(s)) {
      return evalExpression(s.slice(1, -1));
    }

    const fnMatch = s.match(/^([A-Za-zÁÉÍÓÚÑáéíóúñ0-9_.]+)\((.*)\)$/);
    if (fnMatch) {
      const fnName = fnMatch[1].toUpperCase();
      const rawArgs = fnMatch[2].trim() === '' ? [] : splitArgs(fnMatch[2]);

      const collectNumbers = (args: string[], ignoreHidden = false): number[] | string => {
        const nums: number[] = [];
        for (const arg of args) {
          const rng = expandRange(
            arg,
            primary,
            secondary,
            ignoreHidden ? visibleRows : undefined
          );
          if (rng) {
            for (const rawVal of rng.values) {
              const resolved =
                typeof rawVal === 'string' && rawVal.startsWith('=')
                  ? evaluateExcelFormula(rawVal, primary, secondary, visibleRows, depth + 1)
                  : rawVal;
              if (isExcelError(resolved)) return String(resolved);
              if (typeof resolved === 'number') {
                nums.push(resolved);
              } else if (typeof resolved === 'string' && resolved.trim() !== '') {
                const n = toNumeric(resolved);
                if (n !== null) nums.push(n);
              }
            }
          } else {
            const v = evalExpression(arg);
            if (isExcelError(v)) return String(v);
            const n = toNumeric(v);
            if (n !== null) nums.push(n);
          }
        }
        return nums;
      };

      const collectValues = (args: string[]): CellPrimitive[] | string => {
        const vals: CellPrimitive[] = [];
        for (const arg of args) {
          const rng = expandRange(arg, primary, secondary);
          if (rng) {
            for (const rawVal of rng.values) {
              const resolved =
                typeof rawVal === 'string' && rawVal.startsWith('=')
                  ? evaluateExcelFormula(rawVal, primary, secondary, visibleRows, depth + 1)
                  : rawVal;
              if (isExcelError(resolved)) return String(resolved);
              vals.push(resolved);
            }
          } else {
            const v = evalExpression(arg);
            if (isExcelError(v)) return String(v);
            vals.push(v);
          }
        }
        return vals;
      };

      const isTruthy = (cond: CellPrimitive) =>
        cond === 'VERDADERO' || cond === 'TRUE' || (typeof cond === 'number' && cond !== 0);

      if (fnName === 'SI' || fnName === 'IF') {
        if (rawArgs.length < 2) return '#¡VALOR!';
        const cond = evalExpression(rawArgs[0]);
        if (isExcelError(cond)) return cond;
        return isTruthy(cond)
          ? evalExpression(rawArgs[1])
          : rawArgs[2] !== undefined
            ? evalExpression(rawArgs[2])
            : 'FALSO';
      }

      if (fnName === 'Y' || fnName === 'AND') {
        if (rawArgs.length === 0) return '#¡VALOR!';
        for (const arg of rawArgs) {
          const val = evalExpression(arg);
          if (isExcelError(val)) return val;
          if (!isTruthy(val)) return 'FALSO';
        }
        return 'VERDADERO';
      }

      if (fnName === 'O' || fnName === 'OR') {
        if (rawArgs.length === 0) return '#¡VALOR!';
        for (const arg of rawArgs) {
          const val = evalExpression(arg);
          if (isExcelError(val)) return val;
          if (isTruthy(val)) return 'VERDADERO';
        }
        return 'FALSO';
      }

      if (fnName === 'SI.ERROR' || fnName === 'IFERROR') {
        if (rawArgs.length < 2) return '#¡VALOR!';
        const val = evalExpression(rawArgs[0]);
        return isExcelError(val) ? evalExpression(rawArgs[1]) : val;
      }

      if (fnName === 'CONCATENAR' || fnName === 'CONCAT') {
        const vals = collectValues(rawArgs);
        if (typeof vals === 'string') return vals;
        return vals.map((v) => String(v)).join('');
      }

      if (fnName === 'SUMA' || fnName === 'SUM') {
        const nums = collectNumbers(rawArgs);
        if (typeof nums === 'string') return nums;
        return Number(nums.reduce((a, b) => a + b, 0).toFixed(4));
      }

      if (fnName === 'PRODUCTO' || fnName === 'PRODUCT') {
        const nums = collectNumbers(rawArgs);
        if (typeof nums === 'string') return nums;
        if (nums.length === 0) return 0;
        return Number(nums.reduce((a, b) => a * b, 1).toFixed(4));
      }

      if (fnName === 'PROMEDIO' || fnName === 'AVERAGE') {
        const nums = collectNumbers(rawArgs);
        if (typeof nums === 'string') return nums;
        if (nums.length === 0) return '#DIV/0!';
        return Number((nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(4));
      }

      if (fnName === 'MEDIANA' || fnName === 'MEDIAN') {
        const nums = collectNumbers(rawArgs);
        if (typeof nums === 'string') return nums;
        if (nums.length === 0) return '#N/A';
        const sorted = [...nums].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 !== 0
          ? sorted[mid]
          : Number(((sorted[mid - 1] + sorted[mid]) / 2).toFixed(4));
      }

      if (fnName === 'MODA' || fnName === 'MODA.UNO' || fnName === 'MODE') {
        const nums = collectNumbers(rawArgs);
        if (typeof nums === 'string') return nums;
        const counts = new Map<number, number>();
        for (const n of nums) counts.set(n, (counts.get(n) ?? 0) + 1);
        let best = nums[0];
        let bestCount = 0;
        counts.forEach((cnt, val) => {
          if (cnt > bestCount) {
            bestCount = cnt;
            best = val;
          }
        });
        return bestCount > 1 ? best : '#N/A';
      }

      if (fnName === 'MAX') {
        const nums = collectNumbers(rawArgs);
        if (typeof nums === 'string') return nums;
        return nums.length ? Math.max(...nums) : 0;
      }

      if (fnName === 'MIN') {
        const nums = collectNumbers(rawArgs);
        if (typeof nums === 'string') return nums;
        return nums.length ? Math.min(...nums) : 0;
      }

      if (fnName === 'CONTAR' || fnName === 'COUNT') {
        const nums = collectNumbers(rawArgs);
        if (typeof nums === 'string') return nums;
        return nums.length;
      }

      if (fnName === 'CONTARA' || fnName === 'COUNTA') {
        const vals = collectValues(rawArgs);
        if (typeof vals === 'string') return vals;
        return vals.filter((v) => String(v).trim() !== '').length;
      }

      if (fnName === 'CONTAR.BLANCO' || fnName === 'COUNTBLANK') {
        const vals = collectValues(rawArgs);
        if (typeof vals === 'string') return vals;
        return vals.filter((v) => String(v).trim() === '').length;
      }

      if (fnName === 'CONTAR.SI' || fnName === 'COUNTIF') {
        if (rawArgs.length < 2) return '#¡VALOR!';
        const rng = expandRange(rawArgs[0], primary, secondary);
        if (!rng) return '#¡VALOR!';
        const crit = evalExpression(rawArgs[1]);
        if (isExcelError(crit)) return crit;
        return rng.values.filter((v) => matchCriteria(v, crit)).length;
      }

      if (fnName === 'CONTAR.SI.CONJUNTO' || fnName === 'COUNTIFS') {
        if (rawArgs.length < 2 || rawArgs.length % 2 !== 0) return '#¡VALOR!';
        const pairs: Array<{ values: CellPrimitive[]; crit: CellPrimitive }> = [];
        for (let i = 0; i < rawArgs.length; i += 2) {
          const rng = expandRange(rawArgs[i], primary, secondary);
          if (!rng) return '#¡VALOR!';
          const crit = evalExpression(rawArgs[i + 1]);
          if (isExcelError(crit)) return crit;
          pairs.push({ values: rng.values, crit });
        }
        const len = pairs[0].values.length;
        let matches = 0;
        for (let idx = 0; idx < len; idx++) {
          if (pairs.every((p) => matchCriteria(p.values[idx], p.crit))) matches++;
        }
        return matches;
      }

      if (fnName === 'SUMAR.SI' || fnName === 'SUMIF') {
        if (rawArgs.length < 2) return '#¡VALOR!';
        const critRng = expandRange(rawArgs[0], primary, secondary);
        if (!critRng) return '#¡VALOR!';
        const crit = evalExpression(rawArgs[1]);
        if (isExcelError(crit)) return crit;
        const sumRng = rawArgs[2] ? expandRange(rawArgs[2], primary, secondary) : critRng;
        if (!sumRng) return '#¡VALOR!';
        let total = 0;
        for (let i = 0; i < critRng.values.length; i++) {
          if (matchCriteria(critRng.values[i], crit)) {
            const n = toNumeric(sumRng.values[i] ?? 0);
            if (n !== null) total += n;
          }
        }
        return Number(total.toFixed(4));
      }

      if (fnName === 'SUMAR.SI.CONJUNTO' || fnName === 'SUMIFS') {
        if (rawArgs.length < 3 || rawArgs.length % 2 === 0) return '#¡VALOR!';
        const sumRng = expandRange(rawArgs[0], primary, secondary);
        if (!sumRng) return '#¡VALOR!';
        const pairs: Array<{ values: CellPrimitive[]; crit: CellPrimitive }> = [];
        for (let i = 1; i < rawArgs.length; i += 2) {
          const rng = expandRange(rawArgs[i], primary, secondary);
          if (!rng) return '#¡VALOR!';
          const crit = evalExpression(rawArgs[i + 1]);
          pairs.push({ values: rng.values, crit });
        }
        let total = 0;
        for (let idx = 0; idx < sumRng.values.length; idx++) {
          if (pairs.every((p) => matchCriteria(p.values[idx], p.crit))) {
            const n = toNumeric(sumRng.values[idx]);
            if (n !== null) total += n;
          }
        }
        return Number(total.toFixed(4));
      }

      if (fnName === 'PROMEDIO.SI' || fnName === 'AVERAGEIF') {
        if (rawArgs.length < 2) return '#¡VALOR!';
        const critRng = expandRange(rawArgs[0], primary, secondary);
        if (!critRng) return '#¡VALOR!';
        const crit = evalExpression(rawArgs[1]);
        const avgRng = rawArgs[2] ? expandRange(rawArgs[2], primary, secondary) : critRng;
        if (!avgRng) return '#¡VALOR!';
        let total = 0;
        let count = 0;
        for (let i = 0; i < critRng.values.length; i++) {
          if (matchCriteria(critRng.values[i], crit)) {
            const n = toNumeric(avgRng.values[i]);
            if (n !== null) {
              total += n;
              count++;
            }
          }
        }
        return count === 0 ? '#DIV/0!' : Number((total / count).toFixed(4));
      }

      if (fnName === 'PROMEDIO.SI.CONJUNTO' || fnName === 'AVERAGEIFS') {
        if (rawArgs.length < 3 || rawArgs.length % 2 === 0) return '#¡VALOR!';
        const avgRng = expandRange(rawArgs[0], primary, secondary);
        if (!avgRng) return '#¡VALOR!';
        const pairs: Array<{ values: CellPrimitive[]; crit: CellPrimitive }> = [];
        for (let i = 1; i < rawArgs.length; i += 2) {
          const rng = expandRange(rawArgs[i], primary, secondary);
          if (!rng) return '#¡VALOR!';
          const crit = evalExpression(rawArgs[i + 1]);
          pairs.push({ values: rng.values, crit });
        }
        let total = 0;
        let count = 0;
        for (let idx = 0; idx < avgRng.values.length; idx++) {
          if (pairs.every((p) => matchCriteria(p.values[idx], p.crit))) {
            const n = toNumeric(avgRng.values[idx]);
            if (n !== null) {
              total += n;
              count++;
            }
          }
        }
        return count === 0 ? '#DIV/0!' : Number((total / count).toFixed(4));
      }

      if (
        fnName === 'MAX.SI.CONJUNTO' ||
        fnName === 'MAXIFS' ||
        fnName === 'MIN.SI.CONJUNTO' ||
        fnName === 'MINIFS'
      ) {
        if (rawArgs.length < 3 || rawArgs.length % 2 === 0) return '#¡VALOR!';
        const targetRng = expandRange(rawArgs[0], primary, secondary);
        if (!targetRng) return '#¡VALOR!';
        const pairs: Array<{ values: CellPrimitive[]; crit: CellPrimitive }> = [];
        for (let i = 1; i < rawArgs.length; i += 2) {
          const rng = expandRange(rawArgs[i], primary, secondary);
          if (!rng) return '#¡VALOR!';
          const crit = evalExpression(rawArgs[i + 1]);
          pairs.push({ values: rng.values, crit });
        }
        const matched: number[] = [];
        for (let idx = 0; idx < targetRng.values.length; idx++) {
          if (pairs.every((p) => matchCriteria(p.values[idx], p.crit))) {
            const n = toNumeric(targetRng.values[idx]);
            if (n !== null) matched.push(n);
          }
        }
        if (matched.length === 0) return 0;
        return fnName.startsWith('MAX') ? Math.max(...matched) : Math.min(...matched);
      }

      if (fnName === 'REDONDEAR' || fnName === 'ROUND') {
        if (rawArgs.length < 2) return '#¡VALOR!';
        const num = toNumeric(evalExpression(rawArgs[0]));
        const dec = toNumeric(evalExpression(rawArgs[1]));
        if (num === null || dec === null) return '#¡VALOR!';
        const factor = Math.pow(10, Math.round(dec));
        return Math.round(num * factor) / factor;
      }

      if (fnName === 'REDONDEAR.MAS' || fnName === 'ROUNDUP') {
        if (rawArgs.length < 2) return '#¡VALOR!';
        const num = toNumeric(evalExpression(rawArgs[0]));
        const dec = toNumeric(evalExpression(rawArgs[1]));
        if (num === null || dec === null) return '#¡VALOR!';
        const factor = Math.pow(10, Math.round(dec));
        return (num >= 0 ? Math.ceil(num * factor) : Math.floor(num * factor)) / factor;
      }

      if (fnName === 'REDONDEAR.MENOS' || fnName === 'ROUNDDOWN') {
        if (rawArgs.length < 2) return '#¡VALOR!';
        const num = toNumeric(evalExpression(rawArgs[0]));
        const dec = toNumeric(evalExpression(rawArgs[1]));
        if (num === null || dec === null) return '#¡VALOR!';
        const factor = Math.pow(10, Math.round(dec));
        return Math.trunc(num * factor) / factor;
      }

      if (fnName === 'ENTERO' || fnName === 'INT') {
        const num = toNumeric(evalExpression(rawArgs[0] ?? ''));
        return num === null ? '#¡VALOR!' : Math.floor(num);
      }

      if (fnName === 'TRUNCAR' || fnName === 'TRUNC') {
        const num = toNumeric(evalExpression(rawArgs[0] ?? ''));
        const dec = rawArgs[1] ? toNumeric(evalExpression(rawArgs[1])) : 0;
        if (num === null || dec === null) return '#¡VALOR!';
        const factor = Math.pow(10, Math.trunc(dec));
        return Math.trunc(num * factor) / factor;
      }

      if (fnName === 'RESIDUO' || fnName === 'MOD') {
        if (rawArgs.length < 2) return '#¡VALOR!';
        const num = toNumeric(evalExpression(rawArgs[0]));
        const div = toNumeric(evalExpression(rawArgs[1]));
        if (num === null || div === null) return '#¡VALOR!';
        if (div === 0) return '#DIV/0!';
        return num - div * Math.floor(num / div);
      }

      if (fnName === 'POTENCIA' || fnName === 'POWER') {
        if (rawArgs.length < 2) return '#¡VALOR!';
        const b = toNumeric(evalExpression(rawArgs[0]));
        const p = toNumeric(evalExpression(rawArgs[1]));
        if (b === null || p === null) return '#¡VALOR!';
        return Number(Math.pow(b, p).toFixed(4));
      }

      if (fnName === 'RAIZ' || fnName === 'SQRT') {
        const n = toNumeric(evalExpression(rawArgs[0] ?? ''));
        if (n === null || n < 0) return '#¡VALOR!';
        return Number(Math.sqrt(n).toFixed(4));
      }

      if (fnName === 'ABS') {
        const n = toNumeric(evalExpression(rawArgs[0] ?? ''));
        return n === null ? '#¡VALOR!' : Math.abs(n);
      }

      if (fnName === 'ALEATORIO' || fnName === 'RAND') {
        return Number(Math.random().toFixed(4));
      }

      if (fnName === 'ALEATORIO.ENTRE' || fnName === 'RANDBETWEEN') {
        if (rawArgs.length < 2) return '#¡VALOR!';
        const lo = toNumeric(evalExpression(rawArgs[0]));
        const hi = toNumeric(evalExpression(rawArgs[1]));
        if (lo === null || hi === null) return '#¡VALOR!';
        const min = Math.ceil(Math.min(lo, hi));
        const max = Math.floor(Math.max(lo, hi));
        return Math.floor(Math.random() * (max - min + 1)) + min;
      }

      if (fnName === 'ALEATORIO.ARRAY' || fnName === 'RANDARRAY') {
        const rows = rawArgs[0] ? toNumeric(evalExpression(rawArgs[0])) : 1;
        const cols = rawArgs[1] ? toNumeric(evalExpression(rawArgs[1])) : 1;
        const minV = rawArgs[2] ? toNumeric(evalExpression(rawArgs[2])) : 0;
        const maxV = rawArgs[3] ? toNumeric(evalExpression(rawArgs[3])) : 1;
        const intArg = rawArgs[4] ? evalExpression(rawArgs[4]) : 'FALSO';
        if (rows === null || cols === null || minV === null || maxV === null) return '#¡VALOR!';
        const wantInt = isTruthy(intArg);
        const lo = Math.min(minV, maxV);
        const hi = Math.max(minV, maxV);
        const gen = () =>
          wantInt
            ? Math.floor(Math.random() * (Math.floor(hi) - Math.ceil(lo) + 1)) + Math.ceil(lo)
            : Number((lo + Math.random() * (hi - lo)).toFixed(3));
        const totalItems = Math.max(1, Math.min(6, Math.round(rows) * Math.round(cols)));
        if (totalItems === 1) return gen();
        return Array.from({ length: totalItems }, () => gen()).join(' | ');
      }

      if (fnName === 'SUBTOTALES' || fnName === 'SUBTOTAL') {
        if (rawArgs.length < 2) return '#¡VALOR!';
        const code = toNumeric(evalExpression(rawArgs[0]));
        const nums = collectNumbers(rawArgs.slice(1), true);
        if (typeof nums === 'string') return nums;
        if (code === 9 || code === 109) return Number(nums.reduce((a, b) => a + b, 0).toFixed(4));
        if (code === 1 || code === 101) {
          return nums.length
            ? Number((nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(4))
            : '#DIV/0!';
        }
        if (code === 2 || code === 102) return nums.length;
        if (code === 4 || code === 104) return nums.length ? Math.max(...nums) : 0;
        if (code === 5 || code === 105) return nums.length ? Math.min(...nums) : 0;
        return '#¡VALOR!';
      }

      return '#¿NOMBRE?';
    }

    return '#¿NOMBRE?';
  };

  return evalExpression(expr);
}
