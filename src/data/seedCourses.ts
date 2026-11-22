import type { Course } from '../types';

export const EXCEL_BASICO_COURSE: Course = {
  id: 'excel-basico-05',
  title: 'Excel Básico (eliminado)',
  subtitle: '',
  description: '',
  category: 'Productividad',
  level: 'beginner',
  priceCents: 0,
  currency: 'USD',
  coverImage: '',
  instructorId: 'platform-faculty',
  instructorName: 'Equipo DB Academy',
  published: false,
  technologies: [],
  modulesCount: 0,
  totalLessons: 0,
  modules: [],
};
export const EXCEL_INTERMEDIO_COURSE: Course = {
  id: 'excel-intermedio-01',
  title: 'Excel Intermedio: Tablas Dinámicas, Búsquedas y Análisis de Datos',
  subtitle: 'Domina BUSCARX, BUSCARV, Tablas Dinámicas, Segmentación de Datos y Funciones Lógicas Anidadas.',
  description:
    'Aprende a transformar grandes volúmenes de datos en dashboards ejecutivos. Domina BUSCARX/XLOOKUP, SI.CONJUNTO, Tablas Dinámicas avanzadas, campos calculados y validación de datos para optimizar reportes corporativos.',
  category: 'Productividad',
  level: 'intermediate',
  priceCents: 0,
  currency: 'USD',
  coverImage: '/assets/images/track_data_analytics_1795271913869.webp',
  instructorId: 'platform-faculty',
  instructorName: 'Equipo DB Academy',
  published: true,
  technologies: ['Excel', 'BUSCARX', 'XLOOKUP', 'Tablas Dinámicas', 'Slicers', 'Validación de Datos'],
  modulesCount: 3,
  totalLessons: 11,
  modules: [
    {
      id: 'mod-intermedio-1',
      title: 'MÓDULO 1 — BÚSQUEDAS Y MATRICES DINÁMICAS',
      durationMinutes: 65,
      quizQuestion: '¿Qué ventaja principal tiene BUSCARX frente a BUSCARV tradicional?',
      quizOptions: [
        'Busca hacia la izquierda y derecha sin requerir ordenar columnas ni contar números de columna',
        'Solo funciona en tablas de menos de 100 filas',
        'Requiere convertir todos los textos en números antes de buscar',
      ],
      quizCorrectIndex: 0,
      lessons: [
        {
          id: 'les-inter-1-1',
          title: '1.1 BUSCARX (XLOOKUP): Fundamentos y Sintaxis Universal',
          durationMinutes: 15,
          summary: 'Aprende a reemplazar BUSCARV y BUSCARH con la función de búsqueda más potente de Excel.',
          content:
            'BUSCARX resuelve las limitaciones históricas de BUSCARV: no requiere que la clave esté en la primera columna, busca de derecha a izquierda o de izquierda a derecha de forma nativa, y no se rompe al insertar columnas. Sintaxis: =BUSCARX(valor_buscado; matriz_buscada; matriz_devuelta; [si_no_se_encuentra]; [modo_de_coincidencia]).',
        },
        {
          id: 'les-inter-1-2',
          title: '1.2 Manejo de Errores y Coincidencias con [si_no_se_encuentra]',
          durationMinutes: 15,
          summary: 'Evita los molestos errores #N/A integrando valores por defecto directamente dentro de la fórmula.',
          content:
            'En versiones anteriores era obligatorio envolver la fórmula con =SI.ERROR(BUSCARV(...); "No encontrado"). En BUSCARX, el cuarto argumento [si_no_se_encuentra] permite devolver un texto, cero u otra fórmula si no existe coincidencia, manteniendo la hoja limpia y optimizada.',
        },
        {
          id: 'les-inter-1-3',
          title: '1.3 Búsqueda Bidireccional: ÍNDICE y COINCIDIR',
          durationMinutes: 20,
          summary: 'Domina la técnica clásica de cruce matricial por fila y columna para hojas compatibles con versiones anteriores.',
          content:
            'La combinación =ÍNDICE(matriz; COINCIDIR(fila); COINCIDIR(columna)) localiza un dato en la intersección exacta de dos coordenadas. Es la alternativa universal para libros compartidos con usuarios que utilizan versiones heredadas de Excel donde BUSCARX no está disponible.',
        },
        {
          id: 'les-inter-1-4',
          title: '1.4 Lógica Condicional Ampliada: SI.CONJUNTO y Conectores Y / O',
          durationMinutes: 15,
          summary: 'Evalúa múltiples condiciones sin necesidad de anidar más de 5 niveles de =SI().',
          content:
            'La función =SI.CONJUNTO(prueba1; valor1; prueba2; valor2; ...) evalúa condiciones en secuencia y devuelve el valor correspondiente a la primera verdadera. Combinada con Y() y O(), simplifica categorizaciones comerciales como tramos de comisión o scoring de clientes.',
        },
      ],
    },
    {
      id: 'mod-intermedio-2',
      title: 'MÓDULO 2 — TABLAS DINÁMICAS Y MODELADO BÁSICO',
      durationMinutes: 60,
      quizQuestion: '¿Qué herramienta permite filtrar visualmente varias Tablas Dinámicas al mismo tiempo con un solo clic?',
      quizOptions: [
        'Segmentación de Datos (Slicers) conectada a múltiples informes',
        'Cambiar la fuente de letra a negrita',
        'Copiar y pegar manualmente los valores',
      ],
      quizCorrectIndex: 0,
      lessons: [
        {
          id: 'les-inter-2-1',
          title: '2.1 Estructura Tabular Oficial (Ctrl + T) y Rangos Dinámicos',
          durationMinutes: 15,
          summary: 'Convierte rangos normales en Tablas Oficiales de Excel para autoexpansión automática de fórmulas.',
          content:
            'Al formatear un rango con Ctrl+T, Excel asigna nombres estructurados (ej. Ventas[Monto]) y expande automáticamente cualquier nueva fila o fórmula agregada al final, sirviendo como la fuente de datos ideal para tablas dinámicas.',
        },
        {
          id: 'les-inter-2-2',
          title: '2.2 Construcción y Diseño de Tablas Dinámicas',
          durationMinutes: 15,
          summary: 'Agrupa, totaliza y cambia el diseño de presentación de reportes en segundos sin fórmulas manuales.',
          content:
            'Explora los cuatro cuadrantes: Filtros, Columnas, Filas y Valores. Aprende a cambiar cálculos de Suma a Promedio o Recuento, y a mostrar valores como porcentaje del total general o variación respecto al mes anterior.',
        },
        {
          id: 'les-inter-2-3',
          title: '2.3 Campos Calculados y Elementos Calculados',
          durationMinutes: 15,
          summary: 'Crea nuevas métricas matemáticas directamente en la tabla dinámica sin modificar la base de datos origen.',
          content:
            'Los Campos Calculados permiten operar matemáticamente sobre columnas existentes (por ejemplo, margen = Ventas - Costos) integrándose al resumen sin tener que añadir una nueva columna en la tabla origen de 50.000 filas.',
        },
        {
          id: 'les-inter-2-4',
          title: '2.4 Segmentación de Datos (Slicers) y Escalas de Tiempo',
          durationMinutes: 15,
          summary: 'Crea paneles de control interactivos que responden al toque del usuario.',
          content:
            'Los botones de Segmentación (Slicers) y las Escalas de Tiempo conectadas mediante "Conexiones de informe" permiten que un solo botón filtre 3 tablas dinámicas y 2 gráficos simultáneamente.',
        },
      ],
    },
    {
      id: 'mod-intermedio-3',
      title: 'MÓDULO 3 — VALIDACIÓN, FORMATO CONDICIONAL Y AUDITORÍA',
      durationMinutes: 45,
      quizQuestion: '¿Para qué sirve la herramienta "Rastrear precedentes" en la auditoría de fórmulas?',
      quizOptions: [
        'Dibuja flechas visuales que indican qué celdas alimentan el valor de la fórmula seleccionada',
        'Borra las fórmulas con errores',
        'Cambia el idioma de la hoja de cálculo',
      ],
      quizCorrectIndex: 0,
      lessons: [
        {
          id: 'les-inter-3-1',
          title: '3.1 Listas Desplegables Dependientes con Validación de Datos',
          durationMinutes: 15,
          summary: 'Crea menús desplegables donde la segunda opción depende de la primera mediante =INDIRECTO().',
          content:
            'Configura listas de validación dinámica para que, si el usuario selecciona "Tecnología", la lista secundaria solo ofrezca "Laptops", "Monitores" o "Accesorios", previniendo entradas de datos erróneas en formularios.',
        },
        {
          id: 'les-inter-3-2',
          title: '3.2 Formato Condicional Avanzado con Fórmulas Propias',
          durationMinutes: 15,
          summary: 'Resalta filas enteras cuando se cumplan condiciones lógicas complejas.',
          content:
            'Aprende a aplicar formato condicional usando fórmulas como =$D2<HOY() o =$C2="Crítico" fijando la columna con referencia mixta ($) para iluminar toda la fila y no solo una celda individual.',
        },
        {
          id: 'les-inter-3-3',
          title: '3.3 Auditoría de Fórmulas y Evaluación Paso a Paso',
          durationMinutes: 15,
          summary: 'Depura errores en fórmulas complejas viendo cada paso del cálculo intermedio.',
          content:
            'Utiliza "Rastrear precedentes" y "Rastrear dependientes" con flechas gráficas, y abre la ventana "Evaluar fórmula" para inspeccionar dónde se produce un valor inesperado o un error #¡VALOR! paso a paso.',
        },
      ],
    },
  ],
};

export const EXCEL_AVANZADO_COURSE: Course = {
  id: 'excel-avanzado-01',
  title: 'Excel Experto: Automatización con Macros, Power Query y Dashboards',
  subtitle: 'Automatiza flujos de trabajo repetitivos con Power Query, modelado de datos DAX, Macros VBA y visualización ejecutiva.',
  description:
    'Lleva tus habilidades al nivel experto. Conecta y transforma fuentes heterogéneas con Power Query, crea modelos relacionales con Power Pivot, automatiza tareas complejas con Macros y construye dashboards interactivos de alto impacto para toma de decisiones.',
  category: 'Productividad',
  level: 'advanced',
  priceCents: 0,
  currency: 'USD',
  coverImage: '/assets/images/hero_db_academy_tech_1795271913703.webp',
  instructorId: 'platform-faculty',
  instructorName: 'Equipo DB Academy',
  published: true,
  technologies: ['Excel', 'Power Query', 'Lenguaje M', 'DAX', 'Power Pivot', 'Macros VBA', 'Dashboards'],
  modulesCount: 3,
  totalLessons: 12,
  prerequisites: ['excel-intermedio-01'],
  modules: [
    {
      id: 'mod-avanzado-1',
      title: 'MÓDULO 1 — POWER QUERY: AUTOMATIZACIÓN ETL',
      durationMinutes: 65,
      quizQuestion: '¿Cuál es la función principal de la herramienta "Anular dinamización de columnas" (Unpivot) en Power Query?',
      quizOptions: [
        'Transformar datos distribuidos horizontalmente en columnas en una estructura vertical de filas normalizadas para análisis',
        'Eliminar todas las columnas de la tabla',
        'Cambiar los nombres de las hojas del libro',
      ],
      quizCorrectIndex: 0,
      lessons: [
        {
          id: 'les-avanz-1-1',
          title: '1.1 Introducción al Motor ETL: Extraer, Transformar y Cargar',
          durationMinutes: 15,
          summary: 'Descubre cómo automatizar la limpieza de archivos mensuales sin copiar y pegar nunca más.',
          content:
            'Power Query graba cada paso de limpieza (eliminar encabezados basura, reemplazar nulos, ajustar tipos de datos) en una receta reproducible. Al mes siguiente, basta con pulsar "Actualizar todo" para procesar el nuevo archivo en segundos.',
        },
        {
          id: 'les-avanz-1-2',
          title: '1.2 Unpivot (Anular Dinamización) y Limpieza de Datos',
          durationMinutes: 15,
          summary: 'Convierte reportes cruzados (meses en columnas) en datos tabulares listos para bases de datos relacionales.',
          content:
            'La anulación de dinamización transforma tablas donde los meses están en columnas horizontales (Ene, Feb, Mar...) en dos columnas ordenadas: "Atributo" y "Valor", permitiendo segmentar y calcular sin fórmulas engorrosas.',
        },
        {
          id: 'les-avanz-1-3',
          title: '1.3 Combinar y Anexar Consultas (Merge & Append)',
          durationMinutes: 20,
          summary: 'Une tablas por coincidencia de claves (equivalente a JOIN SQL) o apila múltiples archivos de una carpeta.',
          content:
            'Aprende los tipos de combinación: Unión interna (Inner Join), Unión externa izquierda (Left Outer Join) y Anexar para consolidar 12 archivos mensuales de una carpeta automáticamente en una única tabla maestra.',
        },
        {
          id: 'les-avanz-1-4',
          title: '1.4 Fundamentos del Lenguaje M y Fórmulas Personalizadas',
          durationMinutes: 15,
          summary: 'Comprende el código que Power Query genera en segundo plano para personalizar transformaciones.',
          content:
            'Inspecciona el Editor Avanzado para leer la estructura let... in del lenguaje M. Aprende a crear columnas personalizadas con condicionales if... then... else y manejar fechas con Date.EndOfMonth().',
        },
      ],
    },
    {
      id: 'mod-avanzado-2',
      title: 'MÓDULO 2 — MODELADO RELACIONAL Y DAX (POWER PIVOT)',
      durationMinutes: 65,
      quizQuestion: '¿Por qué se prefieren las Medidas Explícitas en DAX sobre las Columnas Calculadas?',
      quizOptions: [
        'Se calculan dinámicamente en memoria según el contexto de filtro y no consumen espacio de almacenamiento en el archivo',
        'Solo pueden devolver números enteros',
        'Porque las columnas calculadas no admiten sumas',
      ],
      quizCorrectIndex: 0,
      lessons: [
        {
          id: 'les-avanz-2-1',
          title: '2.1 Modelado en Estrella: Tablas de Hechos vs Tablas de Dimensiones',
          durationMinutes: 15,
          summary: 'Estructura relaciones de 1 a Varios (1:N) conectando clientes, productos y calendario con las ventas.',
          content:
            'Comprende la diferencia entre tablas transaccionales (Hechos/Fact Tables) y tablas maestras (Dimensiones). Crea relaciones activas en la vista de diagrama de Power Pivot sin necesidad de hacer BUSCARX masivos.',
        },
        {
          id: 'les-avanz-2-2',
          title: '2.2 Medidas DAX: =CALCULATE(), =DIVIDE() y Contexto de Filtro',
          durationMinutes: 20,
          summary: 'Domina la función reina de DAX para modificar el contexto de evaluación en reportes financieros.',
          content:
            'La función =CALCULATE(expresión; filtro1; filtro2) evalúa un cálculo bajo un nuevo conjunto de condiciones (ej. Ventas solo de la región Norte). Aprende a usar =DIVIDE() para evitar errores de división entre cero de forma limpia.',
        },
        {
          id: 'les-avanz-2-3',
          title: '2.3 Inteligencia de Tiempo (Time Intelligence) en DAX',
          durationMinutes: 15,
          summary: 'Calcula acumulados año a la fecha (YTD) y comparativas año contra año (YoY).',
          content:
            'Aprende a crear una tabla de calendario estándar y aplicar funciones temporales como =TOTALYTD(), =SAMEPERIODLASTYEAR() y =DATEADD() para comparar el rendimiento actual frente al mismo período del año anterior.',
        },
        {
          id: 'les-avanz-2-4',
          title: '2.4 Optimización del Modelo y Jerarquías de Análisis',
          durationMinutes: 15,
          summary: 'Reduce el tamaño del libro de 100MB a 10MB y habilita navegación Drill-Down.',
          content:
            'Aplica buenas prácticas de almacenamiento columnar en el motor VertiPaq: ocultar columnas de clave para el usuario final, formatear tipos de datos y construir jerarquías como Año > Trimestre > Mes para análisis jerárquico.',
        },
      ],
    },
    {
      id: 'mod-avanzado-3',
      title: 'MÓDULO 3 — AUTOMATIZACIÓN CON MACROS VBA Y DASHBOARDS',
      durationMinutes: 60,
      quizQuestion: '¿Qué extensión de archivo es obligatoria en Excel para guardar libros que contengan código de Macros VBA?',
      quizOptions: [
        '.xlsm (Libro de Excel habilitado para macros)',
        '.xlsx (Libro estándar)',
        '.csv (Valores separados por comas)',
      ],
      quizCorrectIndex: 0,
      lessons: [
        {
          id: 'les-avanz-3-1',
          title: '3.1 Grabadora de Macros y el Entorno de Desarrollo VBA',
          durationMinutes: 15,
          summary: 'Inicia en el mundo de la programación automatizando tareas repetitivas de formato y ordenación.',
          content:
            'Abre la pestaña Desarrollador / Programador (Alt + F11). Aprende a grabar acciones, examinar el código generado, limpiar selecciones innecesarias (ActiveCell.Select) y asignar macros a botones de formulario.',
        },
        {
          id: 'les-avanz-3-2',
          title: '3.2 Estructura de Procedimientos: Variables, Bucles y Condiciones',
          durationMinutes: 15,
          summary: 'Escribe código profesional con estructuras For Each... Next y bloques If... Then.',
          content:
            'Domina la declaración de variables (Dim r As Range, Dim i As Long), recorre rangos dinámicamente y valida condiciones para automatizar la generación de reportes masivos por cliente en un instante.',
        },
        {
          id: 'les-avanz-3-3',
          title: '3.3 Arquitectura Visual de Dashboards Ejecutivos',
          durationMinutes: 15,
          summary: 'Diseña interfaces visuales limpias, tarjetas de KPI y gráficos dinámicos interactivos.',
          content:
            'Aprende a eliminar líneas de cuadrícula, usar paletas de colores sobrias de nivel corporativo, alinear tarjetas de indicadores clave y conectar botones interactivos para una experiencia ejecutiva de alta gama.',
        },
        {
          id: 'les-avanz-3-4',
          title: '3.4 Exportación Automatizada de Reportes a PDF y Cierre',
          durationMinutes: 15,
          summary: 'Exporta vistas clave a PDF con nombre dinámico por fecha con un solo clic.',
          content:
            'Escribe una macro que guarde automáticamente las hojas de reporte en formato PDF en una carpeta específica con fecha actual y abra el cliente de correo para distribución corporativa.',
        },
      ],
    },
  ],
};

export const REMOVED_SEED_COURSE_IDS: readonly string[] = [
  'sys-arch-distributed-01',
  'data-science-applied-02',
  'ux-design-systems-03',
  'cybersecurity-e2ee-04',
  'excel-basico-05',
];

export const SEED_COURSES: Course[] = [
  EXCEL_INTERMEDIO_COURSE,
  EXCEL_AVANZADO_COURSE,
];
