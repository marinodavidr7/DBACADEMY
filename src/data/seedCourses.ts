import type { Course } from '../types';

export const EXCEL_BASICO_COURSE: Course = {
  id: 'excel-basico-05',
  title: 'Excel Básico: Fundamentos y Funciones Matemáticas y Estadísticas',
  subtitle: 'Domina referencias, manejo de errores, anidamiento y las funciones esenciales de cálculo y análisis en Excel.',
  description:
    'Curso práctico paso a paso diseñado para dominar la anatomía de fórmulas en Excel, referencias relativas/absolutas/mixtas, resolución de errores frecuentes y las 12 familias de funciones matemáticas y estadísticas básicas.',
  category: 'Productividad',
  level: 'beginner',
  priceCents: 0,
  currency: 'USD',
  coverImage: '/assets/images/course_excel_basico_1795186770853.webp',
  instructorId: 'platform-faculty',
  instructorName: 'Equipo DB Academy',
  published: true,
  technologies: ['Excel', 'Fórmulas', 'SI()', 'SUMAR.SI', 'CONTAR.SI', 'Simulador 3D'],
  modulesCount: 2,
  totalLessons: 21,
  modules: [
    {
      id: 'mod-excel-0',
      title: 'MÓDULO 0 — FUNDAMENTOS PREVIOS',
      durationMinutes: 120,
      quizQuestion: '¿Qué símbolo fija tanto la columna como la fila en una referencia absoluta?',
      quizOptions: [
        'El signo dólar antes de la letra y el número ($A$1)',
        'El signo igual al final de la celda (A1=)',
        'Comillas dobles alrededor de la coordenada ("A1")',
      ],
      quizCorrectIndex: 0,
      lessons: [
        {
          id: 'les-excel-0-0',
          title: '0.0 Conceptos Básicos: Columnas, Filas, Celdas y la Pantalla de Excel',
          durationMinutes: 20,
          summary:
            'Aprende a orientarte en la hoja de cálculo: cómo se organizan las columnas (verticales con letras), las filas (horizontales con números), las celdas y la anatomía interactiva completa de la pantalla de Microsoft Excel (las 9 piezas clave, cinta de opciones y barra de fórmulas).',
          content:
            'Toda hoja de cálculo en Excel está estructurada como una inmensa cuadrícula bidimensional dentro de una potente interfaz de trabajo. Las columnas son bandas verticales nombradas con letras de la A a la Z (hasta XFD, 16.384 columnas). Las filas son bandas horizontales numeradas del 1 al 1.048.576. El punto exacto donde se cruzan una columna y una fila es una celda (ej. C4). La pantalla de Excel se compone de 9 piezas fundamentales: 1) Barra de título y acceso rápido, 2) Cinta de opciones con sus pestañas de herramientas (Inicio, Insertar, Disposición, Fórmulas, Datos, Vista), 3) Cuadro de nombres, 4) Barra de fórmulas fx, 5) Encabezados de columnas, 6) Encabezados de filas, 7) Celda activa con su controlador de relleno, 8) Pestañas de hojas y 9) Barra de estado con zoom. En esta lección dispones de un simulador interactivo para explorar la pantalla y la cuadrícula en vivo.',
        },
        {
          id: 'les-excel-0-1',
          title: '0.1 Anatomía de una función (nombre, argumentos, sintaxis)',
          durationMinutes: 15,
          summary: 'Estructura universal de toda fórmula en Excel: signo igual, nombre de función, paréntesis y separadores.',
          content:
            'Toda función inicia con = seguido del nombre (por ejemplo SUMA), paréntesis de apertura y sus argumentos separados por coma o punto y coma según la configuración regional. Ejemplo: =SUMA(A1:A10). Comprender los argumentos obligatorios frente a los opcionales [entre corchetes] te permite leer cualquier función sin memorizarla.',
        },
        {
          id: 'les-excel-0-2',
          title: '0.2 Referencias: relativas, absolutas ($A$1) y mixtas',
          durationMinutes: 15,
          summary: 'Controla cómo cambian o permanecen fijas las celdas al copiar fórmulas con F4.',
          content:
            'Una referencia relativa (A1) se ajusta al arrastrar la fórmula. Una referencia absoluta ($A$1) bloquea fila y columna, ideal para tasas de impuestos o tipos de cambio. Las referencias mixtas ($A1 o A$1) fijan solo la columna o solo la fila para construir tablas de doble entrada en segundos.',
        },
        {
          id: 'les-excel-0-3',
          title: '0.3 Referencias a hojas y libros externos',
          durationMinutes: 15,
          summary: 'Conecta datos entre pestañas usando el operador ! y vincula otros archivos de Excel.',
          content:
            "Para referenciar una celda en otra hoja usa el formato NombreHoja!Celda (o 'Nombre con espacios'!A1). Para libros externos abiertos o guardados, Excel antepone el nombre del archivo entre corchetes: =[Presupuesto.xlsx]Resumen!$B$4.",
        },
        {
          id: 'les-excel-0-4',
          title: '0.4 Operadores (aritméticos, comparación, concatenación, referencia)',
          durationMinutes: 15,
          summary: 'Jerarquía de cálculo: +, -, *, /, ^, =, <>, &, : y espacio de intersección.',
          content:
            'Excel evalúa primero paréntesis y exponentes (^), luego multiplicación/división (*, /) y finalmente suma/resta (+, -). Los operadores de comparación (=, >, <, >=, <=, <>) devuelven VERDADERO o FALSO. El operador & concatena textos y : define rangos continuos (A1:C10).',
        },
        {
          id: 'les-excel-0-5',
          title: '0.5 Uso del Asistente de funciones y autocompletado',
          durationMinutes: 15,
          summary: 'Aprovecha Tab, fx y las sugerencias en pantalla para escribir fórmulas sin errores tipográficos.',
          content:
            'Al escribir =PRO, Excel despliega las coincidencias; pulsa Tabulador para completar y abrir el paréntesis. El botón fx (Insertar función) muestra la descripción de cada argumento y el resultado preliminar en vivo antes de confirmar.',
        },
        {
          id: 'les-excel-0-6',
          title: '0.6 Cómo leer y corregir errores (#¡VALOR!, #N/A, #REF!, #DIV/0!)',
          durationMinutes: 15,
          summary: 'Diagnóstico rápido de los errores más frecuentes en hojas de cálculo profesionales.',
          content:
            '#DIV/0! ocurre al dividir entre cero o celda vacía; #¡VALOR! indica tipo de dato incompatible (sumar texto); #REF! aparece cuando se eliminó una celda referenciada; #N/A señala que una búsqueda no halló coincidencia. Combina la auditoría de fórmulas con SI.ERROR cuando corresponda.',
        },
        {
          id: 'les-excel-0-7',
          title: '0.7 Anidar funciones correctamente',
          durationMinutes: 15,
          summary: 'Usa el resultado de una función como argumento directo de otra de forma legible.',
          content:
            'Anidar consiste en colocar una función dentro de un argumento de otra, por ejemplo: =REDONDEAR(PROMEDIO(B2:B20); 2). Cuida que cada paréntesis de apertura tenga su cierre del mismo color y valida primero la función interna antes de envolverla.',
        },
      ],
    },
    {
      id: 'mod-excel-1',
      title: 'MÓDULO 1 — FUNCIONES MATEMÁTICAS Y ESTADÍSTICAS BÁSICAS',
      durationMinutes: 200,
      quizQuestion: '¿Qué función suma celdas únicamente cuando cumplen múltiples condiciones simultáneas?',
      quizOptions: ['SUMAR.SI.CONJUNTO', 'CONTAR.BLANCO', 'SUBTOTALES'],
      quizCorrectIndex: 0,
      lessons: [
        {
          id: 'les-excel-1-1',
          title: '1.1 SUMA, RESTA, PRODUCTO',
          durationMinutes: 15,
          summary: 'Operaciones aritméticas base sobre rangos y valores individuales.',
          content:
            'SUMA(rango) totaliza múltiples celdas ignorando texto. Para restar se utiliza el operador - (=A2-B2) o suma con negativos. PRODUCTO(rango) multiplica todos los números indicados, útil en factores de crecimiento o volúmenes.',
        },
        {
          id: 'les-excel-1-2',
          title: '1.2 PROMEDIO, MEDIANA, MODA',
          durationMinutes: 15,
          summary: 'Medidas de tendencia central para resumir conjuntos de datos.',
          content:
            'PROMEDIO calcula la media aritmética; MEDIANA obtiene el valor central (robusto frente a valores extremos); MODA.UNO (o MODA) identifica el dato que se repite con mayor frecuencia.',
        },
        {
          id: 'les-excel-1-3',
          title: '1.3 MAX, MIN, MAX.SI, MIN.SI (conjunto .SI)',
          durationMinutes: 15,
          summary: 'Identifica extremos globales y extremos filtrados por criterios.',
          content:
            'MAX(rango) y MIN(rango) devuelven el mayor y menor valor numérico. Con MAX.SI.CONJUNTO(rango_max; rango_criterio1; criterio1) y MIN.SI.CONJUNTO obtienes máximos y mínimos por categoría, región o periodo.',
        },
        {
          id: 'les-excel-1-4',
          title: '1.4 CONTAR, CONTARA, CONTAR.BLANCO',
          durationMinutes: 15,
          summary: 'Conteo de celdas numéricas, no vacías y espacios en blanco para control de calidad.',
          content:
            'CONTAR solo contabiliza celdas con números o fechas. CONTARA cuenta cualquier celda no vacía (texto, números o fórmulas). CONTAR.BLANCO detecta registros incompletos o campos pendientes.',
        },
        {
          id: 'les-excel-1-5',
          title: '1.5 CONTAR.SI, CONTAR.SI.CONJUNTO',
          durationMinutes: 15,
          summary: 'Conteo condicional simple y multicriterio con operadores lógicos y comodines (*, ?).',
          content:
            'CONTAR.SI(rango; ">=100") cuenta bajo una condición. CONTAR.SI.CONJUNTO permite evaluar múltiples pares de rango/criterio simultáneamente, como ventas aprobadas en un mes específico.',
        },
        {
          id: 'les-excel-1-6',
          title: '1.6 SUMAR.SI, SUMAR.SI.CONJUNTO',
          durationMinutes: 15,
          summary: 'Totales segmentados por uno o varios criterios de negocio.',
          content:
            'En SUMAR.SI(rango_criterio; criterio; [rango_suma]) el rango a sumar va al final; en cambio, en SUMAR.SI.CONJUNTO(rango_suma; rango_criterio1; criterio1; ...) el rango a sumar siempre va primero.',
        },
        {
          id: 'les-excel-1-7',
          title: '1.7 PROMEDIO.SI, PROMEDIO.SI.CONJUNTO',
          durationMinutes: 15,
          summary: 'Cálculo de promedios segmentados excluyendo registros fuera de criterio.',
          content:
            'Sigue la misma lógica de SUMAR.SI y SUMAR.SI.CONJUNTO para obtener medias específicas por departamento, producto o estado de cumplimiento.',
        },
        {
          id: 'les-excel-1-8',
          title: '1.8 REDONDEAR, REDONDEAR.MAS, REDONDEAR.MENOS',
          durationMinutes: 15,
          summary: 'Control preciso de decimales que modifica el valor real almacenado en la celda.',
          content:
            'A diferencia del formato visual de decimales, REDONDEAR(número; núm_decimales) cambia el valor matemático real evitando discrepancias de centavos. REDONDEAR.MAS redondea hacia arriba alejándose de cero y REDONDEAR.MENOS hacia cero.',
        },
        {
          id: 'les-excel-1-9',
          title: '1.9 ENTERO, TRUNCAR, RESIDUO',
          durationMinutes: 15,
          summary: 'Extracción de parte entera, corte sin redondeo y resto de división.',
          content:
            'ENTERO redondea hacia el entero inferior más cercano; TRUNCAR elimina la parte decimal sin redondear. RESIDUO(número; divisor) devuelve el resto de la división, muy útil para detectar números pares/impares o ciclos.',
        },
        {
          id: 'les-excel-1-10',
          title: '1.10 POTENCIA, RAIZ, ABS',
          durationMinutes: 15,
          summary: 'Exponentes, raíces cuadradas y magnitudes absolutas sin signo negativo.',
          content:
            'POTENCIA(base; exponente) equivale al operador ^. RAIZ(número) calcula la raíz cuadrada de valores positivos. ABS(número) convierte desviaciones negativas en valores positivos para medir error absoluto.',
        },
        {
          id: 'les-excel-1-11',
          title: '1.11 ALEATORIO, ALEATORIO.ENTRE, ALEATORIO.ARRAY',
          durationMinutes: 15,
          summary: 'Generación de muestras aleatorias y matrices dinámicas para simulación.',
          content:
            'ALEATORIO() genera decimales entre 0 y 1. ALEATORIO.ENTRE(inferior; superior) produce enteros en un intervalo. ALEATORIO.ARRAY(filas; columnas; min; max; entero) genera matrices completas en Excel moderno. Son funciones volátiles que recalculan en cada cambio.',
        },
        {
          id: 'les-excel-1-12',
          title: '1.12 SUBTOTALES (con filtros)',
          durationMinutes: 15,
          summary: 'Agregaciones dinámicas que ignoran filas ocultas por AutoFiltro.',
          content:
            'SUBTOTALES(núm_función; ref1) permite calcular suma (9), promedio (1), contar (2) o máximo (4) respetando automáticamente los filtros aplicados en una tabla. Usar códigos 101–111 ignora también filas ocultadas manualmente.',
        },
        {
          id: 'les-excel-1-13',
          title: '1.13 SI (Función lógica de decisión)',
          durationMinutes: 20,
          summary: 'Evalúa condiciones lógicas para tomar decisiones automáticas (=SI(prueba; verdadero; falso)), anidar niveles y combinar con Y / O.',
          content:
            'La función SI comprueba si una prueba lógica es VERDADERO o FALSO y devuelve un resultado distinto para cada rama. Sintaxis: =SI(prueba_lógica; valor_si_verdadero; [valor_si_falso]). Puedes anidar múltiples SI para clasificar en 3 o más niveles, o combinarla con Y() y O() para evaluar múltiples condiciones simultáneas. Usa el Simulador 3D de =SI() integrado en esta lección para ver cómo cada dato toma decisiones en tiempo real.',
        },
      ],
    },
  ],
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
  prerequisites: ['excel-basico-05'],
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
];

export const SEED_COURSES: Course[] = [
  EXCEL_BASICO_COURSE,
  EXCEL_INTERMEDIO_COURSE,
  EXCEL_AVANZADO_COURSE,
];
