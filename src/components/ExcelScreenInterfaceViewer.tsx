import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Search,
  HelpCircle,
  Sparkles,
  Maximize2,
  FileSpreadsheet,
  MousePointerClick,
  CheckCircle2,
} from 'lucide-react';

// DICCIONARIO DE HERRAMIENTAS DE LA CINTA
interface ToolInfo {
  name: string;
  desc: string;
  shortcut?: string;
  category?: string;
}

const TOOLS_INFO: Record<string, ToolInfo> = {
  'quick-save': { name: 'Guardar', desc: 'Guarda el libro actual en disco o en la nube.', shortcut: 'Ctrl+G' },
  'quick-undo': { name: 'Deshacer', desc: 'Deshace la última acción realizada.', shortcut: 'Ctrl+Z' },
  'quick-redo': { name: 'Rehacer', desc: 'Rehace la acción que acabas de deshacer.', shortcut: 'Ctrl+Y' },
  'paste': { name: 'Pegar', desc: 'Pega el contenido del portapapeles en la celda activa.', shortcut: 'Ctrl+V' },
  'cut': { name: 'Cortar', desc: 'Corta la selección actual y la mueve al portapapeles.', shortcut: 'Ctrl+X' },
  'copy': { name: 'Copiar', desc: 'Copia la selección actual al portapapeles.', shortcut: 'Ctrl+C' },
  'font-family': { name: 'Fuente', desc: 'Cambia la tipografía de las celdas seleccionadas (ej. Aptos, Calibri, Arial).' },
  'font-size': { name: 'Tamaño de fuente', desc: 'Ajusta el tamaño del texto en puntos (8, 10, 11, 14, 20...).' },
  'bold': { name: 'Negrita', desc: 'Aplica estilo en negrita para resaltar encabezados o totales.', shortcut: 'Ctrl+N' },
  'italic': { name: 'Cursiva', desc: 'Aplica cursiva para notas o subtítulos.', shortcut: 'Ctrl+K / Ctrl+I' },
  'underline': { name: 'Subrayado', desc: 'Subraya el texto o valor de la celda.', shortcut: 'Ctrl+S / Ctrl+U' },
  'borders': { name: 'Bordes', desc: 'Aplica bordes inferiores, externos, dobles o cuadrícula completa a las celdas.' },
  'fill-color': { name: 'Color de relleno', desc: 'Pinta el fondo de la celda con el color seleccionado para agrupar visualmente datos.' },
  'font-color': { name: 'Color de fuente', desc: 'Modifica el color del texto de la celda.' },
  'align-left': { name: 'Alinear a la izquierda', desc: 'Alinea el contenido al borde izquierdo (predeterminado para texto).' },
  'align-center': { name: 'Centrar', desc: 'Centra el contenido horizontalmente (ideal para códigos o fechas).' },
  'align-right': { name: 'Alinear a la derecha', desc: 'Alinea al borde derecho (predeterminado y obligatorio para números).' },
  'wrap-text': { name: 'Ajustar texto', desc: 'Permite que textos largos se muestren en varias líneas dentro de la misma celda.' },
  'merge': { name: 'Combinar y centrar', desc: 'Une dos o más celdas adyacentes en una sola celda grande y centra el texto.' },
  'num-format': { name: 'Formato de número', desc: 'Selecciona cómo mostrar los datos: General, Moneda, Contabilidad, Fecha, Porcentaje.' },
  'currency': { name: 'Formato de moneda', desc: 'Añade el símbolo monetario ($ o RD$) con separadores de miles y dos decimales.' },
  'percent': { name: 'Formato de porcentaje', desc: 'Multiplica por 100 y muestra el símbolo % (0.15 → 15%).' },
  'thousands': { name: 'Separador de miles', desc: 'Formatea con comas los millares (1000 → 1,000.00).' },
  'decimals-inc': { name: 'Aumentar decimales', desc: 'Muestra un decimal adicional de precisión numérica.' },
  'decimals-dec': { name: 'Disminuir decimales', desc: 'Oculta un decimal redondeando visualmente la cifra.' },
  'conditional': { name: 'Formato condicional', desc: 'Aplica colores o barras automáticamente si se cumplen reglas (ej. > 100 en verde).' },
  'as-table': { name: 'Dar formato como tabla', desc: 'Convierte un rango en una tabla inteligente con filtros, estilos y totales automáticos.', shortcut: 'Ctrl+T' },
  'autosum': { name: 'Autosuma', desc: 'Inserta automáticamente la fórmula =SUMA() detectando las celdas numéricas superiores o laterales.', shortcut: 'Alt + =' },
  'sort-filter': { name: 'Ordenar y filtrar', desc: 'Ordena de A a Z o de mayor a menor y habilita filtros desplegables por columna.' },
  'find': { name: 'Buscar y seleccionar', desc: 'Encuentra datos específicos o reemplaza valores en todo el libro.', shortcut: 'Ctrl+B' },
  'pivot': { name: 'Tabla dinámica', desc: 'Crea resúmenes interactivos multidimensionales para analizar miles de filas en segundos.' },
  'table': { name: 'Tabla estructurada', desc: 'Crea una tabla oficial de Excel con referencias estructuradas [@Columna].' },
  'chart-col': { name: 'Gráfico de columnas', desc: 'Inserta un gráfico de columnas o barras para comparar categorías.' },
  'chart-line': { name: 'Gráfico de líneas', desc: 'Muestra tendencias a lo largo del tiempo (meses, años).' },
  'chart-pie': { name: 'Gráfico circular', desc: 'Muestra la proporción de partes respecto a un 100% total.' },
  'insert-fn': { name: 'Insertar función (fx)', desc: 'Abre el asistente guiado para buscar funciones y completar sus argumentos paso a paso.', shortcut: 'Shift+F3' },
  'names-mgr': { name: 'Administrador de nombres', desc: 'Crea y administra rangos con nombre propio (ej. TipoCambio = 58.50).', shortcut: 'Ctrl+F3' },
  'trace-precedent': { name: 'Rastrear precedentes', desc: 'Dibuja flechas azules hacia las celdas que alimentan la fórmula seleccionada.' },
  'show-formulas': { name: 'Mostrar fórmulas', desc: 'Alterna entre ver los resultados calculados y ver el texto exacto de las fórmulas.', shortcut: 'Ctrl+`' },
  'filter': { name: 'Filtro', desc: 'Activa o desactiva las flechas de filtro en la primera fila de datos.', shortcut: 'Ctrl+Shift+L' },
  'remove-dup': { name: 'Quitar duplicados', desc: 'Elimina filas idénticas conservando solo registros únicos.' },
  'validate': { name: 'Validación de datos', desc: 'Restringe lo que el usuario puede escribir (listas desplegables, fechas válidas, rangos).' },
  'freeze-panes': { name: 'Inmovilizar paneles', desc: 'Deja fijas las filas superiores o columnas izquierdas al hacer scroll hacia abajo.' },
  'view-normal': { name: 'Vista Normal', desc: 'Vista de trabajo habitual de cuadrícula continua.' },
  'view-page-layout': { name: 'Diseño de página', desc: 'Visualiza la hoja dividida en hojas de papel listas para imprimir con márgenes.' },
};

type RibbonTabKey = 'Inicio' | 'Insertar' | 'Disposicion' | 'Formulas' | 'Datos' | 'Vista';

interface ComponentInfo {
  id: number;
  category: string;
  title: string;
  desc: string;
  badge: string;
}

const COMPONENTS_INFO: Record<number, ComponentInfo> = {
  1: {
    id: 1,
    category: 'Parte Superior',
    title: '1. Barra de Título y Acceso Rápido',
    desc: 'Muestra el nombre del archivo activo (ej. <strong>Libro1 - Excel</strong>), el estado de guardado en la nube (OneDrive/SharePoint), botones de Guardar (Ctrl+G), Deshacer (Ctrl+Z), Rehacer y los controles estándar de ventana.',
    badge: '1. Título',
  },
  2: {
    id: 2,
    category: 'Centro de Comandos',
    title: '2. Cinta de Opciones (Ribbon)',
    desc: 'Es el centro de control de Excel organizado en pestañas (<strong>Inicio, Insertar, Disposición, Fórmulas, Datos, Vista</strong>). Cada pestaña agrupa botones por función. Haz clic en las pestañas arriba o en cualquier botón para ver qué hace.',
    badge: '2. Cinta',
  },
  3: {
    id: 3,
    category: 'Navegación y Nombres',
    title: '3. Cuadro de Nombres',
    desc: 'Indica la coordenada exacta de la celda activa seleccionada (por ejemplo <strong>C4</strong>). Si seleccionas un rango con nombre, muestra su nombre. También puedes escribir aquí cualquier coordenada (ej. Z100) y pulsar Enter para saltar inmediatamente a ella.',
    badge: '3. Nombres',
  },
  4: {
    id: 4,
    category: 'Edición y Cálculos',
    title: '4. Barra de Fórmulas (fx)',
    desc: 'Muestra el contenido subyacente real de la celda activa. Si la celda muestra un resultado como "150", aquí verás si es un número fijo o una fórmula como <code>=SUMA(A1:A5)</code>. Al pulsar el botón <em>fx</em> se abre el asistente guiado de funciones.',
    badge: '4. Fórmulas',
  },
  5: {
    id: 5,
    category: 'Estructura Vertical',
    title: '5. Encabezados de Columnas (A, B, C...)',
    desc: 'Las columnas son divisiones verticales identificadas con letras del alfabeto. Van desde la <strong>A</strong> hasta la <strong>XFD</strong> (un total de 16.384 columnas). Al hacer clic sobre una letra seleccionas la columna entera de arriba a abajo.',
    badge: '5. Columnas',
  },
  6: {
    id: 6,
    category: 'Estructura Horizontal',
    title: '6. Encabezados de Filas (1, 2, 3...)',
    desc: 'Las filas son divisiones horizontales identificadas con números que van del <strong>1</strong> al <strong>1.048.576</strong>. Al hacer clic sobre el número seleccionas la fila completa de izquierda a derecha.',
    badge: '6. Filas',
  },
  7: {
    id: 7,
    category: 'Área de Trabajo',
    title: '7. Celda Activa y Controlador de Relleno',
    desc: 'Una celda es la intersección de una columna y una fila (ej. <strong>C4</strong>). La celda activa se destaca con un borde verde grueso y un pequeño cuadrado en la esquina inferior derecha llamado <strong>controlador de relleno</strong> para arrastrar y autocompletar fórmulas.',
    badge: '7. Celda Activa',
  },
  8: {
    id: 8,
    category: 'Estructura del Libro',
    title: '8. Pestañas de Hojas de Cálculo',
    desc: 'Un archivo de Excel es un <em>Libro</em> que puede contener múltiples <em>Hojas</em>. Aquí puedes cambiar entre hojas (Hoja1, Ventas, Gastos), renombrarlas con doble clic, asignarles colores y hacer clic en el botón <strong>+</strong> para crear una hoja nueva.',
    badge: '8. Hojas',
  },
  9: {
    id: 9,
    category: 'Parte Inferior',
    title: '9. Barra de Estado, Vistas y Zoom',
    desc: 'Indica el estado del programa (<strong>Listo</strong>, <strong>Calcular</strong>), accesos rápidos a las tres vistas principales (Normal, Diseño de página, Salto de página) y el control deslizante de <strong>Zoom</strong> para alejar o acercar la cuadrícula.',
    badge: '9. Estado & Zoom',
  },
};

const COLS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] as const;
type ColLetter = (typeof COLS)[number];

export const ExcelScreenInterfaceViewer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<RibbonTabKey>('Inicio');
  const [selectedZone, setSelectedZone] = useState<number>(2);
  const [activeCell, setActiveCell] = useState<{ col: ColLetter; row: number }>({ col: 'C', row: 4 });
  const [activeToolInfo, setActiveToolInfo] = useState<ToolInfo | null>(null);
  const [isAutoTour, setIsAutoTour] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const tourIntervalRef = useRef<number | null>(null);

  const stopAutoTour = useCallback(() => {
    if (tourIntervalRef.current) {
      clearInterval(tourIntervalRef.current);
      tourIntervalRef.current = null;
    }
    setIsAutoTour(false);
  }, []);

  const selectZone = useCallback(
    (zoneId: number, fromTour = false) => {
      if (!fromTour) stopAutoTour();
      setSelectedZone(zoneId);
      setActiveToolInfo(null);
    },
    [stopAutoTour]
  );

  const handleNextZone = useCallback(() => {
    setSelectedZone((prev) => (prev >= 9 ? 1 : prev + 1));
    setActiveToolInfo(null);
  }, []);

  const handlePrevZone = useCallback(() => {
    stopAutoTour();
    setSelectedZone((prev) => (prev <= 1 ? 9 : prev - 1));
    setActiveToolInfo(null);
  }, []);

  const toggleAutoTour = useCallback(() => {
    if (isAutoTour) {
      stopAutoTour();
    } else {
      setIsAutoTour(true);
      tourIntervalRef.current = window.setInterval(() => {
        setSelectedZone((prev) => (prev >= 9 ? 1 : prev + 1));
        setActiveToolInfo(null);
      }, 3400);
    }
  }, [isAutoTour, stopAutoTour]);

  useEffect(() => {
    return () => {
      if (tourIntervalRef.current) {
        clearInterval(tourIntervalRef.current);
      }
    };
  }, []);

  const handleCellClick = (col: ColLetter, row: number) => {
    stopAutoTour();
    setActiveCell({ col, row });
    setSelectedZone(7);
    setActiveToolInfo(null);
  };

  const handleToolClick = (toolKey: string) => {
    stopAutoTour();
    const info = TOOLS_INFO[toolKey];
    if (info) {
      setActiveToolInfo(info);
      setSelectedZone(2);
    }
  };

  // Filtrado de herramientas por búsqueda
  const matchingTools = Object.entries(TOOLS_INFO).filter(
    ([, val]) =>
      searchQuery.trim().length > 1 &&
      (val.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        val.desc.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const currentComponent = COMPONENTS_INFO[selectedZone] || COMPONENTS_INFO[2];

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden transition-all">
      {/* HEADER DE LA EXPERIENCIA */}
      <div className="bg-gradient-to-r from-[#107C41] via-[#0E6C38] to-[#0A522A] text-white p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 border-b border-emerald-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shadow-inner border border-white/25">
            <FileSpreadsheet className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-300 text-emerald-950">
                Simulador Interactivo
              </span>
              <span className="text-xs text-emerald-100 font-medium hidden sm:inline">
                Anatomía de la Pantalla de Excel
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold tracking-tight text-white mt-0.5">
              La Pantalla de Microsoft Excel: Las 9 Piezas Clave
            </h3>
          </div>
        </div>

        {/* CONTROLES DEL TOUR */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleAutoTour}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
              isAutoTour
                ? 'bg-amber-400 text-slate-950 hover:bg-amber-300 ring-2 ring-amber-200'
                : 'bg-white/15 text-white hover:bg-white/25 border border-white/25'
            }`}
          >
            {isAutoTour ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isAutoTour ? 'Pausar Tour' : 'Tour Guiado'}</span>
          </button>
          <div className="flex items-center bg-black/20 rounded-lg p-0.5 border border-white/15">
            <button
              type="button"
              onClick={handlePrevZone}
              className="p-1.5 rounded hover:bg-white/20 text-white transition-colors"
              title="Pieza anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-bold px-2 text-emerald-100">{selectedZone}/9</span>
            <button
              type="button"
              onClick={handleNextZone}
              className="p-1.5 rounded hover:bg-white/20 text-white transition-colors"
              title="Siguiente pieza"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* PANEL EXPLICATIVO (ARRIBA DE LAS PÍLDORAS) */}
      <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800">
        <div className="flex flex-col md:flex-row items-start gap-4">
          {/* Badge o icono */}
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black text-white shrink-0 shadow-md ${
              activeToolInfo ? 'bg-amber-500' : 'bg-[#107C41]'
            }`}
          >
            {activeToolInfo ? '🛠' : currentComponent.id}
          </div>

          {/* Información explicativa */}
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  activeToolInfo
                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                    : 'bg-emerald-100 dark:bg-emerald-950/60 text-[#107C41] dark:text-emerald-300'
                }`}
              >
                {activeToolInfo ? 'Herramienta de la Cinta' : currentComponent.category}
              </span>
              {activeToolInfo?.shortcut && (
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  Atajo: {activeToolInfo.shortcut}
                </span>
              )}
            </div>

            <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              {activeToolInfo ? activeToolInfo.name : currentComponent.title}
            </h4>

            <p
              className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: activeToolInfo ? activeToolInfo.desc : currentComponent.desc,
              }}
            />
          </div>

          {/* Botones de acción rápida */}
          <div className="flex md:flex-col gap-2 shrink-0">
            <button
              type="button"
              onClick={handleNextZone}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <span>Siguiente pieza</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                selectZone(7);
                handleCellClick('C', 4);
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:border-emerald-500 transition-colors"
            >
              <MousePointerClick className="w-3.5 h-3.5 text-emerald-600" />
              <span>Seleccionar celda C4</span>
            </button>
          </div>
        </div>
      </div>

      {/* BARRA DE NAVEGACIÓN RÁPIDA (PÍLDORAS 1 A 9) */}
      <div className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 p-2 sm:p-2.5 overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((id) => {
            const comp = COMPONENTS_INFO[id];
            const isSelected = selectedZone === id && !activeToolInfo;
            return (
              <button
                key={id}
                type="button"
                onClick={() => selectZone(id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#107C41] text-white shadow-sm ring-1 ring-emerald-600'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-500'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full text-[10px] font-extrabold flex items-center justify-center ${
                    isSelected ? 'bg-white text-[#107C41]' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {id}
                </span>
                <span>{comp.badge.split('. ')[1]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* VENTANA REALISTA DE EXCEL */}
      <div className="p-3 sm:p-5 bg-slate-100/70 dark:bg-slate-950/40">
        <div className="rounded-xl border border-slate-300 dark:border-slate-700 shadow-md bg-white dark:bg-slate-900 overflow-hidden font-sans">
          
          {/* 1. BARRA DE TÍTULO Y ACCESO RÁPIDO */}
          <div
            onClick={() => selectZone(1)}
            className={`bg-[#107C41] text-white px-3 py-2 flex items-center justify-between transition-all cursor-pointer select-none ${
              selectedZone === 1 ? 'ring-2 ring-amber-400 bg-[#0c6133]' : 'hover:bg-[#0e6b37]'
            }`}
          >
            <div className="flex items-center gap-2 text-xs">
              <span className="w-5 h-5 rounded-full bg-white text-[#107C41] font-black text-[11px] flex items-center justify-center shadow-sm">
                1
              </span>
              <div className="flex items-center gap-1.5 bg-black/15 px-2 py-0.5 rounded">
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToolClick('quick-save');
                  }}
                  className="hover:scale-110 transition-transform cursor-pointer"
                  title="Guardar (Ctrl+G)"
                >
                  💾
                </span>
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToolClick('quick-undo');
                  }}
                  className="hover:scale-110 transition-transform cursor-pointer"
                  title="Deshacer (Ctrl+Z)"
                >
                  ↩️
                </span>
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToolClick('quick-redo');
                  }}
                  className="hover:scale-110 transition-transform cursor-pointer"
                  title="Rehacer (Ctrl+Y)"
                >
                  ↪️
                </span>
              </div>
              <span className="font-semibold text-xs text-white/90 hidden sm:inline">
                Presupuesto_2026.xlsx - Excel
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="hidden md:inline text-[11px] text-emerald-100 bg-white/10 px-2 py-0.5 rounded">
                ☁️ Guardado en OneDrive
              </span>
              <div className="flex items-center gap-1 text-[11px] font-mono text-white/80">
                <span className="w-3 h-3 flex items-center justify-center">─</span>
                <span className="w-3 h-3 flex items-center justify-center">□</span>
                <span className="w-3 h-3 flex items-center justify-center text-red-200">✕</span>
              </div>
            </div>
          </div>

          {/* 2. CINTA DE OPCIONES (RIBBON) */}
          <div
            onClick={() => selectZone(2)}
            className={`border-b border-slate-300 dark:border-slate-700 bg-[#f3f2f1] dark:bg-slate-800 transition-all cursor-pointer ${
              selectedZone === 2 ? 'ring-2 ring-amber-400 bg-[#eae8e6] dark:bg-slate-750' : ''
            }`}
          >
            {/* PESTAÑAS DE LA CINTA */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-2 text-xs font-medium">
              <div className="flex items-center gap-0.5 pt-1 overflow-x-auto">
                <span className="w-5 h-5 rounded-full bg-[#107C41] text-white font-black text-[11px] flex items-center justify-center mr-1 shadow-sm shrink-0">
                  2
                </span>
                {(['Inicio', 'Insertar', 'Disposicion', 'Formulas', 'Datos', 'Vista'] as RibbonTabKey[]).map((tab) => {
                  const isActive = activeTab === tab;
                  const labelMap: Record<RibbonTabKey, string> = {
                    Inicio: 'Inicio',
                    Insertar: 'Insertar',
                    Disposicion: 'Disposición de página',
                    Formulas: 'Fórmulas',
                    Datos: 'Datos',
                    Vista: 'Vista',
                  };
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        stopAutoTour();
                        setActiveTab(tab);
                        setSelectedZone(2);
                        setActiveToolInfo(null);
                      }}
                      className={`px-3 py-1.5 rounded-t text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-white dark:bg-slate-900 text-[#107C41] dark:text-emerald-400 border-t-2 border-[#107C41] shadow-sm'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {labelMap[tab]}
                    </button>
                  );
                })}
              </div>

              {/* BUSCADOR DE HERRAMIENTAS */}
              <div className="hidden lg:flex items-center gap-1.5 pb-0.5">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2 top-2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar herramienta (ej. Autosuma, Pegar...)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="pl-7 pr-2.5 py-1 text-[11px] rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-56"
                  />
                </div>
              </div>
            </div>

            {/* CONTENIDO INTERACTIVO DE LA PESTAÑA */}
            <div className="p-2 sm:p-2.5 text-xs text-slate-700 dark:text-slate-200 min-h-[74px] flex items-stretch gap-3 overflow-x-auto">
              {activeTab === 'Inicio' && (
                <>
                  {/* Portapapeles */}
                  <div className="flex flex-col justify-between pr-3 border-r border-slate-300 dark:border-slate-700 shrink-0">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToolClick('paste');
                        }}
                        className="flex flex-col items-center p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                        title="Pegar (Ctrl+V)"
                      >
                        <span className="text-lg">📋</span>
                        <span className="text-[10px]">Pegar</span>
                      </button>
                      <div className="flex flex-col gap-1 text-[11px]">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToolClick('cut');
                          }}
                          className="hover:text-emerald-600 flex items-center gap-1"
                        >
                          ✂️ Cortar
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToolClick('copy');
                          }}
                          className="hover:text-emerald-600 flex items-center gap-1"
                        >
                          📄 Copiar
                        </button>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 text-center font-medium">Portapapeles</span>
                  </div>

                  {/* Fuente */}
                  <div className="flex flex-col justify-between pr-3 border-r border-slate-300 dark:border-slate-700 shrink-0">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToolClick('font-family');
                          }}
                          className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-2 py-0.5 text-[11px] rounded w-24 flex justify-between"
                        >
                          <span>Aptos</span>
                          <span>▾</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToolClick('font-size');
                          }}
                          className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-1.5 py-0.5 text-[11px] rounded flex gap-1"
                        >
                          <span>11</span>
                          <span>▾</span>
                        </button>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs pt-0.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToolClick('bold');
                          }}
                          className="font-bold px-1.5 py-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                          title="Negrita (Ctrl+N)"
                        >
                          N
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToolClick('italic');
                          }}
                          className="italic px-1.5 py-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                          title="Cursiva (Ctrl+K)"
                        >
                          K
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToolClick('underline');
                          }}
                          className="underline px-1.5 py-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                          title="Subrayado (Ctrl+S)"
                        >
                          S
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToolClick('borders');
                          }}
                          className="px-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                          title="Bordes"
                        >
                          田▾
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToolClick('fill-color');
                          }}
                          className="px-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                          title="Color de relleno"
                        >
                          🪣
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToolClick('font-color');
                          }}
                          className="text-red-500 font-bold px-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                          title="Color de fuente"
                        >
                          A▾
                        </button>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 text-center font-medium">Fuente</span>
                  </div>

                  {/* Alineación */}
                  <div className="hidden sm:flex flex-col justify-between pr-3 border-r border-slate-300 dark:border-slate-700 shrink-0">
                    <div className="flex flex-col gap-1 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToolClick('align-left');
                          }}
                          className="px-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                        >
                          ≡
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToolClick('align-center');
                          }}
                          className="px-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                        >
                          ≣
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToolClick('align-right');
                          }}
                          className="px-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                        >
                          ☰
                        </button>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToolClick('wrap-text');
                          }}
                          className="hover:text-emerald-600 text-[10px]"
                        >
                          ab↩ Ajustar texto
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToolClick('merge');
                          }}
                          className="hover:text-emerald-600 text-[10px]"
                        >
                          ⊞ Combinar
                        </button>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 text-center font-medium">Alineación</span>
                  </div>

                  {/* Número */}
                  <div className="flex flex-col justify-between pr-3 border-r border-slate-300 dark:border-slate-700 shrink-0">
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToolClick('num-format');
                        }}
                        className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-2 py-0.5 text-[11px] rounded flex justify-between"
                      >
                        <span>Moneda ($)</span>
                        <span>▾</span>
                      </button>
                      <div className="flex items-center gap-2 font-mono text-xs">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToolClick('currency');
                          }}
                          className="px-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded font-bold"
                        >
                          $
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToolClick('percent');
                          }}
                          className="px-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded font-bold"
                        >
                          %
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToolClick('thousands');
                          }}
                          className="px-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                        >
                          ,000
                        </button>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 text-center font-medium">Número</span>
                  </div>

                  {/* Estilos */}
                  <div className="hidden md:flex flex-col justify-between pr-3 border-r border-slate-300 dark:border-slate-700 shrink-0">
                    <div className="flex flex-col gap-1 text-[11px]">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToolClick('conditional');
                        }}
                        className="hover:text-emerald-600 flex items-center gap-1 text-left"
                      >
                        📊 Formato condicional
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToolClick('as-table');
                        }}
                        className="hover:text-emerald-600 flex items-center gap-1 text-left"
                      >
                        ▦ Dar formato de tabla
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-400 text-center font-medium">Estilos</span>
                  </div>

                  {/* Edición */}
                  <div className="flex flex-col justify-between shrink-0">
                    <div className="flex items-center gap-2 text-[11px]">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToolClick('autosum');
                        }}
                        className="flex flex-col items-center px-1.5 py-0.5 rounded hover:bg-emerald-100 dark:hover:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold"
                      >
                        <span className="text-base font-serif">∑</span>
                        <span className="text-[10px]">Autosuma</span>
                      </button>
                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToolClick('sort-filter');
                          }}
                          className="hover:text-emerald-600 text-left"
                        >
                          ⇅ Ordenar
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToolClick('find');
                          }}
                          className="hover:text-emerald-600 text-left"
                        >
                          🔍 Buscar
                        </button>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 text-center font-medium">Edición</span>
                  </div>
                </>
              )}

              {activeTab === 'Insertar' && (
                <>
                  <div className="flex flex-col justify-between pr-3 border-r border-slate-300 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToolClick('pivot');
                        }}
                        className="flex flex-col items-center p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                      >
                        <span className="text-lg">📊</span>
                        <span className="text-[10px]">Tabla dinámica</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToolClick('table');
                        }}
                        className="flex flex-col items-center p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                      >
                        <span className="text-lg">▦</span>
                        <span className="text-[10px]">Tabla</span>
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-400 text-center font-medium">Tablas</span>
                  </div>

                  <div className="flex flex-col justify-between pr-3 border-r border-slate-300 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToolClick('chart-col');
                        }}
                        className="flex flex-col items-center p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                      >
                        <span className="text-lg">📈</span>
                        <span className="text-[10px]">Columnas</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToolClick('chart-line');
                        }}
                        className="flex flex-col items-center p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                      >
                        <span className="text-lg">📉</span>
                        <span className="text-[10px]">Líneas</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToolClick('chart-pie');
                        }}
                        className="flex flex-col items-center p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                      >
                        <span className="text-lg">🥧</span>
                        <span className="text-[10px]">Circular</span>
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-400 text-center font-medium">Gráficos recomendados</span>
                  </div>
                </>
              )}

              {activeTab === 'Formulas' && (
                <>
                  <div className="flex flex-col justify-between pr-3 border-r border-slate-300 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToolClick('insert-fn');
                        }}
                        className="flex flex-col items-center p-1 rounded hover:bg-emerald-100 dark:hover:bg-emerald-950/40 text-[#107C41] dark:text-emerald-400"
                      >
                        <span className="font-serif italic font-bold text-lg">fx</span>
                        <span className="text-[10px] font-semibold">Insertar función</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToolClick('autosum');
                        }}
                        className="flex flex-col items-center p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                      >
                        <span className="text-base font-serif font-bold">∑</span>
                        <span className="text-[10px]">Autosuma</span>
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-400 text-center font-medium">Biblioteca de funciones</span>
                  </div>

                  <div className="flex flex-col justify-between pr-3 border-r border-slate-300 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToolClick('names-mgr');
                        }}
                        className="flex flex-col items-center p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                      >
                        <span className="text-base">🏷️</span>
                        <span className="text-[10px]">Admin. nombres</span>
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-400 text-center font-medium">Nombres definidos</span>
                  </div>

                  <div className="flex flex-col justify-between">
                    <div className="flex flex-col gap-1 text-[11px]">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToolClick('trace-precedent');
                        }}
                        className="hover:text-emerald-600 text-left"
                      >
                        ↗ Rastrear precedentes
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToolClick('show-formulas');
                        }}
                        className="hover:text-emerald-600 text-left"
                      >
                        👁️ Mostrar fórmulas
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-400 text-center font-medium">Auditoría de fórmulas</span>
                  </div>
                </>
              )}

              {activeTab === 'Datos' && (
                <>
                  <div className="flex flex-col justify-between pr-3 border-r border-slate-300 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToolClick('filter');
                        }}
                        className="flex flex-col items-center p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                      >
                        <span className="text-base">🌪️</span>
                        <span className="text-[10px]">Filtro</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToolClick('sort-filter');
                        }}
                        className="flex flex-col items-center p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                      >
                        <span className="text-base">⇅</span>
                        <span className="text-[10px]">Ordenar</span>
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-400 text-center font-medium">Ordenar y filtrar</span>
                  </div>

                  <div className="flex flex-col justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToolClick('remove-dup');
                        }}
                        className="flex flex-col items-center p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                      >
                        <span className="text-base">🧹</span>
                        <span className="text-[10px]">Quitar duplicados</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToolClick('validate');
                        }}
                        className="flex flex-col items-center p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                      >
                        <span className="text-base">✅</span>
                        <span className="text-[10px]">Validación datos</span>
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-400 text-center font-medium">Herramientas de datos</span>
                  </div>
                </>
              )}

              {activeTab === 'Disposicion' && (
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex flex-col items-center p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700">
                    <span className="text-base">📐</span>
                    <span className="text-[10px]">Márgenes</span>
                  </div>
                  <div className="flex flex-col items-center p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700">
                    <span className="text-base">🔄</span>
                    <span className="text-[10px]">Orientación</span>
                  </div>
                  <div className="flex flex-col items-center p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700">
                    <span className="text-base">📄</span>
                    <span className="text-[10px]">Tamaño Carta/A4</span>
                  </div>
                  <div className="flex flex-col items-center p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700">
                    <span className="text-base">🖨️</span>
                    <span className="text-[10px]">Área de impresión</span>
                  </div>
                </div>
              )}

              {activeTab === 'Vista' && (
                <div className="flex items-center gap-4 text-xs">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToolClick('view-normal');
                    }}
                    className="flex flex-col items-center p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                  >
                    <span className="text-base">⊞</span>
                    <span className="text-[10px]">Normal</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToolClick('view-page-layout');
                    }}
                    className="flex flex-col items-center p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                  >
                    <span className="text-base">📄</span>
                    <span className="text-[10px]">Diseño de página</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToolClick('freeze-panes');
                    }}
                    className="flex flex-col items-center p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                  >
                    <span className="text-base">❄️</span>
                    <span className="text-[10px]">Inmovilizar paneles</span>
                  </button>
                </div>
              )}
            </div>

            {/* RESULTADOS DE BÚSQUEDA RÁPIDA DE HERRAMIENTA */}
            {matchingTools.length > 0 && (
              <div className="bg-amber-50 dark:bg-amber-950/40 border-t border-amber-200 dark:border-amber-800 p-2 text-xs flex items-center gap-2 flex-wrap">
                <span className="font-bold text-amber-800 dark:text-amber-300">Coincidencias:</span>
                {matchingTools.slice(0, 4).map(([key, t]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleToolClick(key)}
                    className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 text-slate-800 dark:text-slate-200 hover:bg-amber-100 font-medium"
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 3 Y 4. CUADRO DE NOMBRES Y BARRA DE FÓRMULAS */}
          <div className="bg-[#f3f2f1] dark:bg-slate-800/80 border-b border-slate-300 dark:border-slate-700 px-2.5 py-1.5 flex items-center gap-2">
            {/* 3. Cuadro de nombres */}
            <div
              onClick={() => selectZone(3)}
              className={`flex items-center justify-between bg-white dark:bg-slate-900 border px-2.5 py-1 cursor-pointer min-w-[120px] rounded transition-all ${
                selectedZone === 3
                  ? 'border-amber-500 ring-2 ring-amber-300 dark:ring-amber-800'
                  : 'border-slate-300 dark:border-slate-600 hover:border-emerald-500'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-[#107C41] text-white font-extrabold text-[10px] flex items-center justify-center shrink-0">
                  3
                </span>
                <span className="font-mono font-bold text-xs text-slate-800 dark:text-slate-100">
                  {activeCell.col}
                  {activeCell.row}
                </span>
              </div>
              <span className="text-[10px] text-slate-400">▾</span>
            </div>

            <span className="text-slate-400 select-none text-xs">⋮</span>

            {/* Botones de fórmula */}
            <div className="hidden sm:flex items-center bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 gap-2 text-xs select-none">
              <span className="text-slate-400 font-bold">✕</span>
              <span className="text-slate-400 font-bold">✓</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToolClick('insert-fn');
                }}
                className="text-[#107C41] dark:text-emerald-400 font-serif italic font-bold hover:scale-110 transition-transform"
                title="Insertar función"
              >
                fx
              </button>
            </div>

            {/* 4. Barra de fórmulas */}
            <div
              onClick={() => selectZone(4)}
              className={`flex-1 flex items-center justify-between bg-white dark:bg-slate-900 border px-2.5 py-1 cursor-pointer rounded overflow-x-auto transition-all ${
                selectedZone === 4
                  ? 'border-amber-500 ring-2 ring-amber-300 dark:ring-amber-800'
                  : 'border-slate-300 dark:border-slate-600 hover:border-emerald-500'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-[#107C41] text-white font-extrabold text-[10px] flex items-center justify-center shrink-0">
                  4
                </span>
                <span className="font-mono text-xs text-slate-700 dark:text-slate-200 whitespace-nowrap">
                  {activeCell.col === 'C' && activeCell.row === 4 ? (
                    <span className="text-[#107C41] dark:text-emerald-400 font-bold">=SUMA(C1:C3)</span>
                  ) : (
                    <span className="text-slate-400 italic text-[11px]">
                      (Contenido o fórmula de la celda {activeCell.col}
                      {activeCell.row})
                    </span>
                  )}
                </span>
              </div>
              <span className="text-[10px] text-slate-400">▾</span>
            </div>
          </div>

          {/* 5, 6 Y 7. CUADRÍCULA DE CELDAS CON ENCABEZADOS */}
          <div className="overflow-x-auto bg-white dark:bg-slate-900 select-none">
            <div className="min-w-[620px]">
              {/* 5. ENCABEZADOS DE COLUMNAS */}
              <div
                onClick={() => selectZone(5)}
                className={`grid grid-cols-[44px_repeat(8,1fr)] bg-[#e6e6e6] dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 text-center text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer ${
                  selectedZone === 5 ? 'ring-2 ring-amber-400' : ''
                }`}
              >
                <div className="p-1.5 border-r border-slate-300 dark:border-slate-700 bg-[#d9d9d9] dark:bg-slate-700 flex items-center justify-center">
                  <span className="w-4 h-4 rounded-full bg-[#107C41] text-white font-extrabold text-[10px] flex items-center justify-center">
                    5
                  </span>
                </div>
                {COLS.map((col) => {
                  const isColActive = activeCell.col === col;
                  return (
                    <div
                      key={col}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCellClick(col, activeCell.row);
                      }}
                      className={`p-1.5 border-r border-slate-300 dark:border-slate-700 transition-colors ${
                        isColActive
                          ? 'bg-[#d3e3d8] dark:bg-emerald-950/60 text-[#107C41] dark:text-emerald-300 font-bold border-b-2 border-b-[#107C41]'
                          : 'hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {col}
                    </div>
                  );
                })}
              </div>

              {/* CUERPO DE FILAS Y CELDAS (1 A 8) */}
              {[1, 2, 3, 4, 5, 6, 7, 8].map((row) => {
                const isRowActive = activeCell.row === row;
                return (
                  <div
                    key={row}
                    className="grid grid-cols-[44px_repeat(8,1fr)] border-b border-slate-200 dark:border-slate-800 text-xs h-[28px]"
                  >
                    {/* 6. ENCABEZADO DE FILA */}
                    <div
                      onClick={() => {
                        selectZone(6);
                        handleCellClick(activeCell.col, row);
                      }}
                      className={`flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                        isRowActive
                          ? 'bg-[#d3e3d8] dark:bg-emerald-950/60 text-[#107C41] dark:text-emerald-300 font-bold border-r-2 border-r-[#107C41]'
                          : 'bg-[#e6e6e6] dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border-r border-slate-300 dark:border-slate-700 hover:bg-slate-200'
                      } ${selectedZone === 6 ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-900' : ''}`}
                    >
                      {row === 1 && (
                        <span className="w-3.5 h-3.5 rounded-full bg-[#107C41] text-white font-extrabold text-[9px] flex items-center justify-center">
                          6
                        </span>
                      )}
                      <span>{row}</span>
                    </div>

                    {/* CELDAS */}
                    {COLS.map((col) => {
                      const isCellActive = activeCell.col === col && activeCell.row === row;

                      // Datos de ejemplo para dar realismo a la hoja
                      let cellValue = '';
                      if (row === 1 && col === 'B') cellValue = 'Ventas Ene';
                      if (row === 2 && col === 'B') cellValue = '$1,200';
                      if (row === 3 && col === 'B') cellValue = '$1,500';
                      if (row === 4 && col === 'B') cellValue = '$1,800';
                      if (row === 1 && col === 'C') cellValue = 'Presupuesto';
                      if (row === 2 && col === 'C') cellValue = '1,000';
                      if (row === 3 && col === 'C') cellValue = '1,400';
                      if (row === 4 && col === 'C') cellValue = '2,400';

                      if (isCellActive) {
                        return (
                          <div
                            key={col}
                            onClick={() => handleCellClick(col, row)}
                            className={`border-2 border-[#107C41] bg-white dark:bg-slate-900 flex items-center justify-between px-1.5 cursor-pointer relative z-10 shadow-sm ${
                              selectedZone === 7 ? 'ring-2 ring-amber-400' : ''
                            }`}
                          >
                            <span className="font-mono text-[11px] font-bold text-slate-800 dark:text-slate-100">
                              {cellValue}
                            </span>
                            {/* 7. Pin celda activa */}
                            <span className="w-3.5 h-3.5 rounded-full bg-[#107C41] text-white font-extrabold text-[9px] flex items-center justify-center">
                              7
                            </span>
                            {/* Controlador de relleno en esquina inferior derecha */}
                            <span
                              className="w-2 h-2 bg-[#107C41] border border-white dark:border-slate-900 absolute -bottom-1 -right-1 cursor-crosshair shadow"
                              title="Controlador de relleno"
                            />
                          </div>
                        );
                      }

                      return (
                        <div
                          key={col}
                          onClick={() => handleCellClick(col, row)}
                          className="border-r border-slate-200 dark:border-slate-800 px-1.5 flex items-center text-[11px] text-slate-600 dark:text-slate-300 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 cursor-pointer font-mono"
                        >
                          {cellValue}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 8. PESTAÑAS DE HOJAS */}
          <div
            onClick={() => selectZone(8)}
            className={`bg-[#e6e6e6] dark:bg-slate-800/90 border-t border-slate-300 dark:border-slate-700 px-3 py-1 flex items-center justify-between cursor-pointer transition-all ${
              selectedZone === 8 ? 'ring-2 ring-amber-400' : ''
            }`}
          >
            <div className="flex items-center gap-2 text-xs">
              <span className="w-4 h-4 rounded-full bg-[#107C41] text-white font-extrabold text-[10px] flex items-center justify-center">
                8
              </span>
              <span className="text-slate-400 px-1 tracking-widest text-[10px]">◀ ▶</span>
              <span className="bg-white dark:bg-slate-900 text-[#107C41] dark:text-emerald-400 font-bold px-3 py-1 border-b-2 border-[#107C41] shadow-sm rounded-t text-xs">
                Hoja1
              </span>
              <span className="text-slate-600 dark:text-slate-400 px-2 py-1 text-xs hover:bg-slate-300 dark:hover:bg-slate-700 rounded cursor-pointer">
                Presupuesto
              </span>
              <span
                className="w-5 h-5 rounded-full border border-slate-400 text-slate-600 dark:text-slate-300 font-bold flex items-center justify-center text-xs hover:bg-slate-300"
                title="Nueva hoja"
              >
                +
              </span>
            </div>
          </div>

          {/* 9. BARRA DE ESTADO Y ZOOM */}
          <div
            onClick={() => selectZone(9)}
            className={`bg-[#f3f2f1] dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px] cursor-pointer transition-all ${
              selectedZone === 9 ? 'ring-2 ring-amber-400' : ''
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-[#107C41] text-white font-extrabold text-[10px] flex items-center justify-center">
                9
              </span>
              <span className="font-semibold text-emerald-800 dark:text-emerald-400">Listo</span>
              <span className="text-slate-400 hidden sm:inline">| Promedio: 1,600 &nbsp; Recuento: 3 &nbsp; Suma: 4,800</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <span className="bg-slate-300 dark:bg-slate-700 px-1 rounded font-bold" title="Vista Normal">
                  ⊞
                </span>
                <span className="px-1" title="Diseño de página">
                  📄
                </span>
                <span className="px-1" title="Salto de página">
                  ⊟
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-500">—</span>
                <div className="w-16 h-1 bg-slate-300 dark:bg-slate-600 rounded relative">
                  <div className="w-2 h-2.5 bg-slate-600 dark:bg-slate-300 rounded absolute -top-0.5 left-1/2 -translate-x-1/2" />
                </div>
                <span className="font-bold text-slate-500">+</span>
                <span className="font-mono font-bold text-xs">100%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
