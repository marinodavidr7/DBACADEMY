import React, { useMemo, useState } from 'react';

export type IntermediateSimKind =
  | 'logic-advanced'
  | 'text-functions'
  | 'date-functions'
  | 'lookup-functions'
  | 'table-data'
  | 'conditional-format'
  | 'pivot-chart'
  | 'productivity-final';

interface Props {
  kind: IntermediateSimKind;
  lessonTitle: string;
}

const Card: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4">
    <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-700 dark:text-slate-200">{title}</p>
    {children}
  </div>
);

const Result: React.FC<{ label: string; value: string; formula?: string }> = ({ label, value, formula }) => (
  <div className="rounded-lg border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/70 dark:bg-emerald-950/20 p-3">
    <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-300">{label}</p>
    <p className="mt-1 font-mono text-sm font-bold text-emerald-950 dark:text-emerald-100">{value}</p>
    {formula && <code className="mt-1 block text-[11px] text-emerald-800/90 dark:text-emerald-300/90">{formula}</code>}
  </div>
);

const inputClass =
  'w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-2.5 py-1.5 text-sm text-slate-900 dark:text-slate-100';
const labelClass = 'block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1';

/* ----------------------------- M1: lógica avanzada ----------------------------- */
const LogicSim: React.FC = () => {
  const [nota, setNota] = useState(85);
  const [ventas, setVentas] = useState(52000);
  const [asistencia, setAsistencia] = useState(92);
  const [modo, setModo] = useState<'SI' | 'Y' | 'IFS' | 'SI.ERROR'>('SI');

  const estado = nota >= 70 ? 'Aprobado' : 'Reprobado';
  const nivel = nota >= 90 ? 'A' : nota >= 80 ? 'B' : nota >= 70 ? 'C' : 'F';
  const bono = ventas >= 50000 && asistencia >= 90 ? ventas * 0.05 : ventas >= 30000 ? ventas * 0.03 : 0;
  const division = nota > 0 ? (ventas / nota).toFixed(2) : '0';

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Card title="Datos del caso">
        <div className="space-y-2.5">
          <label><span className={labelClass}>Nota del estudiante</span><input type="number" className={inputClass} value={nota} onChange={(e) => setNota(Number(e.target.value))} /></label>
          <label><span className={labelClass}>Ventas del vendedor</span><input type="number" className={inputClass} value={ventas} onChange={(e) => setVentas(Number(e.target.value))} /></label>
          <label><span className={labelClass}>Asistencia (%)</span><input type="number" className={inputClass} value={asistencia} onChange={(e) => setAsistencia(Number(e.target.value))} /></label>
          <label><span className={labelClass}>Función a evaluar</span>
            <select className={inputClass} value={modo} onChange={(e) => setModo(e.target.value as typeof modo)}>
              <option value="SI">=SI()</option><option value="Y">=SI(Y())</option><option value="IFS">=SI.CONJUNTO()</option><option value="SI.ERROR">=SI.ERROR()</option>
            </select>
          </label>
        </div>
      </Card>
      <Card title="Resultado en vivo">
        <div className="space-y-2">
          {modo === 'SI' && <Result label="Estado" value={estado} formula={`=SI(B2>=70;"Aprobado";"Reprobado")`} />}
          {modo === 'Y' && <Result label="Bono" value={`RD$ ${bono.toFixed(2)}`} formula={`=SI(Y(B2>=50000;C2>=90%);B2*5%;SI(B2>=30000;B2*3%;0))`} />}
          {modo === 'IFS' && <Result label="Nivel" value={nivel} formula={`=SI.CONJUNTO(B2>=90;"A";B2>=80;"B";B2>=70;"C";VERDADERO;"F")`} />}
          {modo === 'SI.ERROR' && <Result label="Cociente seguro" value={division} formula={`=SI.ERROR(B2/C2;0)`} />}
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Cambia los valores para probar condiciones límite (70, 90, 100%).</p>
        </div>
      </Card>
    </div>
  );
};

/* ------------------------------- M2: texto ------------------------------------ */
const TextSim: React.FC = () => {
  const [texto, setTexto] = useState('María Rodríguez');
  const [sep, setSep] = useState(' ');
  const clean = texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const parts = texto.trim().split(/\s+/);
  const titleCase = texto.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Card title="Celda de texto (A2)">
        <input className={inputClass} value={texto} onChange={(e) => setTexto(e.target.value)} />
        <label className="mt-3 block"><span className={labelClass}>Separador para UNIRCADENAS</span>
          <input className={inputClass} value={sep} onChange={(e) => setSep(e.target.value)} />
        </label>
      </Card>
      <Card title="Resultados">
        <div className="grid gap-2 sm:grid-cols-2">
          <Result label="IZQUIERDA(A2;5)" value={texto.slice(0, 5)} />
          <Result label="DERECHA(A2;5)" value={texto.slice(-5)} />
          <Result label="EXTRAE(A2;7;8)" value={texto.slice(6, 14)} />
          <Result label="LARGO(A2)" value={String(texto.length)} />
          <Result label="NOMPROPIO(A2)" value={titleCase} />
          <Result label="UNIRCADENAS" value={parts.join(sep || ' ')} />
          <Result label="LIMPIAR (sin tildes)" value={clean} />
          <Result label="MAYUSC(A2)" value={texto.toUpperCase()} />
        </div>
      </Card>
    </div>
  );
};

/* ----------------------------- M3: fechas y horas ------------------------------ */
const DateSim: React.FC = () => {
  const [fecha, setFecha] = useState('2026-11-25');
  const [fin, setFin] = useState('2026-12-25');
  const start = new Date(`${fecha}T00:00:00`);
  const end = new Date(`${fin}T00:00:00`);
  const serial = Math.floor((start.getTime() - new Date('1899-12-30T00:00:00').getTime()) / 86400000);
  const weekdays = useMemo(() => {
    let count = 0;
    const cur = new Date(start);
    while (cur <= end) {
      const day = cur.getDay();
      if (day !== 0 && day !== 6) count += 1;
      cur.setDate(cur.getDate() + 1);
    }
    return count;
  }, [fecha, fin]); // eslint-disable-line react-hooks/exhaustive-deps
  const endOfMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
  const age = Math.max(0, new Date().getFullYear() - start.getFullYear());
  const dias = Math.round((end.getTime() - start.getTime()) / 86400000);
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Card title="Fechas del caso">
        <label><span className={labelClass}>Fecha inicio / nacimiento</span><input type="date" className={inputClass} value={fecha} onChange={(e) => setFecha(e.target.value)} /></label>
        <label className="mt-3 block"><span className={labelClass}>Fecha fin / vencimiento</span><input type="date" className={inputClass} value={fin} onChange={(e) => setFin(e.target.value)} /></label>
      </Card>
      <Card title="Resultados">
        <div className="grid gap-2 sm:grid-cols-2">
          <Result label="Número de serie" value={String(serial)} formula="Excel guarda fechas como días desde 30/12/1899" />
          <Result label="AÑO / MES / DÍA" value={`${start.getFullYear()} / ${start.getMonth() + 1} / ${start.getDate()}`} />
          <Result label="FIN.MES" value={`${endOfMonth}/${start.getMonth() + 1}/${start.getFullYear()}`} formula="=FIN.MES(A2;0)" />
          <Result label="DIAS.LAB (aprox.)" value={String(weekdays)} formula="=DIAS.LAB(A2;B2)" />
          <Result label="DIAS(A2;B2)" value={String(dias)} />
          <Result label="SIFECHA → edad" value={`${age} años`} formula="=SIFECHA(A2;HOY();&quot;y&quot;)" />
        </div>
      </Card>
    </div>
  );
};

/* --------------------------- M4: búsquedas ------------------------------------ */
const CATALOG = [
  { code: 'P-01', name: 'Teclado', price: 850 },
  { code: 'P-02', name: 'Mouse', price: 420 },
  { code: 'P-03', name: 'Monitor', price: 5400 },
  { code: 'P-04', name: 'Laptop', price: 28500 },
];
const LookupSim: React.FC = () => {
  const [code, setCode] = useState('P-03');
  const [qty, setQty] = useState(2);
  const found = CATALOG.find((item) => item.code === code) || CATALOG[0];
  const index = CATALOG.findIndex((item) => item.code === code);
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Card title="Catálogo de productos">
        <div className="mb-3 space-y-2">
          <label><span className={labelClass}>Código a buscar</span>
            <select className={inputClass} value={code} onChange={(e) => setCode(e.target.value)}>
              {CATALOG.map((item) => <option key={item.code} value={item.code}>{item.code} · {item.name}</option>)}
            </select>
          </label>
          <label><span className={labelClass}>Cantidad</span><input type="number" min={1} className={inputClass} value={qty} onChange={(e) => setQty(Number(e.target.value))} /></label>
        </div>
        <table className="w-full text-[11px]"><thead><tr className="text-left text-slate-500"><th className="py-1">Código</th><th>Producto</th><th>Precio</th></tr></thead>
          <tbody>{CATALOG.map((item) => <tr key={item.code} className={item.code === code ? 'font-bold text-emerald-700 dark:text-emerald-300' : ''}><td className="py-1">{item.code}</td><td>{item.name}</td><td>{item.price}</td></tr>)}</tbody></table>
      </Card>
      <Card title="Resultados">
        <div className="space-y-2">
          <Result label="BUSCARV (exacto)" value={found.name} formula={`=BUSCARV("${code}";$A$2:$C$5;2;FALSO)`} />
          <Result label="INDICE + COINCIDIR" value={`RD$ ${found.price}`} formula={`=INDICE($C$2:$C$5;COINCIDIR("${code}";$A$2:$A$5;0))`} />
          <Result label="BUSCARX" value={found.name} formula={`=BUSCARX("${code}";$A$2:$A$5;$B$2:$B$5)`} />
          <Result label="Total factura" value={`RD$ ${(found.price * qty).toLocaleString('es-DO')}`} formula={`=BUSCARV(...)*Cantidad`} />
          <p className="text-[11px] text-slate-500">Coincidencia exacta: el cuarto argumento de BUSCARV debe ser FALSO.</p>
          <p className="text-[11px] text-slate-500">Fila encontrada: {index + 1}.</p>
        </div>
      </Card>
    </div>
  );
};

/* ----------------------------- M5: tablas ------------------------------------- */
const TABLE_DATA = ['Laptop', 'Mouse', 'Teclado', 'Mouse', 'Monitor', 'Teclado'];
const TableSim: React.FC = () => {
  const [asTable, setAsTable] = useState(true);
  const [removeDupes, setRemoveDupes] = useState(false);
  const [filter, setFilter] = useState('Todos');
  const rows = removeDupes ? Array.from(new Set(TABLE_DATA)) : TABLE_DATA;
  const visible = filter === 'Todos' ? rows : rows.filter((r) => r.includes(filter));
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Card title="Datos y opciones">
        <div className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
          <label className="flex items-center gap-2"><input type="checkbox" checked={asTable} onChange={(e) => setAsTable(e.target.checked)} /> Convertir en tabla (Ctrl + T)</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={removeDupes} onChange={(e) => setRemoveDupes(e.target.checked)} /> Quitar duplicados</label>
          <label className="block"><span className={labelClass}>Filtro / segmentación</span>
            <select className={inputClass} value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option>Todos</option><option>Mouse</option><option>Teclado</option><option>Monitor</option><option>Laptop</option>
            </select>
          </label>
        </div>
        <p className="mt-3 font-mono text-[11px] text-slate-500">{asTable ? '=SUM([@Precio]*[@Cantidad])' : '=SUM(B2:B7)  (rango fijo)'}</p>
      </Card>
      <Card title={`Filas visibles (${visible.length})`}>
        <ul className="space-y-1 text-sm">{visible.map((item, i) => <li key={`${item}-${i}`} className="rounded bg-slate-50 dark:bg-slate-800/60 px-2 py-1">{item}</li>)}</ul>
        <p className="mt-3 text-[11px] text-slate-500">Las referencias estructuradas se ajustan solas al agregar filas a la tabla.</p>
      </Card>
    </div>
  );
};

/* ------------------------ M6: formato condicional ------------------------------ */
const ConditionalSim: React.FC = () => {
  const [amounts, setAmounts] = useState('1200, 45000, 8000, 67000, 300');
  const [threshold, setThreshold] = useState(20000);
  const [rule, setRule] = useState<'highlight' | 'bars' | 'icons' | 'formula'>('highlight');
  const values = amounts.split(',').map((v) => Number(v.trim()) || 0);
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Card title="Valores y regla">
        <input className={inputClass} value={amounts} onChange={(e) => setAmounts(e.target.value)} />
        <label className="mt-3 block"><span className={labelClass}>Umbral</span><input type="number" className={inputClass} value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} /></label>
        <label className="mt-3 block"><span className={labelClass}>Tipo de regla</span>
          <select className={inputClass} value={rule} onChange={(e) => setRule(e.target.value as typeof rule)}>
            <option value="highlight">Resaltar celdas mayores al umbral</option>
            <option value="bars">Barras de datos</option>
            <option value="icons">Conjunto de iconos (semáforo)</option>
            <option value="formula">Fórmula personalizada</option>
          </select>
        </label>
      </Card>
      <Card title="Vista previa">
        <div className="space-y-2">
          {values.map((value, i) => {
            const high = value > threshold;
            return (
              <div key={i} className={`flex items-center gap-2 rounded px-2 py-1.5 ${high ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-slate-50 dark:bg-slate-800/60'}`}>
                <span className="w-8 text-[11px] text-slate-500">A{i + 2}</span>
                <span className="font-mono text-sm">{value.toLocaleString('es-DO')}</span>
                {rule === 'bars' && <span className="h-2 rounded bg-emerald-500" style={{ width: `${Math.min(100, value / 700)}%` }} />}
                {rule === 'icons' && <span>{high ? '🟢' : value > threshold / 2 ? '🟡' : '🔴'}</span>}
                {rule === 'highlight' && high && <span className="ml-auto text-[10px] font-bold text-emerald-700 dark:text-emerald-300">RESALTADA</span>}
                {rule === 'formula' && <span className="ml-auto text-[10px] font-mono">{high ? 'VERDADERO → aplica' : 'FALSO'}</span>}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

/* ------------------------- M7: tablas dinámicas -------------------------------- */
const SALES = [
  { region: 'Norte', product: 'Laptop', amount: 12000 },
  { region: 'Norte', product: 'Mouse', amount: 3000 },
  { region: 'Sur', product: 'Laptop', amount: 8000 },
  { region: 'Sur', product: 'Monitor', amount: 15000 },
  { region: 'Este', product: 'Mouse', amount: 5000 },
];
const PivotSim: React.FC = () => {
  const [row, setRow] = useState<'region' | 'product'>('region');
  const [metric, setMetric] = useState<'amount' | 'count'>('amount');
  const groups = useMemo(() => {
    const map = new Map<string, number>();
    for (const sale of SALES) {
      const key = sale[row];
      map.set(key, (map.get(key) || 0) + (metric === 'amount' ? sale.amount : 1));
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [row, metric]);
  const max = Math.max(...groups.map((g) => g[1]), 1);
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Card title="Configuración del pivote">
        <label><span className={labelClass}>Filas</span>
          <select className={inputClass} value={row} onChange={(e) => setRow(e.target.value as typeof row)}><option value="region">Región</option><option value="product">Producto</option></select>
        </label>
        <label className="mt-3 block"><span className={labelClass}>Valores</span>
          <select className={inputClass} value={metric} onChange={(e) => setMetric(e.target.value as typeof metric)}><option value="amount">Suma de Ventas</option><option value="count">Cuenta de registros</option></select>
        </label>
        <p className="mt-3 text-[11px] text-slate-500">Arrastra campos a Filas / Valores en una tabla dinámica real; aquí el pivote se recalcula al instante.</p>
      </Card>
      <Card title="Resultado agrupado">
        <div className="space-y-2">
          {groups.map(([label, value]) => (
            <div key={label} className="flex items-center gap-2">
              <span className="w-20 text-xs text-slate-600 dark:text-slate-300">{label}</span>
              <span className="h-3 rounded bg-[#107C41]" style={{ width: `${(value / max) * 60}%` }} />
              <span className="font-mono text-xs">{metric === 'amount' ? `RD$ ${value.toLocaleString('es-DO')}` : value}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

/* --------------------- M8: productividad / proyecto final ---------------------- */
const ProductivitySim: React.FC<Props> = () => {
  const [shortcut, setShortcut] = useState('Ctrl+T');
  const [goal, setGoal] = useState(100000);
  const [current, setCurrent] = useState(75000);
  const detail: Record<string, string> = {
    'Ctrl+T': 'Convierte el rango en tabla con referencias estructuradas.',
    'Ctrl+Arrow': 'Salta al borde de la región de datos contigua.',
    'F4': 'Alterna entre referencias relativa, absoluta y mixta.',
    'Ctrl+;': 'Inserta la fecha actual como valor estático.',
    'Alt+= ': 'AutoSuma la fila o columna seleccionada.',
  };
  const needed = Math.max(0, goal - current);
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Card title="Atajos / nombres / Hipótesis">
        <label><span className={labelClass}>Atajo o herramienta</span>
          <select className={inputClass} value={shortcut} onChange={(e) => setShortcut(e.target.value)}>
            {Object.keys(detail).map((key) => <option key={key} value={key}>{key.trim()}</option>)}
          </select>
        </label>
        <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">{detail[shortcut]}</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <label><span className={labelClass}>Meta (Buscar objetivo)</span><input type="number" className={inputClass} value={goal} onChange={(e) => setGoal(Number(e.target.value))} /></label>
          <label><span className={labelClass}>Valor actual</span><input type="number" className={inputClass} value={current} onChange={(e) => setCurrent(Number(e.target.value))} /></label>
        </div>
      </Card>
      <Card title="Resultado">
        <Result label="Ajuste necesario" value={`RD$ ${needed.toLocaleString('es-DO')}`} formula="=Buscar objetivo(celda_objetivo; valor_deseado; celda_variable)" />
        <p className="mt-2 text-[11px] text-slate-500">En el proyecto final combinas tablas, validación, formatos y un panel de ventas.</p>
      </Card>
    </div>
  );
};

export const IntermediateTopicSim: React.FC<Props> = ({ kind, lessonTitle }) => (
  <div className="space-y-3">
    <p className="text-xs text-slate-500 dark:text-slate-400">
      Caso interactivo alineado con <span className="font-semibold text-slate-700 dark:text-slate-200">{lessonTitle}</span>.
    </p>
    {kind === 'logic-advanced' && <LogicSim />}
    {kind === 'text-functions' && <TextSim />}
    {kind === 'date-functions' && <DateSim />}
    {kind === 'lookup-functions' && <LookupSim />}
    {kind === 'table-data' && <TableSim />}
    {kind === 'conditional-format' && <ConditionalSim />}
    {kind === 'pivot-chart' && <PivotSim />}
    {kind === 'productivity-final' && <ProductivitySim kind={kind} lessonTitle={lessonTitle} />}
  </div>
);
