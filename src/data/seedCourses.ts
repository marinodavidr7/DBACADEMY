import type { Course } from '../types';

export const EXCEL_BASICO_COURSE: Course = {
  id: 'excel-basico-05',
  title: 'Excel Básico: La Pantalla, Datos, Fórmulas y Funciones Esenciales',
  subtitle: 'Domina la interfaz de Excel, tipos de datos, formato desde Inicio, fórmulas con operadores (+, -, *, /, ^), referencias relativas/absolutas y funciones.',
  description:
    'Curso práctico paso a paso diseñado para dominar la pantalla de Excel, la cuadrícula bidimensional, tipos de datos y edición, formato desde la pestaña Inicio, fórmulas con operadores y referencias relativas y absolutas con F4, cálculo del ITBIS del 18% y las 13 funciones matemáticas y estadísticas fundamentales.',
  category: 'Productividad',
  level: 'beginner',
  priceCents: 0,
  currency: 'USD',
  coverImage: '/assets/images/course_excel_basico_1795186770853.webp',
  instructorId: 'platform-faculty',
  instructorName: 'Equipo DB Academy',
  published: true,
  technologies: ['Excel', 'La Pantalla de Excel', 'Formato', 'Fórmulas', 'F4 / ITBIS', 'SI()', 'Simulador 3D'],
  modulesCount: 4,
  totalLessons: 23,
  modules: [
    {
      id: 'mod-excel-1',
      title: 'MÓDULO 1: LA PANTALLA DE EXCEL',
      durationMinutes: 45,
      quizQuestion: '¿Qué componente de la pantalla de Excel muestra la coordenada exacta de la celda activa seleccionada?',
      quizOptions: [
        'El Cuadro de nombres',
        'La Barra de estado',
        'La Cinta de opciones',
      ],
      quizCorrectIndex: 0,
      lessons: [
        {
          id: 'les-excel-1-1',
          title: '1.1 Las piezas de la pantalla de Excel',
          durationMinutes: 15,
          summary:
            'Excel es una cuadrícula gigante donde guardas datos y haces cálculos; al abrirlo verás siempre las mismas piezas: Libro, Hoja, Celda, Columnas y filas, Cuadro de nombres, Barra de fórmulas y Cinta de opciones.',
          content:
            'Excel es una cuadrícula gigante donde guardas datos y haces cálculos; al abrirlo verás siempre las mismas piezas fundamentales:\n\n' +
            '• Libro: El archivo completo de Excel (.xlsx).\n' +
            '• Hoja: Cada pestaña dentro del libro, abajo a la izquierda. Un libro nuevo empieza con una.\n' +
            '• Celda: El cuadro donde cruzan una columna y una fila. Se nombra por su ubicación, por ejemplo B3.\n' +
            '• Columnas y filas: Las columnas se nombran con letras (A, B, C…) y las filas con números (1, 2, 3…).\n' +
            '• Cuadro de nombres: A la izquierda de la barra de fórmulas: muestra qué celda tienes seleccionada.\n' +
            '• Barra de fórmulas: Muestra y te deja editar el contenido real de la celda activa.\n' +
            '• Cinta de opciones: Las pestañas de arriba (Inicio, Insertar, Fórmulas, Datos, Vista…) con todos los comandos.\n\n' +
            'Usa el simulador interactivo disponible en esta lección para explorar cada una de las 9 piezas clave y familiarizarte con el entorno real de Microsoft Excel.',
        },
        {
          id: 'les-excel-1-2',
          title: '1.2 Cómo moverte y seleccionar rangos',
          durationMinutes: 15,
          summary:
            'Técnicas esenciales para navegar en la cuadrícula con el ratón y el teclado: clics, flechas, Tab, Enter y selección de rangos completos.',
          content:
            'Para moverte con velocidad y seguridad en la cuadrícula de Excel sigue estas reglas:\n\n' +
            '• Haz clic en una celda para seleccionarla de inmediato.\n' +
            '• Usa las flechas del teclado, o Tab (avanza hacia la derecha) y Enter (avanza hacia abajo).\n' +
            '• Arrastra con el ratón para seleccionar un rango continuo de celdas, por ejemplo A1:C5.\n' +
            '• Haz clic en la letra de una columna o en el número de una fila para seleccionarla completa de extremo a extremo.',
        },
        {
          id: 'les-excel-1-3',
          title: '1.3 Ejercicio 1: Navegación, nombramiento de hoja y rangos',
          durationMinutes: 15,
          summary:
            'Práctica paso a paso: abrir libro en blanco, escribir nombre en A1, seleccionar A1:D4, renombrar la pestaña a «Práctica» y añadir una segunda hoja con +.',
          content:
            'Paso a paso del Ejercicio 1:\n\n' +
            '1. Abre un libro en blanco en Excel.\n' +
            '2. Escribe tu nombre en la celda A1 y presiona Enter.\n' +
            '3. Selecciona el rango A1:D4 arrastrando el ratón y fíjate cómo lo muestra el Cuadro de nombres.\n' +
            '4. Haz doble clic en el nombre de la pestaña, cámbialo por «Práctica» y presiona Enter.\n' +
            '5. Pulsa el signo + junto a la pestaña para añadir una segunda hoja de cálculo.',
        },
      ],
    },
    {
      id: 'mod-excel-2',
      title: 'MÓDULO 2: DATOS Y FORMATO',
      durationMinutes: 60,
      quizQuestion: '¿Hacia qué lado de la celda se alinean automáticamente los números en Excel?',
      quizOptions: [
        'A la derecha',
        'A la izquierda',
        'Al centro',
      ],
      quizCorrectIndex: 0,
      lessons: [
        {
          id: 'les-excel-2-1',
          title: '2.1 Escribir, editar datos y controlador de relleno',
          durationMinutes: 15,
          summary:
            'Una celda puede contener texto, números o fechas (texto a la izquierda, números a la derecha). Aprende a confirmar, cancelar con Esc, editar con F2 o Supr y autocompletar series con el controlador de relleno.',
          content:
            'Una celda puede contener texto, números o fechas, y Excel los trata distinto: el texto se alinea a la izquierda y los números a la derecha.\n\n' +
            'Escribir y editar datos:\n' +
            '• Escribe en la celda y presiona Enter para confirmar o Esc para cancelar.\n' +
            '• Presiona F2 (o haz doble clic) para editar lo que ya está escrito dentro de la celda.\n' +
            '• Presiona Supr (Delete) para borrar el contenido de las celdas seleccionadas.\n' +
            '• Arrastra el cuadrito de la esquina inferior derecha de una celda (controlador de relleno) para repetir o continuar series: escribe Lunes y arrastra, y Excel completa automáticamente Martes, Miércoles, Jueves...',
        },
        {
          id: 'les-excel-2-2',
          title: '2.2 Formato desde la pestaña Inicio y formatos de número',
          durationMinutes: 20,
          summary:
            'Grupos Fuente, Alineación y Número. Formatos General, Número, Moneda, Porcentaje (0.15 → 15%), Fecha corta y autoajuste del ancho de columnas.',
          content:
            'Formato desde la pestaña Inicio:\n\n' +
            '• Negrita, cursiva, subrayado: Grupo Fuente.\n' +
            '• Cambiar tamaño o color de letra: Grupo Fuente.\n' +
            '• Color de fondo y bordes: Grupo Fuente (icono de cubeta y cuadrícula).\n' +
            '• Centrar o alinear: Grupo Alineación.\n' +
            '• Combinar y centrar un título: Grupo Alineación.\n' +
            '• Mostrar $, % o decimales: Grupo Número.\n' +
            '• Ajustar el ancho de columna: Doble clic en el borde derecho de la letra de la columna.\n\n' +
            'Formatos de número más usados: General, Número, Moneda, Porcentaje, Fecha corta y Fecha larga. Recuerda que el formato cambia cómo se ve el valor, no el valor guardado: 0.15 con formato Porcentaje se ve como 15 %.',
        },
        {
          id: 'les-excel-2-3',
          title: '2.3 Ejercicio 2: Lista de productos con formato profesional',
          durationMinutes: 25,
          summary:
            'Construye la lista de productos (Producto, Precio, Cantidad), aplica negrita, fondo, centrado, formato Moneda y autoajuste de columnas.',
          content:
            'Paso a paso del Ejercicio 2 (Lista de productos):\n\n' +
            '1. En la hoja «Práctica», escribe en la fila 1 los encabezados: Producto, Precio, Cantidad.\n' +
            '2. Debajo escribe cinco productos con su precio y cantidad (por ejemplo: Arroz a 65 y cantidad 10; Habichuelas a 75 y cantidad 8; Aceite a 120 y cantidad 5; Leche a 60 y cantidad 12; Azúcar a 45 y cantidad 15).\n' +
            '3. Pon los encabezados en negrita, con fondo de color y texto centrado.\n' +
            '4. Aplica formato Moneda a la columna Precio.\n' +
            '5. Ajusta el ancho de las columnas haciendo doble clic en el borde derecho de cada letra.',
        },
      ],
    },
    {
      id: 'mod-excel-3',
      title: 'MÓDULO 3: FÓRMULAS Y REFERENCIAS',
      durationMinutes: 75,
      quizQuestion: '¿Qué tipo de referencia fija la celda ($B$2) para que no cambie al arrastrar la fórmula hacia abajo o a la derecha?',
      quizOptions: [
        'Referencia Absoluta ($B$2)',
        'Referencia Relativa (B2)',
        'Referencia Mixta ($B2)',
      ],
      quizCorrectIndex: 0,
      lessons: [
        {
          id: 'les-excel-3-1',
          title: '3.1 Fórmulas, operadores básicos y jerarquía matemática',
          durationMinutes: 20,
          summary:
            'Una fórmula siempre empieza con (=). Operadores aritméticos (+, -, *, /, ^), jerarquía con paréntesis y ventajas de las referencias vs números fijos.',
          content:
            'Una fórmula siempre empieza con el signo igual (=) y le pide a Excel que calcule algo usando los valores de otras celdas.\n\n' +
            'Operadores básicos:\n' +
            '• Suma (+): Ejemplo =B2+C2\n' +
            '• Resta (-): Ejemplo =B2-C2\n' +
            '• Multiplicación (*): Ejemplo =B2*C2\n' +
            '• División (/): Ejemplo =B2/C2\n' +
            '• Potencia (^): Ejemplo =B2^2\n\n' +
            'Jerarquía matemática: Excel respeta el orden algebraico: primero paréntesis, luego potencias (^), después multiplicación y división (*, /), y al final suma y resta (+, -). Usa paréntesis para controlar el orden: =(A1+A2)*3.\n\n' +
            'Por qué usar referencias y no números fijos: Si escribes =B2*C2 en lugar de =65*10, el resultado se actualiza solo cuando cambias el precio o la cantidad.',
        },
        {
          id: 'les-excel-3-2',
          title: '3.2 Tipos de referencia (Relativa, Absoluta, Mixta), tecla F4 e ITBIS',
          durationMinutes: 25,
          summary:
            'Diferencias entre B2, $B$2 y $B2/B$2. Tecla F4 para alternar. Caso real: cálculo del ITBIS del 18% fijando la celda de tasa con =$E$1.',
          content:
            'Copiar fórmulas y tipos de referencia:\n\n' +
            '• Relativa (B2): Se ajusta a la nueva posición al arrastrar (B2 pasa a B3 al copiar hacia abajo).\n' +
            '• Absoluta ($B$2): No cambia nunca, congelando tanto la columna como la fila con el signo $.\n' +
            '• Mixta ($B2 o B$2): Fija solo la columna ($B2) o solo la fila (B$2).\n\n' +
            'Presiona F4 mientras editas una referencia para alternar entre estos tipos.\n\n' +
            'Ejemplo típico: calcular el ITBIS del 18% guardando la tasa en la celda E1 y usando =D2*$E$1 para que la tasa no se mueva al copiar la fórmula hacia las demás filas.',
        },
        {
          id: 'les-excel-3-3',
          title: '3.3 Diagnóstico de errores comunes (#¡DIV/0!, #¿NOMBRE?, #¡VALOR!, #####)',
          durationMinutes: 15,
          summary:
            'Significado y corrección de los errores más frecuentes en hojas de cálculo profesionales.',
          content:
            'Errores comunes en Excel y soluciones:\n\n' +
            '• #¡DIV/0!: dividiste entre cero o entre una celda vacía. Corrige el divisor.\n' +
            '• #¿NOMBRE?: escribiste mal el nombre de una función o referencia inexistente.\n' +
            '• #¡VALOR!: intentaste operar matemáticamente con texto donde hacía falta un número.\n' +
            '• #####: la columna es muy angosta; ensánchala haciendo doble clic en el borde derecho.',
        },
        {
          id: 'les-excel-3-4',
          title: '3.4 Ejercicio 3: Cálculo de Total e ITBIS reactivo',
          durationMinutes: 15,
          summary:
            'Práctica paso a paso: columna D con Total =B2*C2, arrastrar con controlador, celda E1 con 18%, cálculo de ITBIS =D2*$E$1 y verificación reactiva.',
          content:
            'Paso a paso del Ejercicio 3:\n\n' +
            '1. En tu lista de productos de la hoja «Práctica», agrega la columna D con el título Total.\n' +
            '2. En D2 escribe =B2*C2 y presiona Enter.\n' +
            '3. Arrastra el controlador de relleno hasta el último producto.\n' +
            '4. En E1 escribe 18% y, en la columna E, calcula el ITBIS de cada producto con =D2*$E$1.\n' +
            '5. Cambia un precio y comprueba que los totales se actualizan solos.',
        },
      ],
    },
    {
      id: 'mod-excel-4',
      title: 'MÓDULO 4 — FUNCIONES MATEMÁTICAS Y ESTADÍSTICAS BÁSICAS',
      durationMinutes: 200,
      quizQuestion: '¿Qué función suma celdas únicamente cuando cumplen múltiples condiciones simultáneas?',
      quizOptions: ['SUMAR.SI.CONJUNTO', 'CONTAR.BLANCO', 'SUBTOTALES'],
      quizCorrectIndex: 0,
      lessons: [
        {
          id: 'les-excel-4-1',
          title: '4.1 SUMA, RESTA, PRODUCTO',
          durationMinutes: 15,
          summary: 'Operaciones aritméticas base sobre rangos y valores individuales.',
          content:
            'SUMA(rango) totaliza múltiples celdas ignorando texto. Para restar se utiliza el operador - (=A2-B2) o suma con negativos. PRODUCTO(rango) multiplica todos los números indicados, útil en factores de crecimiento o volúmenes.',
        },
        {
          id: 'les-excel-4-2',
          title: '4.2 PROMEDIO, MEDIANA, MODA',
          durationMinutes: 15,
          summary: 'Medidas de tendencia central para resumir conjuntos de datos.',
          content:
            'PROMEDIO calcula la media aritmética; MEDIANA obtiene el valor central (robusto frente a valores extremos); MODA.UNO (o MODA) identifica el dato que se repite con mayor frecuencia.',
        },
        {
          id: 'les-excel-4-3',
          title: '4.3 MAX, MIN, MAX.SI, MIN.SI (conjunto .SI)',
          durationMinutes: 15,
          summary: 'Identifica extremos globales y extremos filtrados por criterios.',
          content:
            'MAX(rango) y MIN(rango) devuelven el mayor y menor valor numérico. Con MAX.SI.CONJUNTO(rango_max; rango_criterio1; criterio1) y MIN.SI.CONJUNTO obtienes máximos y mínimos por categoría, región o periodo.',
        },
        {
          id: 'les-excel-4-4',
          title: '4.4 CONTAR, CONTARA, CONTAR.BLANCO',
          durationMinutes: 15,
          summary: 'Conteo de celdas numéricas, no vacías y espacios en blanco para control de calidad.',
          content:
            'CONTAR solo contabiliza celdas con números o fechas. CONTARA cuenta cualquier celda no vacía (texto, números o fórmulas). CONTAR.BLANCO detecta registros incompletos o campos pendientes.',
        },
        {
          id: 'les-excel-4-5',
          title: '4.5 CONTAR.SI, CONTAR.SI.CONJUNTO',
          durationMinutes: 15,
          summary: 'Conteo condicional simple y multicriterio con operadores lógicos y comodines (*, ?).',
          content:
            'CONTAR.SI(rango; ">=100") cuenta bajo una condición. CONTAR.SI.CONJUNTO permite evaluar múltiples pares de rango/criterio simultáneamente, como ventas aprobadas en un mes específico.',
        },
        {
          id: 'les-excel-4-6',
          title: '4.6 SUMAR.SI, SUMAR.SI.CONJUNTO',
          durationMinutes: 15,
          summary: 'Totales segmentados por uno o varios criterios de negocio.',
          content:
            'En SUMAR.SI(rango_criterio; criterio; [rango_suma]) el rango a sumar va al final; en cambio, en SUMAR.SI.CONJUNTO(rango_suma; rango_criterio1; criterio1; ...) el rango a sumar siempre va primero.',
        },
        {
          id: 'les-excel-4-7',
          title: '4.7 PROMEDIO.SI, PROMEDIO.SI.CONJUNTO',
          durationMinutes: 15,
          summary: 'Cálculo de promedios segmentados excluyendo registros fuera de criterio.',
          content:
            'Sigue la misma lógica de SUMAR.SI y SUMAR.SI.CONJUNTO para obtener medias específicas por departamento, producto o estado de cumplimiento.',
        },
        {
          id: 'les-excel-4-8',
          title: '4.8 REDONDEAR, REDONDEAR.MAS, REDONDEAR.MENOS',
          durationMinutes: 15,
          summary: 'Control preciso de decimales que modifica el valor real almacenado en la celda.',
          content:
            'A diferencia del formato visual de decimales, REDONDEAR(número; núm_decimales) cambia el valor matemático real evitando discrepancias de centavos. REDONDEAR.MAS redondea hacia arriba alejándose de cero y REDONDEAR.MENOS hacia cero.',
        },
        {
          id: 'les-excel-4-9',
          title: '4.9 ENTERO, TRUNCAR, RESIDUO',
          durationMinutes: 15,
          summary: 'Extracción de parte entera, corte sin redondeo y resto de división.',
          content:
            'ENTERO redondea hacia el entero inferior más cercano; TRUNCAR elimina la parte decimal sin redondear. RESIDUO(número; divisor) devuelve el resto de la división, muy útil para detectar números pares/impares o ciclos.',
        },
        {
          id: 'les-excel-4-10',
          title: '4.10 POTENCIA, RAIZ, ABS',
          durationMinutes: 15,
          summary: 'Exponentes, raíces cuadradas y magnitudes absolutas sin signo negativo.',
          content:
            'POTENCIA(base; exponente) equivale al operador ^. RAIZ(número) calcula la raíz cuadrada de valores positivos. ABS(número) convierte desviaciones negativas en valores positivos para medir error absoluto.',
        },
        {
          id: 'les-excel-4-11',
          title: '4.11 ALEATORIO, ALEATORIO.ENTRE, ALEATORIO.ARRAY',
          durationMinutes: 15,
          summary: 'Generación de muestras aleatorias y matrices dinámicas para simulación.',
          content:
            'ALEATORIO() genera decimales entre 0 y 1. ALEATORIO.ENTRE(inferior; superior) produce enteros en un intervalo. ALEATORIO.ARRAY(filas; columnas; min; max; entero) genera matrices completas en Excel moderno. Son funciones volátiles que recalculan en cada cambio.',
        },
        {
          id: 'les-excel-4-12',
          title: '4.12 SUBTOTALES (con filtros)',
          durationMinutes: 15,
          summary: 'Agregaciones dinámicas que ignoran filas ocultas por AutoFiltro.',
          content:
            'SUBTOTALES(núm_función; ref1) permite calcular suma (9), promedio (1), contar (2) o máximo (4) respetando automáticamente los filtros aplicados en una tabla. Usar códigos 101–111 ignora también filas ocultadas manualmente.',
        },
        {
          id: 'les-excel-4-13',
          title: '4.13 SI (Función lógica de decisión)',
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
