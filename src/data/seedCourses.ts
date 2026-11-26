import type { Course } from '../types';
import { EXCEL_MODULE_QUIZZES } from './excelModuleQuizzes';

export const EXCEL_BASICO_COURSE: Course = {
  id: 'excel-basico-05',
  title: 'Excel Básico: La Pantalla, Datos, Fórmulas y Funciones Esenciales',
  subtitle: 'Domina la interfaz de Excel, tipos de datos, formato desde Inicio, fórmulas con operadores (+, -, *, /, ^), referencias relativas/absolutas y funciones.',
  description:
    'Curso práctico paso a paso diseñado para dominar la pantalla de Excel, la cuadrícula bidimensional, tipos de datos y edición, formato desde la pestaña Inicio, fórmulas con operadores y referencias relativas y absolutas con F4, cálculo del ITBIS del 18% y las 13 funciones matemáticas y estadísticas fundamentales.',
  category: 'Productividad',
  level: 'beginner',
  priceCents: 60000,
  currency: 'DOP',
  coverImage: '/assets/images/course_excel_basico_1795186770853.webp',
  instructorId: 'platform-faculty',
  instructorName: 'Equipo DB Academy',
  published: true,
  technologies: ['Excel'],
  modulesCount: 5,
  totalLessons: 31,
  modules: [
    {
      id: 'mod-excel-0',
      title: 'MÓDULO 0 — FUNDAMENTOS PREVIOS',
      durationMinutes: 120,
      quizQuestion: '¿Cómo se identifica una celda en Excel y qué símbolo fija las coordenadas al arrastrar?',
      quizOptions: [
        'Con la letra de columna y el número de fila (ej. B3); el signo $ fija la coordenada',
        'Con el número de fila y luego la letra (ej. 3B)',
        'Únicamente con el número de fila',
      ],
      quizCorrectIndex: 0,
      quizEnabled: true,
      questions: EXCEL_MODULE_QUIZZES['mod-excel-0'],
      lessons: [
        {
          id: 'les-excel-0-0',
          title: '0.0 Conceptos Básicos: Columnas, Filas y Celdas',
          durationMinutes: 15,
          summary: 'La cuadrícula bidimensional de Excel: columnas con letras (A-XFD), filas con números (1-1048576) y celdas únicas (ej. B3).',
          content:
            'La hoja de cálculo organiza toda la información en una cuadrícula bidimensional de columnas (verticales, identificadas con letras de la A a la XFD) y filas (horizontales, identificadas con números del 1 al 1.048.576).\n\n' +
            '• Columnas: Verticales con letras (A, B, C...). Hay 16.384 columnas hasta XFD.\n' +
            '• Filas: Horizontales con números (1, 2, 3...). Hay 1.048.576 filas.\n' +
            '• Celda: El cuadro donde cruzan una columna y una fila. Se nombra por su coordenada: primero la letra y luego el número (ej. B3 o C4).\n' +
            '• Cuadro de nombres: Muestra en todo momento la celda activa que tienes seleccionada.\n' +
            '• Barra de fórmulas: Muestra y permite editar el contenido real de la celda activa.\n\n' +
            'Explora la guía interactiva completa adjunta en los materiales de esta lección para ver la cuadrícula y practicar con la pantalla interactiva.',
          materials: [
            {
              id: 'mat-partes-pantalla-img',
              name: 'Partes principales de una hoja de cálculo de Excel',
              url: '/assets/aistudio/Infograf_a__Partes_principales_de_la_hoja_de_Excel_8da439cd.webp',
              type: 'image',
              description:
                'Vista panorámica de la interfaz: Cinta de opciones, Cuadro de nombres (celda B7), Barra de fórmulas (=SUMA(B2:B6)), Columnas (A–K), Filas numeradas, Celda activa, pestañas de Hojas y Barra de zoom.',
              sizeByte: 107702,
              uploadedAt: '2026-11-23T00:00:00.000Z',
            },
            {
              id: 'mat-img-concepto-columnas-00',
              name: 'Columnas en Excel: Eje Vertical (A–XFD)',
              url: '/assets/images/excel_concepto_columnas_1795446880239.jpg',
              type: 'image',
              description:
                'Eje vertical de la hoja de cálculo: 16.384 columnas nombradas con letras (A, B, C... hasta XFD). Hacer clic en la letra de columna la selecciona de arriba hacia abajo.',
              sizeByte: 437622,
              uploadedAt: '2026-11-23T00:00:00.000Z',
            },
            {
              id: 'mat-img-concepto-filas-00',
              name: 'Filas en Excel: Eje Horizontal (1–1.048.576)',
              url: '/assets/images/excel_concepto_filas_1795446901853.jpg',
              type: 'image',
              description:
                'Eje horizontal numerado del 1 al 1.048.576. Pulsar el número en el margen izquierdo selecciona toda la fila completa a lo ancho de la hoja.',
              sizeByte: 469026,
              uploadedAt: '2026-11-23T00:00:00.000Z',
            },
            {
              id: 'mat-img-concepto-celda-00',
              name: 'Celda Activa, Coordenadas y Cuadro de Nombres (C4)',
              url: '/assets/images/excel_concepto_celda_activa_1795446902202.jpg',
              type: 'image',
              description:
                'Intersección única entre columna y fila (ej. Columna C + Fila 4 = Celda C4), reflejada en el Cuadro de nombres junto al contenido real en la Barra de fórmulas y el controlador de relleno.',
              sizeByte: 510611,
              uploadedAt: '2026-11-23T00:00:00.000Z',
            },
            {
              id: 'mat-img-concepto-rangos-00',
              name: 'Rangos de Celdas Continuos (B2:D5)',
              url: '/assets/images/excel_concepto_rangos_1795446902863.jpg',
              type: 'image',
              description:
                'Bloque rectangular definido por celda inicial y celda final unidas con dos puntos (:). El ejemplo B2:D5 abarca exactamente 12 celdas contiguas.',
              sizeByte: 440221,
              uploadedAt: '2026-11-23T00:00:00.000Z',
            },
            {
              id: 'mat-img-cuadricula-basica-00',
              name: 'Cuadrícula bidimensional: Columnas, Filas, Celda B3 y Rango D2:E4',
              url: '/assets/images/excel_columnas_filas_celdas_1795446159490.jpg',
              type: 'image',
              description:
                'Síntesis visual de coordenadas: columnas verticales, filas horizontales, celda activa B3 y rango continuo D2:E4 en un mismo plano.',
              sizeByte: 333205,
              uploadedAt: '2026-11-23T00:00:00.000Z',
            },
            {
              id: 'mat-img-estructura-grid-00',
              name: 'Estructura completa de la cuadrícula: Columnas, Filas y Celda B3',
              url: '/assets/images/excel_estructura_grid_completa_1795447779102.jpg',
              type: 'image',
              description:
                'Infografía unificada de conceptos básicos: encabezados alfabéticos de columna, encabezados numéricos de fila, barra de fórmulas y celda activa B3 en intersección.',
              sizeByte: 453911,
              uploadedAt: '2026-11-23T00:00:00.000Z',
            },
            {
              id: 'mat-fundamentos-previos-html-00',
              name: 'Guía Interactiva: Fundamentos Previos y Pantalla de Excel (HTML)',
              url: '/excel-basico/FUNDAMENTOSPREVIOS.html',
              type: 'doc',
              sizeByte: 111419,
              uploadedAt: '2026-11-22T00:00:00.000Z',
            },
          ],
        },
        {
          id: 'les-excel-0-1',
          title: '0.1 Anatomía de una función (nombre, argumentos, sintaxis)',
          durationMinutes: 15,
          summary: 'Estructura universal de toda fórmula en Excel: signo igual, nombre de función, paréntesis y separadores.',
          content:
            'Toda función inicia con = seguido del nombre (por ejemplo SUMA), paréntesis de apertura y sus argumentos separados por coma o punto y coma según la configuración regional. Ejemplo: =SUMA(A1:A10). Comprender los argumentos obligatorios frente a los opcionales [entre corchetes] te permite leer cualquier función sin memorizarla.\n\n' +
            'Partes de una función:\n' +
            '1. Signo igual (=): Le indica a Excel que ejecute un cálculo y no almacene texto plano.\n' +
            '2. Nombre oficial de la función (ej. SUMA, PROMEDIO, SI).\n' +
            '3. Paréntesis de apertura (:\n' +
            '4. Argumentos separados por comas o punto y coma.\n' +
            '5. Paréntesis de cierre ).',
          materials: [
            {
              id: 'mat-img-anatomia-funcion-01',
              name: 'Anatomía universal de una función en Excel (=SUMA)',
              url: '/assets/images/excel_anatomia_funcion_1795445064862.jpg',
              type: 'image',
              description:
                'Desglose sintáctico de toda función: signo igual (=) inicial para activar el cálculo, nombre oficial en mayúsculas, paréntesis delimitadores y argumentos separados por punto y coma (;).',
              sizeByte: 465650,
              uploadedAt: '2026-11-23T00:00:00.000Z',
            },
            {
              id: 'mat-fundamentos-previos-html-01',
              name: 'Guía Interactiva: Fundamentos Previos y Pantalla de Excel (HTML)',
              url: '/excel-basico/FUNDAMENTOSPREVIOS.html',
              type: 'doc',
              sizeByte: 111419,
              uploadedAt: '2026-11-22T00:00:00.000Z',
            },
          ],
        },
        {
          id: 'les-excel-0-2',
          title: '0.2 Referencias: relativas, absolutas ($A$1) y mixtas',
          durationMinutes: 15,
          summary: 'Controla cómo cambian o permanecen fijas las celdas al copiar fórmulas con F4.',
          content:
            'Una referencia relativa (A1) se ajusta al arrastrar la fórmula. Una referencia absoluta ($A$1) bloquea fila y columna, ideal para tasas de impuestos o tipos de cambio. Las referencias mixtas ($A1 o A$1) fijan solo la columna o solo la fila para construir tablas de doble entrada en segundos.\n\n' +
            'Ciclo F4:\n' +
            '• A1: Relativa (cambia al copiar)\n' +
            '• $A$1: Absoluta (nunca cambia)\n' +
            '• A$1: Mixta (fila fija, columna libre)\n' +
            '• $A1: Mixta (columna fija, fila libre)',
          materials: [
            {
              id: 'mat-img-referencias-f4-02',
              name: 'Referencias Relativas, Absolutas ($A$1) y Mixtas (F4)',
              url: '/assets/images/excel_referencias_f4_1795445064452.jpg',
              type: 'image',
              description:
                'Comparación del desplazamiento de coordenadas al copiar fórmulas hacia abajo o derecha y uso de la tecla F4 para alternar entre A1, $A$1, A$1 y $A1.',
              sizeByte: 429923,
              uploadedAt: '2026-11-23T00:00:00.000Z',
            },
            {
              id: 'mat-fundamentos-previos-html-02',
              name: 'Guía Interactiva: Fundamentos Previos y Pantalla de Excel (HTML)',
              url: '/excel-basico/FUNDAMENTOSPREVIOS.html',
              type: 'doc',
              sizeByte: 111419,
              uploadedAt: '2026-11-22T00:00:00.000Z',
            },
          ],
        },
        {
          id: 'les-excel-0-3',
          title: '0.3 Referencias a hojas y libros externos',
          durationMinutes: 15,
          summary: 'Conecta datos entre pestañas usando el operador ! y vincula otros archivos de Excel.',
          content:
            'Para referenciar una celda en otra hoja usa el formato NombreHoja!Celda (o \'Nombre con espacios\'!A1). Para libros externos abiertos o guardados, Excel antepone el nombre del archivo entre corchetes: =[Presupuesto.xlsx]Resumen!$B$4.\n\n' +
            '• Misma hoja: =A1+B1\n' +
            '• Otra hoja del mismo libro: =Hoja2!A1\n' +
            '• Hoja con espacios: =\'Ventas 2026\'!B5\n' +
            '• Libro externo: =\'[Presupuesto.xlsx]Hoja1\'!A1',
          materials: [
            {
              id: 'mat-img-referencias-hojas-03',
              name: 'Referencias entre hojas y libros externos (! y [Libro.xlsx])',
              url: '/assets/images/excel_referencias_hojas_externas_1795447779076.jpg',
              type: 'image',
              description:
                'Sintaxis visual para enlazar datos de otras pestañas (=Hoja2!A1, =\'Ventas 2026\'!B5) y archivos externos (=[Presupuesto.xlsx]Resumen!$B$4).',
              sizeByte: 311888,
              uploadedAt: '2026-11-23T00:00:00.000Z',
            },
            {
              id: 'mat-03-referencias-animado-html',
              name: 'Tutorial Animado 2D: Referencias a hojas y libros externos (HTML)',
              url: '/excel-basico/0.3 Referencias a hojas y libros externos.html',
              type: 'doc',
              sizeByte: 76516,
              uploadedAt: '2026-11-22T00:00:00.000Z',
            },
            {
              id: 'mat-fundamentos-previos-html-03',
              name: 'Guía Interactiva: Fundamentos Previos y Pantalla de Excel (HTML)',
              url: '/excel-basico/FUNDAMENTOSPREVIOS.html',
              type: 'doc',
              sizeByte: 111419,
              uploadedAt: '2026-11-22T00:00:00.000Z',
            },
          ],
        },
        {
          id: 'les-excel-0-4',
          title: '0.4 Operadores (aritméticos, comparación, concatenación, referencia)',
          durationMinutes: 15,
          summary: 'Jerarquía de cálculo: +, -, *, /, ^, =, <>, &, : y espacio de intersección.',
          content:
            'Excel evalúa primero paréntesis y exponentes (^), luego multiplicación/división (*, /) y finalmente suma/resta (+, -). Los operadores de comparación (=, >, <, >=, <=, <>) devuelven VERDADERO o FALSO. El operador & concatena textos y : define rangos continuos (A1:C10).\n\n' +
            '• Aritméticos: + - * / ^ %\n' +
            '• Comparación: = > < >= <= <>\n' +
            '• Concatenación: & (une texto)\n' +
            '• Referencia: : (rango), , o ; (unión), espacio (intersección)',
          materials: [
            {
              id: 'mat-img-jerarquia-operadores-04',
              name: 'Jerarquía de evaluación de operadores en fórmulas de Excel',
              url: '/assets/images/excel_jerarquia_formulas_1795446160425.jpg',
              type: 'image',
              description:
                'Prioridad de ejecución: 1) Paréntesis (), 2) Potencia ^ y porcentaje %, 3) Multiplicación * y división /, 4) Suma + y resta -. Muestra la diferencia entre =(2+3)*4 = 20 y =2+3*4 = 14.',
              sizeByte: 426537,
              uploadedAt: '2026-11-23T00:00:00.000Z',
            },
            {
              id: 'mat-img-tipos-operadores-04',
              name: 'Tipos de operadores en Excel: aritméticos, comparación y texto (&)',
              url: '/assets/images/excel_tipos_operadores_1795447919466.jpg',
              type: 'image',
              description:
                'Resumen visual de los cuatro niveles de precedencia aritmética junto al operador de concatenación (&) y operadores lógicos de comparación (=, >, <, <>).',
              sizeByte: 459683,
              uploadedAt: '2026-11-23T00:00:00.000Z',
            },
            {
              id: 'mat-04-operadores-animado-html',
              name: 'Tutorial Animado 2D: Operadores en Excel (HTML)',
              url: '/excel-basico/0.4 Operadores (aritméticos, comparación, concatenación, referencia.html',
              type: 'doc',
              sizeByte: 76516,
              uploadedAt: '2026-11-22T00:00:00.000Z',
            },
            {
              id: 'mat-fundamentos-previos-html-04',
              name: 'Guía Interactiva: Fundamentos Previos y Pantalla de Excel (HTML)',
              url: '/excel-basico/FUNDAMENTOSPREVIOS.html',
              type: 'doc',
              sizeByte: 111419,
              uploadedAt: '2026-11-22T00:00:00.000Z',
            },
          ],
        },
        {
          id: 'les-excel-0-5',
          title: '0.5 Uso del Asistente de funciones y autocompletado',
          durationMinutes: 15,
          summary: 'Aprovecha Tab, fx y las sugerencias en pantalla para escribir fórmulas sin errores tipográficos.',
          content:
            'Al escribir =PRO, Excel despliega las coincidencias; pulsa Tabulador para completar y abrir el paréntesis. El botón fx (Insertar función) muestra la descripción de cada argumento y el resultado preliminar en vivo antes de confirmar.',
          materials: [
            {
              id: 'mat-img-asistente-autocompletado-05',
              name: 'Asistente de funciones (fx), autocompletado y tecla Tab',
              url: '/assets/images/excel_asistente_autocompletado_1795447781173.jpg',
              type: 'image',
              description:
                'Cómo aprovechar el menú emergente al escribir =PRO, pulsar Tab para autocompletar, distinguir argumentos obligatorios de [opcionales] y abrir el cuadro fx.',
              sizeByte: 480070,
              uploadedAt: '2026-11-23T00:00:00.000Z',
            },
            {
              id: 'mat-fundamentos-previos-html-05',
              name: 'Guía Interactiva: Fundamentos Previos y Pantalla de Excel (HTML)',
              url: '/excel-basico/FUNDAMENTOSPREVIOS.html',
              type: 'doc',
              sizeByte: 111419,
              uploadedAt: '2026-11-22T00:00:00.000Z',
            },
          ],
        },
        {
          id: 'les-excel-0-6',
          title: '0.6 Cómo leer y corregir errores (#¡VALOR!, #N/A, #REF!, #DIV/0!)',
          durationMinutes: 15,
          summary: 'Diagnóstico rápido de los errores más frecuentes en hojas de cálculo profesionales.',
          content:
            '#DIV/0! ocurre al dividir entre cero o celda vacía; #¡VALOR! indica tipo de dato incompatible (sumar texto); #REF! aparece cuando se eliminó una celda referenciada; #N/A señala que una búsqueda no halló coincidencia. Combina la auditoría de fórmulas con SI.ERROR cuando corresponda.',
          materials: [
            {
              id: 'mat-img-errores-comunes-06',
              name: 'Guía visual de errores frecuentes en Excel (#¡DIV/0!, #¿NOMBRE?, #¡VALOR!, #REF!)',
              url: '/assets/images/excel_errores_comunes_1795445065276.jpg',
              type: 'image',
              description:
                'Tabla de diagnóstico para identificar por código la causa exacta del error en una fórmula (división por cero, texto en operación numérica, referencia eliminada o nombre mal escrito) y cómo corregirlo.',
              sizeByte: 667178,
              uploadedAt: '2026-11-23T00:00:00.000Z',
            },
            {
              id: 'mat-fundamentos-previos-html-06',
              name: 'Guía Interactiva: Fundamentos Previos y Pantalla de Excel (HTML)',
              url: '/excel-basico/FUNDAMENTOSPREVIOS.html',
              type: 'doc',
              sizeByte: 111419,
              uploadedAt: '2026-11-22T00:00:00.000Z',
            },
          ],
        },
        {
          id: 'les-excel-0-7',
          title: '0.7 Anidar funciones correctamente',
          durationMinutes: 15,
          summary: 'Usa el resultado de una función como argumento directo de otra de forma legible.',
          content:
            'Anidar consiste en colocar una función dentro de un argumento de otra, por ejemplo: =REDONDEAR(PROMEDIO(B2:B20); 2). Cuida que cada paréntesis de apertura tenga su cierre del mismo color y valida primero la función interna antes de envolverla.',
          materials: [
            {
              id: 'mat-img-anidar-funciones-07',
              name: 'Anidación de funciones: evaluación de adentro hacia afuera',
              url: '/assets/images/excel_anidar_funciones_1795447781695.jpg',
              type: 'image',
              description:
                'Ejemplo paso a paso de =REDONDEAR(PROMEDIO(B2:B20); 2): primero se resuelve la función interna PROMEDIO y su resultado alimenta a la función externa REDONDEAR.',
              sizeByte: 424406,
              uploadedAt: '2026-11-23T00:00:00.000Z',
            },
            {
              id: 'mat-fundamentos-previos-html-07',
              name: 'Guía Interactiva: Fundamentos Previos y Pantalla de Excel (HTML)',
              url: '/excel-basico/FUNDAMENTOSPREVIOS.html',
              type: 'doc',
              sizeByte: 111419,
              uploadedAt: '2026-11-22T00:00:00.000Z',
            },
          ],
        },
      ],
    },
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
      quizEnabled: true,
      questions: EXCEL_MODULE_QUIZZES['mod-excel-1'],
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
          materials: [
            {
              id: 'mat-img-pantalla-excel-11',
              name: 'Partes principales de una hoja de cálculo de Excel',
              url: '/assets/aistudio/Infograf_a__Partes_principales_de_la_hoja_de_Excel_8da439cd.webp',
              type: 'image',
              description:
                'Mapa de navegación de la ventana de Excel: ubicación de la Cinta de opciones, Cuadro de nombres, Barra de fórmulas, Celda activa y pestañas de hojas del libro.',
              sizeByte: 107702,
              uploadedAt: '2026-11-23T00:00:00.000Z',
            },
            {
              id: 'mat-img-cuadricula-excel-11',
              name: 'Sistema de coordenadas: Columnas, Filas, Celda B3 y Rango D2:E4',
              url: '/assets/images/excel_columnas_filas_celdas_1795446159490.jpg',
              type: 'image',
              description:
                'Referencia espacial dentro de la cuadrícula de Excel para distinguir encabezados de columna, números de fila, celda activa individual y selección rectangular de rango.',
              sizeByte: 333205,
              uploadedAt: '2026-11-23T00:00:00.000Z',
            },
          ],
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
          materials: [
            {
              id: 'mat-img-concepto-rangos-12',
              name: 'Selección de rangos continuos con dos puntos (B2:D5)',
              url: '/assets/images/excel_concepto_rangos_1795446902863.jpg',
              type: 'image',
              description:
                'Define un rango continuo arrastrando desde la celda inicial superior izquierda (B2) hasta la esquina opuesta inferior derecha (D5).',
              sizeByte: 440221,
              uploadedAt: '2026-11-23T00:00:00.000Z',
            },
            {
              id: 'mat-img-rangos-seleccion-12',
              name: 'Visualización de celda única (B3) vs rango continuo (D2:E4)',
              url: '/assets/images/excel_columnas_filas_celdas_1795446159490.jpg',
              type: 'image',
              description:
                'Identifica la diferencia entre seleccionar una celda puntual (B3) y arrastrar desde la esquina superior izquierda (D2) hasta la inferior derecha (E4) para formar el rango D2:E4.',
              sizeByte: 333205,
              uploadedAt: '2026-11-23T00:00:00.000Z',
            },
          ],
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
          materials: [
            {
              id: 'mat-img-navegacion-hojas-13',
              name: 'Navegación rápida en libros: hojas, saltos con Ctrl, F5 y selección',
              url: '/assets/images/excel_navegacion_hojas_1795447920960.jpg',
              type: 'image',
              description:
                'Atajos visuales para desplazarte entre pestañas (Ctrl+AvPág), saltar al borde de datos (Ctrl+Flechas), ir directo a una celda con F5 o seleccionar tablas completas (Ctrl+E).',
              sizeByte: 372279,
              uploadedAt: '2026-11-23T00:00:00.000Z',
            },
          ],
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
      quizEnabled: true,
      questions: EXCEL_MODULE_QUIZZES['mod-excel-2'],
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
          materials: [
            {
              id: 'mat-img-datos-relleno-21',
              name: 'Alineación de tipos de datos, edición con F2 y controlador de relleno',
              url: '/assets/images/excel_datos_relleno_1795447885234.jpg',
              type: 'image',
              description:
                'Diferencia visual entre texto alineado a la izquierda y números a la derecha, teclas F2/Enter/Esc y uso del controlador de relleno para completar series como días de la semana.',
              sizeByte: 350039,
              uploadedAt: '2026-11-23T00:00:00.000Z',
            },
          ],
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
          materials: [
            {
              id: 'mat-img-formato-inicio-22',
              name: 'Grupos de formato en Inicio: Fuente, Número ($, %) y Bordes',
              url: '/assets/images/excel_formato_inicio_1795447921508.jpg',
              type: 'image',
              description:
                'Guía visual de formato en celdas: estilos de fuente y alineación, transformación visual de números (1500 → $1,500.00, 0.15 → 15%, 45 → 45.00) y diseño con rellenos y bordes.',
              sizeByte: 439922,
              uploadedAt: '2026-11-23T00:00:00.000Z',
            },
          ],
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
          materials: [
            {
              id: 'mat-img-tabla-productos-23',
              name: 'Resultado modelo: Lista de productos con formato profesional y Moneda',
              url: '/assets/images/excel_tabla_productos_1795447786171.jpg',
              type: 'image',
              description:
                'Ejemplo estructurado con encabezados destacados, formato Moneda en precios, alineación ordenada y ajuste automático de ancho de columnas.',
              sizeByte: 478124,
              uploadedAt: '2026-11-23T00:00:00.000Z',
            },
          ],
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
      quizEnabled: true,
      questions: EXCEL_MODULE_QUIZZES['mod-excel-3'],
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
          materials: [
            {
              id: 'mat-img-jerarquia-formulas-31',
              name: 'Orden de evaluación matemática en fórmulas de Excel',
              url: '/assets/images/excel_jerarquia_formulas_1795446160425.jpg',
              type: 'image',
              description:
                'Regla de precedencia paso a paso: primero paréntesis, luego potencias (^), después multiplicación/división y al final suma/resta. Evita resultados inesperados al agrupar con ().',
              sizeByte: 426537,
              uploadedAt: '2026-11-23T00:00:00.000Z',
            },
            {
              id: 'mat-img-anatomia-formula-31',
              name: 'Estructura de fórmula y argumentos en Excel',
              url: '/assets/images/excel_anatomia_funcion_1795445064862.jpg',
              type: 'image',
              description:
                'Recordatorio visual de la sintaxis obligatoria con = inicial y referencias a rangos en lugar de valores fijos escritos manualmente.',
              sizeByte: 465650,
              uploadedAt: '2026-11-23T00:00:00.000Z',
            },
          ],
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
          materials: [
            {
              id: 'mat-img-referencias-itbis-32',
              name: 'Esquema práctico: Referencia absoluta ($E$1) para ITBIS 18% con F4',
              url: '/assets/images/excel_referencias_f4_1795445064452.jpg',
              type: 'image',
              description:
                'Muestra por qué al fijar fila y columna con $ ($E$1) mediante F4, la tasa del 18% se mantiene anclada en todas las filas de la factura.',
              sizeByte: 429923,
              uploadedAt: '2026-11-23T00:00:00.000Z',
            },
            {
              id: 'mat-img-itbis-factura-32',
              name: 'Caso aplicado: Tabla de factura con Subtotal e ITBIS (18%) fijo',
              url: '/assets/images/excel_itbis_factura_1795447883578.jpg',
              type: 'image',
              description:
                'Ejemplo numérico completo de factura: cálculo de Subtotal por línea (=B3*C3) multiplicado por la tasa fija en $F$1 (=D3*$F$1) sin desplazarse al arrastrar.',
              sizeByte: 446648,
              uploadedAt: '2026-11-23T00:00:00.000Z',
            },
          ],
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
          materials: [
            {
              id: 'mat-img-errores-comunes-33',
              name: 'Tabla visual de diagnóstico: Errores comunes en Excel y su solución',
              url: '/assets/images/excel_errores_comunes_1795445065276.jpg',
              type: 'image',
              description:
                'Referencia rápida de errores de cálculo y visualización en hoja de cálculo con su causa inmediata y corrección recomendada.',
              sizeByte: 667178,
              uploadedAt: '2026-11-23T00:00:00.000Z',
            },
          ],
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
          materials: [
            {
              id: 'mat-img-itbis-factura-34',
              name: 'Modelo de factura reactiva con Total e ITBIS del 18% ($F$1)',
              url: '/assets/images/excel_itbis_factura_1795447883578.jpg',
              type: 'image',
              description:
                'Referencia visual del cálculo en cadena: cantidad × precio para obtener el subtotal de cada producto y multiplicación por la tasa fija del 18% para el ITBIS.',
              sizeByte: 446648,
              uploadedAt: '2026-11-23T00:00:00.000Z',
            },
          ],
        },
        {
          id: 'les-excel-3-5',
          title: '3.5 Operadores de Excel (aritméticos, comparación, concatenación, referencia)',
          durationMinutes: 20,
          summary: 'Operadores Aritméticos, Comparación, Concatenación y de Referencia usados en fórmulas, con jerarquía y chuleta adaptada del contenido html original.',
          content:
            '### Operadores aritméticos\n' +
            'Toda fórmula comienza con el signo igual (`=`) para indicar a Excel que debe ejecutar un cálculo y no guardar texto.\n' +
            '• **Suma (`+`)**: `=5+3` → `8`\n' +
            '• **Resta (`-`)**: `=10-4` → `6`\n' +
            '• **Multiplicación (`*`)**: `=6*7` → `42`\n' +
            '• **División (`/`)**: `=20/4` → `5`\n' +
            '• **Potencia (`^`)**: `=2^3` → `8`\n' +
            '• **Porcentaje (`%`)**: `=25%` equivale a `0.25`\n\n' +
            '### Operadores de comparación\n' +
            'Comparan dos valores y devuelven `VERDADERO` o `FALSO`. Son la base de funciones lógicas como `=SI()`.\n' +
            '• `=` Igual (`=5=5` → `VERDADERO`)\n' +
            '• `>` Mayor que / `<` Menor que\n' +
            '• `>=` Mayor o igual / `<=` Menor o igual\n' +
            '• `<>` Distinto de (`=5<>3` → `VERDADERO`)\n\n' +
            '### Concatenación (`&`) y Referencia (`:`, `,`, `;`, `!`)\n' +
            '• **Concatenación (`&`)**: Une textos o valores, por ejemplo `="Total: "&100` → `"Total: 100"` o `=A1&" "&B1`.\n' +
            '• **Rango (`:`)**: Define un bloque continuo (`=SUMA(A1:A5)`).\n' +
            '• **Unión (`;` o `,`)**: Combina rangos separados (`=SUMA(A1:B2; C1:D2)`).\n' +
            '• **Intersección (espacio)**: Celdas en común entre dos rangos (`=A1:C3 B2:D4` → `B2:C3`).\n' +
            '• **Otra hoja (`!`)**: `=Hoja2!A1`.\n\n' +
            '### Orden de evaluación (Jerarquía)\n' +
            'Excel resuelve primero paréntesis `()`, luego potencias `^`, después multiplicación/división (`*`, `/`) y al final suma/resta (`+`, `-`). Ejemplo: `=(2+3)*4` da `20`, mientras que `=2+3*4` da `14`.\n\n' +
            'Dirígete a la pestaña **Prácticas** para resolver los ejercicios interactivos y descargar las hojas de trabajo.',
          materials: [
            {
              id: 'mat-img-tipos-operadores-35',
              name: 'Operadores aritméticos, comparación y concatenación (&) con jerarquía',
              url: '/assets/images/excel_tipos_operadores_1795447919466.jpg',
              type: 'image',
              description:
                'Tabla visual de prioridad de evaluación: 1) Paréntesis (), 2) Potencia ^, 3) Multiplicación/División (* /), 4) Suma/Resta (+ -), junto a concatenación (&) y comparadores.',
              sizeByte: 459683,
              uploadedAt: '2026-11-23T00:00:00.000Z',
            },
          ],
        },
      ],
    },
    {
      id: 'mod-excel-4',
      title: 'MÓDULO 4 — FUNCIONES MATEMÁTICAS Y ESTADÍSTICAS BÁSICAS',
      durationMinutes: 190,
      quizQuestion: '¿Qué función suma celdas únicamente cuando cumplen múltiples condiciones simultáneas?',
      quizOptions: ['SUMAR.SI.CONJUNTO', 'CONTAR.BLANCO', 'SUBTOTALES'],
      quizCorrectIndex: 0,
      quizEnabled: true,
      questions: EXCEL_MODULE_QUIZZES['mod-excel-4'],
      lessons: [
        {
          id: 'les-excel-4-1',
          title: '4.1 SUMA, RESTA y PRODUCTO — Excel Básico',
          durationMinutes: 25,
          summary: 'Operaciones aritméticas con SUMA, RESTA (operador -) y PRODUCTO: ~10 ejercicios por función y explicaciones clave de que se suman las celdas.',
          content:
            '### 1. SUMA: `=SUMA(rango)`\n' +
            'Suma todos los valores numéricos contenidos dentro del rango especificado. **Regla clave:** referencia siempre celdas (`=SUMA(A1:A4)`), nunca escribas números fijos dentro de la fórmula (`=SUMA(10+20)`), así Excel recalcula automáticamente si cambian los datos.\n' +
            '• **Ejemplo:** Si `B2:B4` contiene `10`, `5` y `2`, `=SUMA(B2:B4)` devuelve `17`. También puedes sumar celdas no contiguas separando con `;`: `=SUMA(A1:A3; A5)`.\n\n' +
            '### 2. RESTA con operador `-`\n' +
            'En Excel no existe una función `RESTA()`: se utiliza el operador aritmético `-` entre celdas.\n' +
            '• **Ejemplo:** Con `A1 = 100` y `A2 = 37`, la fórmula `=A1-A2` devuelve `63`.\n\n' +
            '### 3. PRODUCTO: `=PRODUCTO(rango)`\n' +
            'Multiplica entre sí todos los números de un rango o lista de argumentos, ignorando textos o celdas vacías.\n' +
            '• **Ejemplo:** Con `B2:B4` = `10`, `5` y `2`, `=PRODUCTO(B2:B4)` calcula `10 × 5 × 2 = 100`.\n\n' +
            'Para poner en práctica estas tres operaciones, abre la pestaña **Prácticas** de esta lección.',
          materials: [
            {
              id: 'mat-img-suma-resta-producto-41',
              name: 'Operaciones aritméticas en rango: =SUMA, Resta (-) y =PRODUCTO',
              url: '/assets/images/excel_suma_resta_producto_1795447920118.jpg',
              type: 'image',
              description:
                'Comparación directa sobre la tabla B2:B4 (10, 5, 2): suma total con =SUMA(B2:B4) = 17, diferencia con =B2-B3 = 5 y multiplicación acumulada con =PRODUCTO(B2:B4) = 100.',
              sizeByte: 348179,
              uploadedAt: '2026-11-23T00:00:00.000Z',
            },
            {
              id: 'mat-excel-basico-fichas-rapidas',
              name: 'Fichas rápidas SUMA/RESTA/PRODUCTO/ANÁLITICAS',
              url: '/excel-basico/fichas-rapidas.txt',
              type: 'doc',
              sizeByte: 1033,
              uploadedAt: '2026-11-22T00:00:00.000Z',
            },
          ],
        },
        {
          id: 'les-excel-4-2',
          title: "4.2 REDONDEAR, REDONDEAR.MAS, REDONDEAR.MENOS",
          durationMinutes: 15,
          summary: "Redondeo preciso de decimales con =REDONDEAR, =REDONDEAR.MAS, =REDONDEAR.MENOS.",
          content:
            '### Control real del redondeo vs. formato visual\n' +
            'Reducir decimales desde la barra de herramientas solo cambia **cómo se ve** el número, pero conserva todos los decimales internos en los cálculos. Para modificar el **valor real almacenado**, usa funciones de redondeo (con `;` como separador de argumentos):\n\n' +
            '• **`=REDONDEAR(número; núm_decimales)`**: Redondeo estándar al dígito más cercano (5 o más sube). Ejemplo: `=REDONDEAR(15.678; 1)` → `15.7`.\n' +
            '• **`=REDONDEAR.MAS(número; núm_decimales)`**: Siempre redondea alejándose de cero (hacia arriba en positivos, hacia más negativo en negativos). Ejemplo: `=REDONDEAR.MAS(10.1; 0)` → `11`.\n' +
            '• **`=REDONDEAR.MENOS(número; núm_decimales)`**: Siempre redondea acercándose a cero. Ejemplo: `=REDONDEAR.MENOS(10.9; 0)` → `10`.\n\n' +
            'Visita la pestaña **Prácticas** para completar los ejercicios interactivos y descargar el libro de práctica.',
          materials: [
            {
              id: 'mat-img-redondeo-funciones-42',
              name: 'Comparativa visual de funciones de redondeo y precisión decimal',
              url: '/assets/images/excel_redondeo_funciones_1795447920696.jpg',
              type: 'image',
              description:
                'Efecto sobre un mismo número decimal (15.678): redondeo estándar (=REDONDEAR → 15.7), hacia arriba (=REDONDEAR.MAS → 16), corte sin redondear (=TRUNCAR → 15.6) y entero (=ENTERO → 15).',
              sizeByte: 396883,
              uploadedAt: '2026-11-23T00:00:00.000Z',
            },
          ],
        },
        {
          id: 'les-excel-4-3',
          title: "4.3 ENTERO, TRUNCAR, RESIDUO, POTENCIA, RAIZ, ABS",
          durationMinutes: 20,
          summary: "Funciones para extraer partes enteras, restos y potencias: =ENTERO, =TRUNCAR, =RESIDUO, =POTENCIA, =RAIZ, =ABS.",
          content:
            '### Extracción de enteros y restos\n' +
            '• **`=ENTERO(número)`**: Redondea hacia abajo al entero inferior más cercano. En positivos quita decimales (`=ENTERO(2.7)` → `2`), pero en negativos baja un entero (`=ENTERO(-2.7)` → `-3`).\n' +
            '• **`=TRUNCAR(número; [núm_decimales])`**: Corta los decimales sin redondear (`=TRUNCAR(-2.7)` → `-2`; `=TRUNCAR(15.678; 1)` → `15.6`).\n' +
            '• **`=RESIDUO(número; divisor)`**: Devuelve únicamente el resto entero de una división (`=RESIDUO(10; 3)` → `1`). Muy útil para detectar números pares o múltiplos.\n\n' +
            '### Potencias, raíces y magnitud\n' +
            '• **`=POTENCIA(base; exponente)`**: Eleva una base a una potencia, equivalente al operador `^` (`=POTENCIA(5; 2)` → `25`).\n' +
            '• **`=RAIZ(número)`**: Calcula la raíz cuadrada de un número positivo (`=RAIZ(25)` → `5`).\n' +
            '• **`=ABS(número)`**: Devuelve el valor absoluto sin signo negativo (`=ABS(-45)` → `45`).\n\n' +
            'Pon a prueba cada función en la pestaña **Prácticas**.',
          materials: [
            {
              id: 'mat-img-matematicas-exactas-43',
              name: 'Funciones matemáticas exactas: POTENCIA, RAIZ, RESIDUO y ABS',
              url: '/assets/images/excel_matematicas_exactas_1795447950908.jpg',
              type: 'image',
              description:
                'Cuatro fichas técnicas visuales: elevación con =POTENCIA(5; 2) = 25, raíz cuadrada con =RAIZ(25) = 5, resto entero de división con =RESIDUO(10; 3) = 1 y magnitud positiva con =ABS(-45) = 45.',
              sizeByte: 354588,
              uploadedAt: '2026-11-23T00:00:00.000Z',
            },
          ],
        },
        {
          id: 'les-excel-4-4',
          title: "4.4 PROMEDIO, MEDIANA, MODA",
          durationMinutes: 15,
          summary: "Medidas de tendencia central: =PROMEDIO, =MEDIANA, =MODA.UNO.",
          content:
            '### Tres formas de resumir un conjunto de datos\n' +
            'Sobre un mismo rango numérico `A1:E1` con valores `10, 10, 20, 40, 70`, cada medida responde a una pregunta distinta:\n\n' +
            '• **`=PROMEDIO(rango)`**: Suma todos los números y divide entre cuántos hay (`150 / 5 = 30`). Sensible a valores extremos muy altos o bajos.\n' +
            '• **`=MEDIANA(rango)`**: Ordena los datos y toma exactamente el valor central (`20`). Si la cantidad es par, promedia los dos del medio.\n' +
            '• **`=MODA.UNO(rango)`**: Identifica el valor que aparece con mayor frecuencia en el rango (`10`).\n\n' +
            'Practica calculando estas medidas en la pestaña **Prácticas**.',
          materials: [
            {
              id: 'mat-img-tendencia-central-44',
              name: 'Medidas de tendencia central: PROMEDIO, MEDIANA y MODA.UNO',
              url: '/assets/images/excel_tendencia_central_1795447950900.jpg',
              type: 'image',
              description:
                'Sobre la serie ordenada A1:E1 (10, 10, 20, 40, 70): la media aritmética es 30, el valor central o mediana es 20 y el valor más repetido o moda es 10.',
              sizeByte: 366240,
              uploadedAt: '2026-11-23T00:00:00.000Z',
            },
          ],
        },
        {
          id: 'les-excel-4-5',
          title: "4.5 MAX, MIN, MAX.SI.CONJUNTO / MAXIFS, MIN.SI.CONJUNTO / MINIFS",
          durationMinutes: 20,
          summary: "Extremos globales y filtrados por criterios: =MAX/=MIN, =MAX.SI.CONJUNTO/=MAXIFS, =MIN.SI.CONJUNTO/=MINIFS.",
          content:
            '### Extremos globales: `MAX` y `MIN`\n' +
            '• **`=MAX(rango)`**: Devuelve el valor numérico más grande del rango (`=MAX(5; 2; 9)` → `9`).\n' +
            '• **`=MIN(rango)`**: Devuelve el valor numérico más pequeño del rango (`=MIN(5; 2; 9)` → `2`).\n\n' +
            '### Extremos condicionales: `MAX.SI.CONJUNTO` / `MAXIFS` y `MIN.SI.CONJUNTO` / `MINIFS`\n' +
            'Encuentran el máximo o mínimo únicamente entre las filas que cumplen uno o más criterios:\n' +
            '• **Sintaxis:** `=MAX.SI.CONJUNTO(rango_máximo; rango_criterio1; criterio1; ...)` (o `=MAXIFS(...)` en Excel en inglés).\n' +
            '• **Ejemplo:** Si `B1:B5` tiene montos y `A1:A5` tiene categorías, `=MAX.SI.CONJUNTO(B1:B5; A1:A5; "Venta")` devuelve el monto más alto únicamente dentro de `"Venta"`.\n' +
            '• Para el menor condicional se sigue exactamente el mismo orden con `=MIN.SI.CONJUNTO(...)` / `=MINIFS(...)`.\n\n' +
            'Completa los 15 ejercicios correspondientes en la pestaña **Prácticas**.',
          materials: [
            {
              id: 'mat-img-max-min-ifs-45',
              name: 'Extremos globales y condicionales: MAX, MIN, K.ESIMO y MAX.SI.CONJUNTO',
              url: '/assets/images/excel_max_min_ifs_1795447951483.jpg',
              type: 'image',
              description:
                'Contraste sobre ventas por sucursal: máximo global (450), mínimo global (100), segundo mayor (=K.ESIMO.MAYOR = 300) y máximo filtrado por sucursal Norte (=MAX.SI.CONJUNTO = 300).',
              sizeByte: 428681,
              uploadedAt: '2026-11-23T00:00:00.000Z',
            },
          ],
        },
        {
          id: 'les-excel-4-6',
          title: "4.6 CONTAR, CONTARA, CONTAR.BLANCO",
          durationMinutes: 15,
          summary: "Conteo de celdas num\u00e9ricas, no vac\u00edas y espacios en blanco.",
          content:
            '### Cómo cuenta Excel según el tipo de contenido\n' +
            'No todas las funciones de conteo cuentan lo mismo. Sobre un rango `A1:A5` con dos números, dos textos y una celda realmente vacía:\n\n' +
            '• **`=CONTAR(rango)`**: Cuenta únicamente celdas con **números o fechas** (resultado: `2`). Ignora textos y celdas vacías.\n' +
            '• **`=CONTARA(rango)`**: Cuenta **cualquier celda no vacía**, incluyendo texto, números, fechas, errores o fórmulas que devuelven `""` (resultado: `4`).\n' +
            '• **`=CONTAR.BLANCO(rango)`**: Cuenta exclusivamente **celdas vacías** (resultado: `1`).\n\n' +
            'Realiza las prácticas interactivas de conteo en la pestaña **Prácticas**.',
          materials: [
            {
              id: 'mat-img-conteo-basico-46',
              name: 'Diferencia visual entre CONTAR, CONTARA y CONTAR.BLANCO',
              url: '/assets/images/excel_conteo_basico_1795447884246.jpg',
              type: 'image',
              description:
                'Sobre la columna A1:A5 con dos números, dos textos y una celda vacía: =CONTAR devuelve 2 (solo números), =CONTARA devuelve 4 (todas las ocupadas) y =CONTAR.BLANCO devuelve 1.',
              sizeByte: 441130,
              uploadedAt: '2026-11-23T00:00:00.000Z',
            },
          ],
        },
        {
          id: 'les-excel-4-7',
          title: "4.7 CONTAR.SI, CONTAR.SI.CONJUNTO",
          durationMinutes: 20,
          summary: "Conteo condicional simple y multicriterio con ;, comodines * y ?.",
          content:
            '### Conteo con una condición: `=CONTAR.SI(rango; criterio)`\n' +
            'Cuenta cuántas celdas dentro de un rango cumplen una condición específica. Los criterios de texto o comparación (`">=20"`, `"Norte"`) siempre van entre comillas:\n' +
            '• **Ejemplo numérico:** `=CONTAR.SI(A1:A5; ">=20")` cuenta las celdas con valor mayor o igual a 20.\n' +
            '• **Comodines de texto:** Usa `*` para cualquier cantidad de caracteres (`"R*"` coincide con todo texto que empiece con R) y `?` para un solo carácter.\n\n' +
            '### Conteo con múltiples condiciones: `=CONTAR.SI.CONJUNTO(rango1; criterio1; rango2; criterio2; ...)`\n' +
            'Cuenta únicamente las filas que cumplen **todos los criterios simultáneamente** (lógica **Y**). Cada rango debe tener exactamente el mismo número de filas.\n' +
            '• **Ejemplo:** `=CONTAR.SI.CONJUNTO(A2:A10; "Norte"; B2:B10; "Activo")` cuenta solo los registros que son de la zona Norte y además están Activos.\n\n' +
            'Pon a prueba ambos casos en la pestaña **Prácticas**.',
          materials: [
            {
              id: 'mat-img-contar-si-47',
              name: 'Conteo condicional simple y multicriterio: CONTAR.SI y CONTAR.SI.CONJUNTO',
              url: '/assets/images/excel_contar_si_1795447885491.jpg',
              type: 'image',
              description:
                'Muestra cómo =CONTAR.SI cuenta las filas que cumplen 1 criterio (Área="Norte" → 3) y =CONTAR.SI.CONJUNTO exige simultáneamente varios criterios (Norte + Activo → 2).',
              sizeByte: 427872,
              uploadedAt: '2026-11-23T00:00:00.000Z',
            },
          ],
        },
        {
          id: 'les-excel-4-8',
          materials: [
            {
              id: 'mat-img-sumar-si-48',
              name: 'Suma condicional: =SUMAR.SI y =SUMAR.SI.CONJUNTO',
              url: '/assets/images/excel_sumar_si_1795447949802.jpg',
              type: 'image',
              description:
                'Filtrado de sumas sobre tabla Área/Venta: =SUMAR.SI(A2:A5; "Norte"; B2:B5) suma únicamente las filas de Norte (100 + 200 = 300), extensible a múltiples condiciones con .CONJUNTO.',
              sizeByte: 427266,
              uploadedAt: '2026-11-23T00:00:00.000Z',
            },
            {
              id: 'mat-excel-basico-fichas-rapidas',
              name: 'Fichas rápidas SUMA/RESTA/PRODUCTO/ANÁLITICAS',
              url: '/excel-basico/fichas-rapidas.txt',
              type: 'doc',
              sizeByte: 1033,
              uploadedAt: '2026-11-22T00:00:00.000Z',
            },
          ],
          title: "4.8 SUMAR.SI, SUMAR.SI.CONJUNTO",
          durationMinutes: 20,
          summary: "Suma segmentada con criterios; usa ; en Excel B\u00e1sico.",
          content:
            '### 1. Suma con un criterio: `=SUMAR.SI(rango_criterio; criterio; [rango_suma])`\n' +
            'Suma valores únicamente de las filas que cumplen la condición indicada:\n' +
            '• **`rango_criterio`**: Columna donde Excel evalúa la condición (ej. `A2:A5` con áreas).\n' +
            '• **`criterio`**: Condición entre comillas si es texto u operador (`"Norte"`, `">100"`, `"Rar*"`).\n' +
            '• **`[rango_suma]`**: Columna con los números a sumar (ej. `B2:B5`). Si se omite, suma el mismo `rango_criterio`.\n' +
            '• **Ejemplo:** `=SUMAR.SI(A2:A5; "Norte"; B2:B5)` suma solo los montos de la fila donde aparece `"Norte"`.\n\n' +
            '### 2. Suma con múltiples criterios: `=SUMAR.SI.CONJUNTO(rango_suma; rango_criterio1; criterio1; ...)`\n' +
            '**¡Cuidado con el orden de los argumentos!** A diferencia de `SUMAR.SI`, aquí el **rango que se va a sumar va primero**, seguido de los pares de rango y criterio.\n' +
            '• **Ejemplo:** `=SUMAR.SI.CONJUNTO(C2:C10; A2:A10; "Norte"; B2:B10; "Pagado")` suma la columna `C` solo cuando el área es `"Norte"` y el estado es `"Pagado"`.\n\n' +
            'Resuelve los 15 ejercicios paso a paso y descarga las plantillas en la pestaña **Prácticas**.',
        },
        {
          id: 'les-excel-4-9',
          materials: [
            {
              id: 'mat-img-promedio-si-49',
              name: 'Promedio condicional con =PROMEDIO.SI y =PROMEDIO.SI.CONJUNTO',
              url: '/assets/images/excel_promedio_si_1795447883774.jpg',
              type: 'image',
              description:
                'Calcula el promedio únicamente de las filas coincidentes: =PROMEDIO.SI(A2:A5; "Ventas"; B2:B5) promedia 100 y 80 entre 2 elementos devolviendo 90.',
              sizeByte: 378859,
              uploadedAt: '2026-11-23T00:00:00.000Z',
            },
            {
              id: 'mat-excel-basico-fichas-rapidas',
              name: 'Fichas rápidas SUMA/RESTA/PRODUCTO/ANÁLITICAS',
              url: '/excel-basico/fichas-rapidas.txt',
              type: 'doc',
              sizeByte: 1033,
              uploadedAt: '2026-11-22T00:00:00.000Z',
            },
          ],
          title: "4.9 PROMEDIO.SI, PROMEDIO.SI.CONJUNTO",
          durationMinutes: 15,
          summary: "Promedios segmentados con =PROMEDIO.SI y =PROMEDIO.SI.CONJUNTO.",
          content:
            '### 1. Promedio con una condición: `=PROMEDIO.SI(rango_criterio; criterio; [rango_promedio])`\n' +
            'Calcula la media aritmética únicamente de las celdas que cumplen el criterio indicado (ignorando las demás filas y evitando dividir entre el total de la tabla).\n' +
            '• **Ejemplo:** Si en `A2:A5` hay departamentos y en `B2:B5` ventas (`100` y `80` para `"Ventas"`), `=PROMEDIO.SI(A2:A5; "Ventas"; B2:B5)` calcula `(100 + 80) / 2 = 90`.\n\n' +
            '### 2. Promedio multicriterio: `=PROMEDIO.SI.CONJUNTO(rango_promedio; rango_criterio1; criterio1; ...)`\n' +
            'Al igual que `SUMAR.SI.CONJUNTO`, coloca primero el rango numérico a promediar y después los pares de `rango_criterio; criterio`.\n' +
            '• **Nota:** Si ninguna fila cumple todas las condiciones, devuelve `#¡DIV/0!` (puedes envolverla con `=SI.ERROR(...)` cuando sea necesario).\n\n' +
            'Practica esta función en la pestaña **Prácticas**.',
        },
        {
          id: 'les-excel-4-10',
          title: "4.10 SUBTOTALES (con filtros)",
          durationMinutes: 15,
          summary: "Agregaciones din\u00e1micas respetando filtros AutoFiltro (SUBTOTAL / SUBTOTALES).",
          content:
            '### ¿Por qué usar `=SUBTOTALES(...)` en lugar de `=SUMA(...)`?\n' +
            'Cuando activas un **AutoFiltro** en una tabla, `=SUMA(A2:A20)` sigue sumando las filas que quedaron ocultas por el filtro. En cambio, **`=SUBTOTALES(núm_función; ref1)`** calcula únicamente sobre las **filas visibles**.\n\n' +
            '### Códigos de función más utilizados\n' +
            '• **`1`**: `PROMEDIO`\n' +
            '• **`2`**: `CONTAR`\n' +
            '• **`3`**: `CONTARA`\n' +
            '• **`4`** / **`5`**: `MAX` / `MIN`\n' +
            '• **`9`**: `SUMA` (el más común: `=SUBTOTALES(9; B2:B50)`)\n\n' +
            'Ponlo a prueba con tablas filtradas en la pestaña **Prácticas**.',
          materials: [
            {
              id: 'mat-img-subtotales-filtro-410',
              name: 'Comparación SUMA vs =SUBTOTALES(9; ...) con AutoFiltro activo',
              url: '/assets/images/excel_subtotales_filtro_1795447884019.jpg',
              type: 'image',
              description:
                'Demuestra por qué =SUMA sigue sumando filas ocultas al filtrar (200), mientras que =SUBTOTALES(9; rango) suma exclusivamente las filas visibles (150).',
              sizeByte: 368400,
              uploadedAt: '2026-11-23T00:00:00.000Z',
            },
          ],
        },
        {
          id: 'les-excel-4-11',
          title: "4.11 ALEATORIO, ALEATORIO.ENTRE",
          durationMinutes: 10,
          summary: "Generaci\u00f3n de n\u00fameros aleatorios y enteros en intervalo.",
          content:
            '### Generación de valores dinámicos\n' +
            '• **`=ALEATORIO()`**: No lleva argumentos. Genera un número decimal uniforme mayor o igual a `0` y menor que `1` (ej. `0.4829`).\n' +
            '• **`=ALEATORIO.ENTRE(inferior; superior)`**: Devuelve un número entero aleatorio dentro del intervalo cerrado especificado (por ejemplo, `=ALEATORIO.ENTRE(1; 6)` simula el lanzamiento de un dado).\n\n' +
            '### Comportamiento de recálculo\n' +
            'Son funciones **volátiles**: cada vez que editas cualquier celda o pulsas la tecla `F9`, generan nuevos valores automáticamente. Si deseas fijar los números generados para que no cambien más, copia las celdas y usa **Pegado especial → Valores**.\n\n' +
            'Explora los ejercicios en la pestaña **Prácticas**.',
          materials: [
            {
              id: 'mat-img-aleatorio-funciones-411',
              name: 'Generación aleatoria con =ALEATORIO() y =ALEATORIO.ENTRE()',
              url: '/assets/images/excel_aleatorio_funciones_1795447952500.jpg',
              type: 'image',
              description:
                'Diferencia entre decimales uniformes entre 0 y 1 (=ALEATORIO()) y números enteros acotados en un rango (=ALEATORIO.ENTRE(10; 50)), recalculados automáticamente con F9.',
              sizeByte: 352640,
              uploadedAt: '2026-11-23T00:00:00.000Z',
            },
          ],
        },
        {
          id: 'les-excel-4-12',
          materials: [
            {
              id: 'mat-img-funcion-si-412',
              name: 'Diagrama de flujo: Toma de decisiones con =SI(prueba_lógica; verdadero; falso)',
              url: '/assets/images/excel_funcion_si_flujo_1795445065167.jpg',
              type: 'image',
              description:
                'Árbol lógico de bifurcación: evalúa la condición booleana del primer argumento y devuelve la rama Verdadero (segundo argumento) o Falso (tercer argumento).',
              sizeByte: 401570,
              uploadedAt: '2026-11-23T00:00:00.000Z',
            },
            {
              id: 'mat-excel-basico-fichas-rapidas',
              name: 'Fichas rápidas SUMA/RESTA/PRODUCTO/ANÁLITICAS',
              url: '/excel-basico/fichas-rapidas.txt',
              type: 'doc',
              sizeByte: 1033,
              uploadedAt: '2026-11-22T00:00:00.000Z',
            },
          ],          title: "4.12 SI (Funci\u00f3n l\u00f3gica de decisi\u00f3n)",
          durationMinutes: 15,
          summary: "SI(prueba_l\u00f3gica; valor_si_verdadero; valor_si_falso), anidaci\u00f3n y Y/O.",
          content:
            '### Estructura de la decisión lógica: `=SI(prueba_lógica; valor_si_verdadero; [valor_si_falso])`\n' +
            'Evalúa una condición (`A1>=60`) y toma uno de dos caminos posibles:\n' +
            '• **`prueba_lógica`**: Expresión que devuelve `VERDADERO` o `FALSO` (ej. `A1>=60`, `B1="Pagado"`).\n' +
            '• **`valor_si_verdadero`**: Resultado devuelto cuando la condición se cumple (ej. `"Aprobado"` o una fórmula como `B1*0.10`).\n' +
            '• **`[valor_si_falso]`**: Resultado devuelto cuando la condición no se cumple (ej. `"Reprobado"`).\n\n' +
            '### Combinaciones clave: `SI` anidado, `Y()` y `O()`\n' +
            '• **Anidación:** Coloca otro `SI()` en el tercer argumento para evaluar múltiples escalas: `=SI(A1>=90; "Excelente"; SI(A1>=70; "Aprobado"; "Reprobado"))`.\n' +
            '• **`Y(cond1; cond2)`**: Exige que **todas** las condiciones sean verdaderas (`=SI(Y(A1>=85; B1="Activo"); "Bono"; "Sin bono")`).\n' +
            '• **`O(cond1; cond2)`**: Basta con que **al menos una** condición sea verdadera.\n\n' +
            'Practica casos reales de evaluación y reglas de negocio en la pestaña **Prácticas**.',
        }
      ]
    }  ],
};


export const EXCEL_INTERMEDIO_COURSE: Course = {
  id: 'excel-intermedio-01',
  title: 'Excel Intermedio: Funciones Avanzadas, Datos y Análisis',
  subtitle: 'Lleva tu Excel al siguiente nivel con lógica avanzada, texto, fechas, búsquedas, tablas dinámicas y automatización.',
  description: 'Continuación del curso básico (Módulos 0 al 4). Este nivel parte de que ya dominas fórmulas, referencias y funciones estadísticas básicas. Aprenderás funciones lógicas avanzadas, manipulación de texto, fechas, búsquedas, tablas, formato condicional, tablas dinámicas, gráficos y productividad.',
  category: 'Productividad',
  level: 'intermediate',
  priceCents: 0,
  currency: 'DOP',
  coverImage: '',
  instructorId: 'platform-faculty',
  instructorName: 'Equipo DB Academy',
  published: false,
  technologies: ['Excel', 'Funciones Lógicas', 'Búsqueda', 'Tablas Dinámicas', 'Gráficos', 'Power Query'],
  modulesCount: 8,
  totalLessons: 69,
  modules: [
    {
      id: 'mod-inter-1',
      title: 'MÓDULO 1 — FUNCIONES LÓGICAS AVANZADAS',
      durationMinutes: 130,
      quizQuestion: '¿Cuál es el objetivo principal de este módulo?',
      quizOptions: ['Aplicar correctamente las herramientas del módulo en casos prácticos', 'Memorizar atajos sin practicar', 'Evitar el uso de funciones', 'Usar solo formato manual'],
      quizCorrectIndex: 0,
      quizEnabled: true,
      questions: [
        {
          id: 'q-inter-m1-1',
          prompt: '¿Cuál es el objetivo principal de este módulo?',
          explanation: 'El módulo busca que apliques las herramientas en casos prácticos, no solo memorizarlas.',
          multiple: false,
          options: [
            { id: 'q-inter-m1-1-a', text: 'Aplicar correctamente las herramientas del módulo en casos prácticos' },
            { id: 'q-inter-m1-1-b', text: 'Memorizar atajos sin practicar' },
            { id: 'q-inter-m1-1-c', text: 'Evitar el uso de funciones' },
            { id: 'q-inter-m1-1-d', text: 'Usar solo formato manual' },
          ],
          correctIndexes: [0],
        },
      ],
      lessons: [
        {
          id: 'm1-l1',
          title: '5.1 Repaso de SI y operadores de comparación',
          durationMinutes: 15,
          summary: 'Repasa la función SI y los operadores =, <>, >, <, >=, <= para construir condiciones claras.',
          content: '# 5.1 Repaso de SI y operadores de comparación\n\n## Objetivo\nReforzar la estructura =SI(prueba_lógica; valor_si_verdadero; valor_si_falso) y usar operadores de comparación correctamente.\n\n## Práctica\n1. Crea una tabla con Nombre, Nota y Estado.\n2. En Estado usa =SI(B2>=70;"Aprobado";"Reprobado").\n3. Prueba operadores: =SI(C2<>"";"Tiene dato";"Vacío"), =SI(D2>1000;"Alto";"Normal").\n4. Verifica resultados cambiando las notas.',
          type: 'text',
          status: 'draft',
        },
        {
          id: 'm1-l2',
          title: '5.2 Funciones Y, O, NO',
          durationMinutes: 15,
          summary: 'Combina condiciones con Y, O y NO para evaluar múltiples criterios.',
          content: '# 5.2 Funciones Y, O, NO\n\n## Práctica\n1. Tabla: Vendedor, Ventas, Asistencia.\n2. Bono: =SI(Y(B2>=50000;C2>=90%);"Bono";"Sin bono").\n3. Alerta: =SI(O(B2<10000;C2<80%);"Revisar";"OK").\n4. Usa NO() para invertir una condición: =SI(NO(B2="");B2;"Pendiente").',
          type: 'text',
          status: 'draft',
        },
        {
          id: 'm1-l3',
          title: '5.3 SI anidado (hasta 7 niveles) y buenas prácticas',
          durationMinutes: 15,
          summary: 'Crea decisiones con múltiples resultados usando SI anidados y aprende cuándo evitarlos.',
          content: '# 5.3 SI anidado (hasta 7 niveles) y buenas prácticas\n\n## Práctica\n1. Tabla de notas.\n2. Clasifica: =SI(B2>=90;"A";SI(B2>=80;"B";SI(B2>=70;"C";"F"))).\n3. Ordena condiciones de mayor a menor.\n4. Verifica casos límite (90, 89.9, 70).',
          type: 'text',
          status: 'draft',
        },
        {
          id: 'm1-l4',
          title: '5.4 SI.CONJUNTO / IFS',
          durationMinutes: 15,
          summary: 'Simplifica múltiples condiciones con SI.CONJUNTO/IFS.',
          content: '# 5.4 SI.CONJUNTO / IFS\n\n## Práctica\n1. Misma tabla de notas.\n2. =SI.CONJUNTO(B2>=90;"A";B2>=80;"B";B2>=70;"C";VERDADERO;"F").\n3. Compara con SI anidado.\n4. Agrega condición extra (>=95 "Excelente").',
          type: 'text',
          status: 'draft',
        },
        {
          id: 'm1-l5',
          title: '5.5 SI.ERROR y SI.ND',
          durationMinutes: 15,
          summary: 'Controla errores como #DIV/0! o #N/A con SI.ERROR y SI.ND.',
          content: '# 5.5 SI.ERROR y SI.ND\n\n## Práctica\n1. Provoca #DIV/0! con =A2/B2.\n2. Corrige: =SI.ERROR(A2/B2;0).\n3. En búsquedas: =SI.ND(BUSCARV(...);"No encontrado").\n4. Decide cuándo mostrar 0, vacío o mensaje.',
          type: 'text',
          status: 'draft',
        },
        {
          id: 'm1-l6',
          title: '5.6 CAMBIAR / SWITCH',
          durationMinutes: 15,
          summary: 'Asigna resultados según valores exactos con CAMBIAR/SWITCH.',
          content: '# 5.6 CAMBIAR / SWITCH\n\n## Práctica\n1. Código departamento 1,2,3.\n2. =CAMBIAR(A2;1;"Ventas";2;"RRHH";3;"TI";"Otro").\n3. Prueba un código inexistente.\n4. Compara CAMBIAR vs SI.CONJUNTO.',
          type: 'text',
          status: 'draft',
        },
        {
          id: 'm1-l7',
          title: '5.7 Combinar SI con Y, O y funciones de conteo',
          durationMinutes: 15,
          summary: 'Integra lógica con CONTAR.SI para decisiones basadas en conteos.',
          content: '# 5.7 Combinar SI con Y, O y funciones de conteo\n\n## Práctica\n1. Asistencia por estudiante (P/A).\n2. Ausencias: =CONTAR.SI(B2:F2;"A").\n3. Estado: =SI(CONTAR.SI(B2:F2;"A")>=2;"Riesgo";"OK").\n4. Combina con Y para intervención.',
          type: 'text',
          status: 'draft',
        },
        {
          id: 'm1-l8',
          title: '5.8 Ejercicio 5: Sistema de calificaciones y comisiones por ventas',
          durationMinutes: 25,
          summary: 'Aplica funciones lógicas para calificaciones y comisiones en un caso real.',
          content: '# 5.8 Ejercicio 5: Sistema de calificaciones y comisiones por ventas\n\n## Caso práctico\n### A) Calificaciones\n- Columnas: Estudiante, Nota, Estado, Nivel.\n- Estado con SI; Nivel con SI.CONJUNTO.\n### B) Comisiones\n- Vendedor, Ventas, Asistencia, Comisión.\n- =SI(Y(Ventas>=50000;Asistencia>=90%);Ventas*5%;SI(Ventas>=30000;Ventas*3%;0)).\n- Usa SI.ERROR donde aplique.\n## Entrega\nVerifica al menos 5 filas con casos límite.',
          type: 'excel',
          status: 'draft',
        }
      ],
    },
    {
      id: 'mod-inter-2',
      title: 'MÓDULO 2 — FUNCIONES DE TEXTO',
      durationMinutes: 130,
      quizQuestion: '¿Cuál es el objetivo principal de este módulo?',
      quizOptions: ['Aplicar correctamente las herramientas del módulo en casos prácticos', 'Memorizar atajos sin practicar', 'Evitar el uso de funciones', 'Usar solo formato manual'],
      quizCorrectIndex: 0,
      quizEnabled: true,
      questions: [
        {
          id: 'q-inter-m2-1',
          prompt: '¿Cuál es el objetivo principal de este módulo?',
          explanation: 'El módulo busca que apliques las herramientas en casos prácticos, no solo memorizarlas.',
          multiple: false,
          options: [
            { id: 'q-inter-m2-1-a', text: 'Aplicar correctamente las herramientas del módulo en casos prácticos' },
            { id: 'q-inter-m2-1-b', text: 'Memorizar atajos sin practicar' },
            { id: 'q-inter-m2-1-c', text: 'Evitar el uso de funciones' },
            { id: 'q-inter-m2-1-d', text: 'Usar solo formato manual' },
          ],
          correctIndexes: [0],
        },
      ],
      lessons: [
        {
          id: 'm2-l1',
          title: '6.1 IZQUIERDA, DERECHA, EXTRAE',
          durationMinutes: 15,
          summary: 'Extrae partes de un texto con IZQUIERDA, DERECHA y EXTRAE.',
          content: '# 6.1 IZQUIERDA, DERECHA, EXTRAE\n\n## Práctica\n1. Código PROD-001-DR: prefijo =IZQUIERDA(A2;4), país =DERECHA(A2;2), número =EXTRAE(A2;6;3).\n2. Aplica a columna completa.\n3. Combina con LARGO para textos variables.',
          type: 'text',
          status: 'draft',
        },
        {
          id: 'm2-l2',
          title: '6.2 LARGO, ENCONTRAR y HALLAR',
          durationMinutes: 15,
          summary: 'Mide textos y localiza caracteres con LARGO, ENCONTRAR y HALLAR.',
          content: '# 6.2 LARGO, ENCONTRAR y HALLAR\n\n## Práctica\n1. =LARGO(A2).\n2. =ENCONTRAR("@";A2) en email.\n3. ENCONTRAR vs HALLAR (mayúsculas).\n4. Usuario: =IZQUIERDA(A2;ENCONTRAR("@";A2)-1).',
          type: 'text',
          status: 'draft',
        },
        {
          id: 'm2-l3',
          title: '6.3 MAYUSC, MINUSC, NOMPROPIO',
          durationMinutes: 15,
          summary: 'Normaliza texto con MAYUSC, MINUSC y NOMPROPIO.',
          content: '# 6.3 MAYUSC, MINUSC, NOMPROPIO\n\n## Práctica\n1. Nombres: =NOMPROPIO(A2).\n2. Códigos: =MAYUSC(B2).\n3. Emails: =MINUSC(C2).\n4. Crea columna limpia para reportes.',
          type: 'text',
          status: 'draft',
        },
        {
          id: 'm2-l4',
          title: '6.4 ESPACIOS, LIMPIAR y SUSTITUIR',
          durationMinutes: 15,
          summary: 'Limpia texto con ESPACIOS, LIMPIAR y SUSTITUIR.',
          content: '# 6.4 ESPACIOS, LIMPIAR y SUSTITUIR\n\n## Práctica\n1. =ESPACIOS(A2) quita espacios dobles/extremos.\n2. =LIMPIAR(A2) quita caracteres no imprimibles.\n3. =SUSTITUIR(A2;"-";"") para teléfonos.\n4. Combina: =ESPACIOS(LIMPIAR(A2)).',
          type: 'text',
          status: 'draft',
        },
        {
          id: 'm2-l5',
          title: '6.5 CONCATENAR, CONCAT y UNIRCADENAS (TEXTJOIN)',
          durationMinutes: 15,
          summary: 'Une textos con CONCATENAR, CONCAT y UNIRCADENAS/TEXTJOIN.',
          content: '# 6.5 CONCATENAR, CONCAT y UNIRCADENAS (TEXTJOIN)\n\n## Práctica\n1. =A2&" "&B2.\n2. =CONCAT(A2;" ";B2).\n3. =UNIRCADENAS(", ";VERDADERO;A2:D2) ignorando vacíos.\n4. Crea dirección completa desde columnas.',
          type: 'text',
          status: 'draft',
        },
        {
          id: 'm2-l6',
          title: '6.6 TEXTO (dar formato a números y fechas dentro de fórmulas)',
          durationMinutes: 15,
          summary: 'Da formato a números y fechas dentro de fórmulas con TEXTO.',
          content: '# 6.6 TEXTO\n\n## Práctica\n1. =TEXTO(A2;"RD$#,##0.00").\n2. =TEXTO(B2;"dd/mm/yyyy").\n3. Combina: ="Factura del "&TEXTO(B2;"dd mmmm yyyy")&" por "&TEXTO(A2;"RD$#,##0.00").\n4. Recuerda: TEXTO devuelve texto.',
          type: 'text',
          status: 'draft',
        },
        {
          id: 'm2-l7',
          title: '6.7 Texto en columnas y Relleno rápido',
          durationMinutes: 15,
          summary: 'Separa y transforma datos con Texto en columnas y Relleno rápido.',
          content: '# 6.7 Texto en columnas y Relleno rápido\n\n## Práctica\n1. Separa "Nombre,Apellido" con Datos > Texto en columnas.\n2. Relleno rápido (Ctrl+E) para iniciales o dominios.\n3. Compara: Flash Fill es rápido pero no dinámico; fórmulas se actualizan.',
          type: 'text',
          status: 'draft',
        },
        {
          id: 'm2-l8',
          title: '6.8 Ejercicio 6: Limpieza de una base de datos de clientes',
          durationMinutes: 25,
          summary: 'Limpia y normaliza una base de clientes usando funciones de texto.',
          content: '# 6.8 Ejercicio 6: Limpieza de una base de datos de clientes\n\n## Caso práctico\nTabla con datos sucios: nombres mal escritos, espacios dobles, teléfonos con guiones, emails mixtos.\n## Tareas\n1. =NOMPROPIO(ESPACIOS(LIMPIAR(A2))).\n2. Email: =MINUSC(ESPACIOS(C2)).\n3. Teléfono: SUSTITUIR guiones/paréntesis.\n4. ID con IZQUIERDA/DERECHA/EXTRAE.\n5. Contacto con UNIRCADENAS.\n## Entrega\nTabla original y tabla limpia lado a lado.',
          type: 'excel',
          status: 'draft',
        }
      ],
    },
    {
      id: 'mod-inter-3',
      title: 'MÓDULO 3 — FUNCIONES DE FECHA Y HORA',
      durationMinutes: 130,
      quizQuestion: '¿Cuál es el objetivo principal de este módulo?',
      quizOptions: ['Aplicar correctamente las herramientas del módulo en casos prácticos', 'Memorizar atajos sin practicar', 'Evitar el uso de funciones', 'Usar solo formato manual'],
      quizCorrectIndex: 0,
      quizEnabled: true,
      questions: [
        {
          id: 'q-inter-m3-1',
          prompt: '¿Cuál es el objetivo principal de este módulo?',
          explanation: 'El módulo busca que apliques las herramientas en casos prácticos, no solo memorizarlas.',
          multiple: false,
          options: [
            { id: 'q-inter-m3-1-a', text: 'Aplicar correctamente las herramientas del módulo en casos prácticos' },
            { id: 'q-inter-m3-1-b', text: 'Memorizar atajos sin practicar' },
            { id: 'q-inter-m3-1-c', text: 'Evitar el uso de funciones' },
            { id: 'q-inter-m3-1-d', text: 'Usar solo formato manual' },
          ],
          correctIndexes: [0],
        },
      ],
      lessons: [
        {
          id: 'm3-l1',
          title: '7.1 Cómo almacena Excel las fechas y horas',
          durationMinutes: 15,
          summary: 'Entiende el sistema serial de fechas/horas en Excel.',
          content: '# 7.1 Cómo almacena Excel las fechas y horas\n\n## Práctica\n1. Escribe una fecha y cámbiala a formato Número (serial).\n2. 0.5 en formato Hora = 12:00 PM.\n3. Resta dos fechas para obtener días.\n4. Suma 7 a una fecha.',
          type: 'text',
          status: 'draft',
        },
        {
          id: 'm3-l2',
          title: '7.2 HOY, AHORA, FECHA, AÑO, MES, DIA',
          durationMinutes: 15,
          summary: 'Usa funciones básicas de fecha.',
          content: '# 7.2 HOY, AHORA, FECHA, AÑO, MES, DIA\n\n## Práctica\n1. =HOY() y =AHORA().\n2. =FECHA(2026;11;25).\n3. =AÑO(A2), =MES(A2), =DIA(A2).\n4. Construye fecha desde columnas Año/Mes/Día.',
          type: 'text',
          status: 'draft',
        },
        {
          id: 'm3-l3',
          title: '7.3 DIASEM, NUM.DE.SEMANA y NOMBRE de mes con TEXTO',
          durationMinutes: 15,
          summary: 'Obtén día de semana, semana y nombre de mes.',
          content: '# 7.3 DIASEM, NUM.DE.SEMANA y NOMBRE de mes con TEXTO\n\n## Práctica\n1. =DIASEM(A2;2).\n2. =NUM.DE.SEMANA(A2;2).\n3. =TEXTO(A2;"mmmm").\n4. Columna Mes-Año: =TEXTO(A2;"mmmm yyyy").',
          type: 'text',
          status: 'draft',
        },
        {
          id: 'm3-l4',
          title: '7.4 FECHA.MES, FIN.MES y EDATE',
          durationMinutes: 15,
          summary: 'Calcula fechas futuras/pasadas y fin de mes.',
          content: '# 7.4 FECHA.MES, FIN.MES y EDATE\n\n## Práctica\n1. Vencimiento: =FECHA.MES(A2;1).\n2. Fin de mes: =FIN.MES(A2;0).\n3. Mes siguiente: =FIN.MES(A2;1).\n4. Calcula fecha de corte de factura.',
          type: 'text',
          status: 'draft',
        },
        {
          id: 'm3-l5',
          title: '7.5 DIAS, DIAS.LAB, DIA.LAB y días festivos',
          durationMinutes: 15,
          summary: 'Calcula días hábiles considerando festivos.',
          content: '# 7.5 DIAS, DIAS.LAB, DIA.LAB y días festivos\n\n## Práctica\n1. =DIAS(B2;A2).\n2. =DIAS.LAB(A2;B2).\n3. Con festivos: =DIAS.LAB(A2;B2;$F$2:$F$10).\n4. Entrega: =DIA.LAB(A2;10;Festivos).',
          type: 'text',
          status: 'draft',
        },
        {
          id: 'm3-l6',
          title: '7.6 SIFECHA (DATEDIF): edades y antigüedad',
          durationMinutes: 15,
          summary: 'Calcula edades y antigüedad con SIFECHA/DATEDIF.',
          content: '# 7.6 SIFECHA (DATEDIF): edades y antigüedad\n\n## Práctica\n1. Edad: =SIFECHA(A2;HOY();"Y").\n2. Meses: =SIFECHA(A2;HOY();"M").\n3. Años y meses: =SIFECHA(A2;HOY();"Y")&" años, "&SIFECHA(A2;HOY();"YM")&" meses".\n4. Aplica a empleados.',
          type: 'text',
          status: 'draft',
        },
        {
          id: 'm3-l7',
          title: '7.7 Cálculos con horas (horas trabajadas y horas extras)',
          durationMinutes: 15,
          summary: 'Calcula horas trabajadas y extras con formato de hora.',
          content: '# 7.7 Cálculos con horas (horas trabajadas y horas extras)\n\n## Práctica\n1. Horas: =C2-B2, formato [h]:mm.\n2. Extras: =SI(C2-B2>TIEMPO(8;0;0);C2-B2-TIEMPO(8;0;0);0).\n3. Decimal para nómina: =(C2-B2)*24.\n4. Considera turnos que cruzan medianoche.',
          type: 'text',
          status: 'draft',
        },
        {
          id: 'm3-l8',
          title: '7.8 Ejercicio 7: Control de asistencia y vencimiento de contratos',
          durationMinutes: 25,
          summary: 'Controla asistencia y vencimientos con funciones de fecha.',
          content: '# 7.8 Ejercicio 7: Control de asistencia y vencimiento de contratos\n\n## Caso práctico\n1. Tabla: Empleado, Ingreso, Fin contrato, Entrada, Salida.\n2. Antigüedad con SIFECHA.\n3. Días para vencer: =B2-HOY().\n4. Estado: =SI(B2-HOY()<=30;"Por vencer";"Vigente").\n5. Horas trabajadas y extras.',
          type: 'excel',
          status: 'draft',
        }
      ],
    },
    {
      id: 'mod-inter-4',
      title: 'MÓDULO 4 — FUNCIONES DE BÚSQUEDA Y REFERENCIA',
      durationMinutes: 145,
      quizQuestion: '¿Cuál es el objetivo principal de este módulo?',
      quizOptions: ['Aplicar correctamente las herramientas del módulo en casos prácticos', 'Memorizar atajos sin practicar', 'Evitar el uso de funciones', 'Usar solo formato manual'],
      quizCorrectIndex: 0,
      quizEnabled: true,
      questions: [
        {
          id: 'q-inter-m4-1',
          prompt: '¿Cuál es el objetivo principal de este módulo?',
          explanation: 'El módulo busca que apliques las herramientas en casos prácticos, no solo memorizarlas.',
          multiple: false,
          options: [
            { id: 'q-inter-m4-1-a', text: 'Aplicar correctamente las herramientas del módulo en casos prácticos' },
            { id: 'q-inter-m4-1-b', text: 'Memorizar atajos sin practicar' },
            { id: 'q-inter-m4-1-c', text: 'Evitar el uso de funciones' },
            { id: 'q-inter-m4-1-d', text: 'Usar solo formato manual' },
          ],
          correctIndexes: [0],
        },
      ],
      lessons: [
        {
          id: 'm4-l1',
          title: '8.1 BUSCARV (V) y sus limitaciones',
          durationMinutes: 15,
          summary: 'Busca datos verticalmente con BUSCARV y conoce sus límites.',
          content: '# 8.1 BUSCARV (V) y sus limitaciones\n\n## Práctica\n1. =BUSCARV(A2;Catalogo!A:C;3;FALSO).\n2. Prueba límite: no busca a la izquierda.\n3. Inserta columna y observa ruptura por índice fijo.\n4. Maneja #N/A con SI.ND.',
          type: 'text',
          status: 'draft',
        },
        {
          id: 'm4-l2',
          title: '8.2 BUSCARH (H)',
          durationMinutes: 15,
          summary: 'Busca datos horizontalmente con BUSCARH.',
          content: '# 8.2 BUSCARH (H)\n\n## Práctica\n1. Tabla con meses en fila.\n2. =BUSCARH("Marzo";A1:M2;2;FALSO).\n3. Compara orientación con BUSCARV.',
          type: 'text',
          status: 'draft',
        },
        {
          id: 'm4-l3',
          title: '8.3 Coincidencia exacta vs. aproximada',
          durationMinutes: 15,
          summary: 'Diferencia coincidencia exacta y aproximada en búsquedas.',
          content: '# 8.3 Coincidencia exacta vs. aproximada\n\n## Práctica\n1. Rangos de comisión con aproximada (VERDADERO, tabla ordenada).\n2. Códigos con exacta (FALSO).\n3. Observa errores cuando la tabla no está ordenada en aproximada.',
          type: 'text',
          status: 'draft',
        },
        {
          id: 'm4-l4',
          title: '8.4 INDICE y COINCIDIR',
          durationMinutes: 15,
          summary: 'Combina INDICE y COINCIDIR para búsquedas flexibles.',
          content: '# 8.4 INDICE y COINCIDIR\n\n## Práctica\n1. =COINCIDIR(valor;rango;0).\n2. =INDICE(resultado;COINCIDIR(...)).\n3. Busca a la izquierda.\n4. Usa referencias absolutas.',
          type: 'text',
          status: 'draft',
        },
        {
          id: 'm4-l5',
          title: '8.5 INDICE + COINCIDIR vs. BUSCARV',
          durationMinutes: 15,
          summary: 'Compara INDICE+COINCIDIR contra BUSCARV.',
          content: '# 8.5 INDICE + COINCIDIR vs. BUSCARV\n\n## Práctica\n1. Misma búsqueda con ambas.\n2. Inserta columna: BUSCARV falla, INDICE+COINCIDIR resiste.\n3. Búsqueda a la izquierda.\n4. Decide cuándo usar cada una.',
          type: 'text',
          status: 'draft',
        },
        {
          id: 'm4-l6',
          title: '8.6 BUSCARX / XLOOKUP',
          durationMinutes: 15,
          summary: 'Usa BUSCARX/XLOOKUP como reemplazo moderno.',
          content: '# 8.6 BUSCARX / XLOOKUP\n\n## Práctica\n1. =BUSCARX(A2;Catalogo[Codigo];Catalogo[Precio];"No encontrado").\n2. Búsqueda a la izquierda.\n3. Modos de coincidencia/búsqueda.\n4. Compara con BUSCARV.',
          type: 'text',
          status: 'draft',
        },
        {
          id: 'm4-l7',
          title: '8.7 ELEGIR, FILA, COLUMNA y DESREF (introducción)',
          durationMinutes: 15,
          summary: 'Conoce ELEGIR, FILA, COLUMNA y DESREF.',
          content: '# 8.7 ELEGIR, FILA, COLUMNA y DESREF (introducción)\n\n## Práctica\n1. =ELEGIR(2;"A";"B";"C").\n2. FILA()/COLUMNA() en fórmulas dinámicas.\n3. DESREF (volátil, con precaución).\n4. Selector de mes con ELEGIR.',
          type: 'text',
          status: 'draft',
        },
        {
          id: 'm4-l8',
          title: '8.8 Búsquedas con varios criterios',
          durationMinutes: 15,
          summary: 'Búsquedas con múltiples criterios.',
          content: '# 8.8 Búsquedas con varios criterios\n\n## Práctica\n1. Clave auxiliar: =A2&"|"&B2.\n2. BUSCARX con criterios: =BUSCARX(1;(Region="Norte")*(Producto="A");Ventas).\n3. FILTRAR si disponible.\n4. Valida duplicados en criterios.',
          type: 'text',
          status: 'draft',
        },
        {
          id: 'm4-l9',
          title: '8.9 Ejercicio 8: Facturación automática con catálogo de productos',
          durationMinutes: 25,
          summary: 'Construye una factura automática con catálogo.',
          content: '# 8.9 Ejercicio 8: Facturación automática con catálogo de productos\n\n## Caso práctico\n1. Hoja Catálogo: Código, Descripción, Precio.\n2. Hoja Factura: Código, Descripción, Cantidad, Precio, Total.\n3. Trae datos con BUSCARX/BUSCARV.\n4. Total=Cantidad*Precio; Subtotal, ITBIS 18%, Total.\n5. SI.ND para códigos no encontrados.',
          type: 'excel',
          status: 'draft',
        }
      ],
    },
    {
      id: 'mod-inter-5',
      title: 'MÓDULO 5 — TABLAS Y GESTIÓN DE DATOS',
      durationMinutes: 145,
      quizQuestion: '¿Cuál es el objetivo principal de este módulo?',
      quizOptions: ['Aplicar correctamente las herramientas del módulo en casos prácticos', 'Memorizar atajos sin practicar', 'Evitar el uso de funciones', 'Usar solo formato manual'],
      quizCorrectIndex: 0,
      quizEnabled: true,
      questions: [
        {
          id: 'q-inter-m5-1',
          prompt: '¿Cuál es el objetivo principal de este módulo?',
          explanation: 'El módulo busca que apliques las herramientas en casos prácticos, no solo memorizarlas.',
          multiple: false,
          options: [
            { id: 'q-inter-m5-1-a', text: 'Aplicar correctamente las herramientas del módulo en casos prácticos' },
            { id: 'q-inter-m5-1-b', text: 'Memorizar atajos sin practicar' },
            { id: 'q-inter-m5-1-c', text: 'Evitar el uso de funciones' },
            { id: 'q-inter-m5-1-d', text: 'Usar solo formato manual' },
          ],
          correctIndexes: [0],
        },
      ],
      lessons: [
        {
          id: 'm5-l1',
          title: '9.1 Rangos vs. Tablas de Excel (Ctrl + T)',
          durationMinutes: 15,
          summary: 'Convierte rangos en Tablas y aprovecha sus ventajas.',
          content: '# 9.1 Rangos vs. Tablas de Excel (Ctrl + T)\n\n## Práctica\n1. Selecciona datos y Ctrl+T.\n2. Observa filtros, estilo, expansión automática.\n3. Agrega fila: la tabla crece.\n4. Compara con rango normal.',
          type: 'text',
          status: 'draft',
        },
        {
          id: 'm5-l2',
          title: '9.2 Referencias estructuradas y columnas calculadas',
          durationMinutes: 15,
          summary: 'Usa referencias estructuradas y columnas calculadas.',
          content: '# 9.2 Referencias estructuradas y columnas calculadas\n\n## Práctica\n1. Columna Total: =[@Cantidad]*[@Precio].\n2. Se llena automáticamente.\n3. =SUMA(Tabla1[Total]).\n4. Renombra la tabla.',
          type: 'text',
          status: 'draft',
        },
        {
          id: 'm5-l3',
          title: '9.3 Ordenar datos (simple, múltiple y personalizado)',
          durationMinutes: 15,
          summary: 'Ordena datos simple, múltiple y personalizado.',
          content: '# 9.3 Ordenar datos (simple, múltiple y personalizado)\n\n## Práctica\n1. Ordena por Ventas descendente.\n2. Múltiple: Región asc, Ventas desc.\n3. Lista personalizada: Bajo/Medio/Alto.\n4. Verifica integridad de filas.',
          type: 'text',
          status: 'draft',
        },
        {
          id: 'm5-l4',
          title: '9.4 Filtros y filtros avanzados',
          durationMinutes: 15,
          summary: 'Aplica filtros rápidos y avanzados.',
          content: '# 9.4 Filtros y filtros avanzados\n\n## Práctica\n1. Filtra por texto, número, fecha.\n2. Filtros por color.\n3. Filtro avanzado con criterios a otro lugar.\n4. Limpia filtros.',
          type: 'text',
          status: 'draft',
        },
        {
          id: 'm5-l5',
          title: '9.5 Segmentación de datos (Slicers)',
          durationMinutes: 15,
          summary: 'Filtra tablas visualmente con segmentación.',
          content: '# 9.5 Segmentación de datos (Slicers)\n\n## Práctica\n1. Inserta slicer por Región y Categoría.\n2. Filtra con clics.\n3. Ajusta formato/ubicación.\n4. Combina con totales.',
          type: 'text',
          status: 'draft',
        },
        {
          id: 'm5-l6',
          title: '9.6 Quitar duplicados',
          durationMinutes: 15,
          summary: 'Elimina duplicados de forma segura.',
          content: '# 9.6 Quitar duplicados\n\n## Práctica\n1. Copia la tabla primero.\n2. Datos > Quitar duplicados.\n3. Selecciona columnas clave.\n4. Revisa conteo eliminado.',
          type: 'text',
          status: 'draft',
        },
        {
          id: 'm5-l7',
          title: '9.7 Validación de datos y listas desplegables',
          durationMinutes: 15,
          summary: 'Restringe entradas con validación y listas.',
          content: '# 9.7 Validación de datos y listas desplegables\n\n## Práctica\n1. Lista desplegable por validación.\n2. Número entre 1 y 100.\n3. Mensaje de entrada y error.\n4. Prueba valor inválido.',
          type: 'text',
          status: 'draft',
        },
        {
          id: 'm5-l8',
          title: '9.8 Listas dependientes',
          durationMinutes: 15,
          summary: 'Crea listas desplegables dependientes.',
          content: '# 9.8 Listas dependientes\n\n## Práctica\n1. Listas fuente por categoría.\n2. Nombra rangos.\n3. Dependiente con INDIRECTO.\n4. Prueba cambiando categoría.',
          type: 'text',
          status: 'draft',
        },
        {
          id: 'm5-l9',
          title: '9.9 Ejercicio 9: Registro de inventario con validación',
          durationMinutes: 25,
          summary: 'Registro de inventario con tabla, validación y dependientes.',
          content: '# 9.9 Ejercicio 9: Registro de inventario con validación\n\n## Caso práctico\n1. Convierte a Tabla.\n2. Desplegables para Categoría y Estado.\n3. Lista dependiente Subcategoría.\n4. Columna Valor = Cantidad*Costo.\n5. Slicer por Categoría.\n6. Quitar duplicados por Código.',
          type: 'excel',
          status: 'draft',
        }
      ],
    },
    {
      id: 'mod-inter-6',
      title: 'MÓDULO 6 — FORMATO CONDICIONAL Y PROTECCIÓN',
      durationMinutes: 130,
      quizQuestion: '¿Cuál es el objetivo principal de este módulo?',
      quizOptions: ['Aplicar correctamente las herramientas del módulo en casos prácticos', 'Memorizar atajos sin practicar', 'Evitar el uso de funciones', 'Usar solo formato manual'],
      quizCorrectIndex: 0,
      quizEnabled: true,
      questions: [
        {
          id: 'q-inter-m6-1',
          prompt: '¿Cuál es el objetivo principal de este módulo?',
          explanation: 'El módulo busca que apliques las herramientas en casos prácticos, no solo memorizarlas.',
          multiple: false,
          options: [
            { id: 'q-inter-m6-1-a', text: 'Aplicar correctamente las herramientas del módulo en casos prácticos' },
            { id: 'q-inter-m6-1-b', text: 'Memorizar atajos sin practicar' },
            { id: 'q-inter-m6-1-c', text: 'Evitar el uso de funciones' },
            { id: 'q-inter-m6-1-d', text: 'Usar solo formato manual' },
          ],
          correctIndexes: [0],
        },
      ],
      lessons: [
        {
          id: 'm6-l1',
          title: '10.1 Reglas de resaltado y reglas superiores/inferiores',
          durationMinutes: 15,
          summary: 'Aplica reglas de formato condicional básicas.',
          content: '# 10.1 Reglas de resaltado y reglas superiores/inferiores\n\n## Práctica\n1. Resalta ventas > 50000.\n2. Top 10.\n3. Por debajo del promedio.\n4. Ajusta colores al criterio.',
          type: 'text',
          status: 'draft',
        },
        {
          id: 'm6-l2',
          title: '10.2 Barras de datos, escalas de color y conjuntos de iconos',
          durationMinutes: 15,
          summary: 'Visualiza datos con barras, escalas e iconos.',
          content: '# 10.2 Barras de datos, escalas de color y conjuntos de iconos\n\n## Práctica\n1. Barras en Ventas.\n2. Escala 3 colores en % Cumplimiento.\n3. Iconos semáforo.\n4. Ajusta umbrales.',
          type: 'text',
          status: 'draft',
        },
        {
          id: 'm6-l3',
          title: '10.3 Formato condicional con fórmulas personalizadas',
          durationMinutes: 15,
          summary: 'Crea reglas con fórmulas personalizadas.',
          content: '# 10.3 Formato condicional con fórmulas personalizadas\n\n## Práctica\n1. Fila completa si Estado="Vencido": =$D2="Vencido".\n2. Vence en 7 días: =Y($B2>=HOY();$B2<=HOY()+7).\n3. Usa referencias mixtas ($).\n4. Aplica al rango completo.',
          type: 'text',
          status: 'draft',
        },
        {
          id: 'm6-l4',
          title: '10.4 Administrar y priorizar reglas',
          durationMinutes: 15,
          summary: 'Gestiona y prioriza reglas de formato condicional.',
          content: '# 10.4 Administrar y priorizar reglas\n\n## Práctica\n1. Administrar reglas.\n2. Cambia prioridad.\n3. "Detener si es verdad" cuando aplique.\n4. Elimina reglas conflictivas.',
          type: 'text',
          status: 'draft',
        },
        {
          id: 'm6-l5',
          title: '10.5 Resaltar fechas vencidas y duplicados',
          durationMinutes: 15,
          summary: 'Detecta vencimientos y duplicados visualmente.',
          content: '# 10.5 Resaltar fechas vencidas y duplicados\n\n## Práctica\n1. Fechas < HOY() como vencidas.\n2. Duplicados en ID/Email.\n3. Regla distinta para "vence en 7 días".\n4. Prueba con datos.',
          type: 'text',
          status: 'draft',
        },
        {
          id: 'm6-l6',
          title: '10.6 Proteger celdas, hojas y libros',
          durationMinutes: 15,
          summary: 'Protege fórmulas y estructura.',
          content: '# 10.6 Proteger celdas, hojas y libros\n\n## Práctica\n1. Desbloquea celdas de entrada.\n2. Protege hoja.\n3. Protege libro.\n4. Prueba como usuario final.',
          type: 'text',
          status: 'draft',
        },
        {
          id: 'm6-l7',
          title: '10.7 Ocultar fórmulas y permitir rangos editables',
          durationMinutes: 15,
          summary: 'Oculta fórmulas y permite rangos editables.',
          content: '# 10.7 Ocultar fórmulas y permitir rangos editables\n\n## Práctica\n1. Marca fórmulas como Ocultas.\n2. Protege hoja.\n3. Permitir usuarios modifiquen rangos.\n4. Verifica que la fórmula no se vea.',
          type: 'text',
          status: 'draft',
        },
        {
          id: 'm6-l8',
          title: '10.8 Ejercicio 10: Semáforo de cobros y cuentas por pagar',
          durationMinutes: 25,
          summary: 'Semáforo de cobros con formato condicional y protección.',
          content: '# 10.8 Ejercicio 10: Semáforo de cobros y cuentas por pagar\n\n## Caso práctico\n1. Tabla: Cliente, Factura, Vencimiento, Monto, Estado.\n2. Estado con SI/HOY.\n3. Rojo vencido, amarillo por vencer, verde al día.\n4. Protege fórmulas, deja entradas editables.',
          type: 'excel',
          status: 'draft',
        }
      ],
    },
    {
      id: 'mod-inter-7',
      title: 'MÓDULO 7 — TABLAS DINÁMICAS Y GRÁFICOS',
      durationMinutes: 145,
      quizQuestion: '¿Cuál es el objetivo principal de este módulo?',
      quizOptions: ['Aplicar correctamente las herramientas del módulo en casos prácticos', 'Memorizar atajos sin practicar', 'Evitar el uso de funciones', 'Usar solo formato manual'],
      quizCorrectIndex: 0,
      quizEnabled: true,
      questions: [
        {
          id: 'q-inter-m7-1',
          prompt: '¿Cuál es el objetivo principal de este módulo?',
          explanation: 'El módulo busca que apliques las herramientas en casos prácticos, no solo memorizarlas.',
          multiple: false,
          options: [
            { id: 'q-inter-m7-1-a', text: 'Aplicar correctamente las herramientas del módulo en casos prácticos' },
            { id: 'q-inter-m7-1-b', text: 'Memorizar atajos sin practicar' },
            { id: 'q-inter-m7-1-c', text: 'Evitar el uso de funciones' },
            { id: 'q-inter-m7-1-d', text: 'Usar solo formato manual' },
          ],
          correctIndexes: [0],
        },
      ],
      lessons: [
        {
          id: 'm7-l1',
          title: '11.1 Qué es una tabla dinámica y cuándo usarla',
          durationMinutes: 15,
          summary: 'Entiende cuándo usar una tabla dinámica.',
          content: '# 11.1 Qué es una tabla dinámica y cuándo usarla\n\n## Práctica\n1. Identifica tabla plana con muchas filas.\n2. Preguntas: ventas por mes/región/producto.\n3. Compara con SUMAR.SI manuales.',
          type: 'text',
          status: 'draft',
        },
        {
          id: 'm7-l2',
          title: '11.2 Crear una tabla dinámica (filas, columnas, valores, filtros)',
          durationMinutes: 15,
          summary: 'Crea y configura una tabla dinámica.',
          content: '# 11.2 Crear una tabla dinámica (filas, columnas, valores, filtros)\n\n## Práctica\n1. Inserta tabla dinámica desde Tabla.\n2. Región en Filas, Mes en Columnas, Ventas en Valores.\n3. Filtro por Vendedor.\n4. Actualiza origen y refresca.',
          type: 'text',
          status: 'draft',
        },
        {
          id: 'm7-l3',
          title: '11.3 Agrupar por fechas, números y texto',
          durationMinutes: 15,
          summary: 'Agrupa campos en tablas dinámicas.',
          content: '# 11.3 Agrupar por fechas, números y texto\n\n## Práctica\n1. Agrupa fechas por Mes/Año.\n2. Agrupa montos por rangos.\n3. Agrupa manualmente.\n4. Desagrupa.',
          type: 'text',
          status: 'draft',
        },
        {
          id: 'm7-l4',
          title: '11.4 Campos calculados y configuración de valores (%, sumas, promedios)',
          durationMinutes: 15,
          summary: 'Configura valores y campos calculados.',
          content: '# 11.4 Campos calculados y configuración de valores (%, sumas, promedios)\n\n## Práctica\n1. Suma a Promedio.\n2. % del total de columna.\n3. Campo calculado Margen = Ventas-Costo.\n4. Verifica totales.',
          type: 'text',
          status: 'draft',
        },
        {
          id: 'm7-l5',
          title: '11.5 Segmentación y escalas de tiempo',
          durationMinutes: 15,
          summary: 'Filtra tablas dinámicas con slicers y timeline.',
          content: '# 11.5 Segmentación y escalas de tiempo\n\n## Práctica\n1. Slicer por Región.\n2. Escala de tiempo por Fecha.\n3. Conecta a varias tablas dinámicas.\n4. Vista interactiva.',
          type: 'text',
          status: 'draft',
        },
        {
          id: 'm7-l6',
          title: '11.6 Gráficos dinámicos',
          durationMinutes: 15,
          summary: 'Crea gráficos dinámicos conectados a tablas dinámicas.',
          content: '# 11.6 Gráficos dinámicos\n\n## Práctica\n1. Inserta gráfico dinámico.\n2. Cambia campos y observa.\n3. Filtra con segmentación.\n4. Ajusta títulos/etiquetas.',
          type: 'text',
          status: 'draft',
        },
        {
          id: 'm7-l7',
          title: '11.7 Gráficos básicos: columnas, líneas, circular y barras',
          durationMinutes: 15,
          summary: 'Elige gráficos básicos según el dato.',
          content: '# 11.7 Gráficos básicos: columnas, líneas, circular y barras\n\n## Práctica\n1. Columnas: comparación.\n2. Líneas: tendencia.\n3. Circular: pocas partes de un total.\n4. Barras: etiquetas largas.',
          type: 'text',
          status: 'draft',
        },
        {
          id: 'm7-l8',
          title: '11.8 Gráficos combinados y minigráficos (Sparklines)',
          durationMinutes: 15,
          summary: 'Combina gráficos y usa minigráficos.',
          content: '# 11.8 Gráficos combinados y minigráficos (Sparklines)\n\n## Práctica\n1. Combinado: columnas ventas, línea meta.\n2. Eje secundario.\n3. Minigráficos por fila.\n4. Revisa legibilidad.',
          type: 'text',
          status: 'draft',
        },
        {
          id: 'm7-l9',
          title: '11.9 Ejercicio 11: Reporte de ventas mensual',
          durationMinutes: 25,
          summary: 'Reporte de ventas con tabla dinámica y gráficos.',
          content: '# 11.9 Ejercicio 11: Reporte de ventas mensual\n\n## Caso práctico\n1. Datos: Fecha, Región, Vendedor, Producto, Ventas.\n2. Tabla dinámica Mes x Región.\n3. % del total.\n4. Gráfico dinámico + segmentación.\n5. Mini dashboard.',
          type: 'excel',
          status: 'draft',
        }
      ],
    },
    {
      id: 'mod-inter-8',
      title: 'MÓDULO 8 — PRODUCTIVIDAD, IMPRESIÓN Y PROYECTO FINAL',
      durationMinutes: 170,
      quizQuestion: '¿Cuál es el objetivo principal de este módulo?',
      quizOptions: ['Aplicar correctamente las herramientas del módulo en casos prácticos', 'Memorizar atajos sin practicar', 'Evitar el uso de funciones', 'Usar solo formato manual'],
      quizCorrectIndex: 0,
      quizEnabled: true,
      questions: [
        {
          id: 'q-inter-m8-1',
          prompt: '¿Cuál es el objetivo principal de este módulo?',
          explanation: 'El módulo busca que apliques las herramientas en casos prácticos, no solo memorizarlas.',
          multiple: false,
          options: [
            { id: 'q-inter-m8-1-a', text: 'Aplicar correctamente las herramientas del módulo en casos prácticos' },
            { id: 'q-inter-m8-1-b', text: 'Memorizar atajos sin practicar' },
            { id: 'q-inter-m8-1-c', text: 'Evitar el uso de funciones' },
            { id: 'q-inter-m8-1-d', text: 'Usar solo formato manual' },
          ],
          correctIndexes: [0],
        },
      ],
      lessons: [
        {
          id: 'm8-l1',
          title: '12.1 Atajos de teclado esenciales',
          durationMinutes: 15,
          summary: 'Acelera tu trabajo con atajos clave.',
          content: '# 12.1 Atajos de teclado esenciales\n\n## Práctica\n1. Ctrl+Flechas, Ctrl+Inicio/Fin.\n2. Ctrl+Shift+Flechas.\n3. F2, Ctrl+D, Ctrl+R, Ctrl+;.\n4. Ctrl+1, Ctrl+T.\n5. Crea tu hoja de atajos.',
          type: 'text',
          status: 'draft',
        },
        {
          id: 'm8-l2',
          title: '12.2 Nombres definidos y Administrador de nombres',
          durationMinutes: 15,
          summary: 'Usa nombres definidos para fórmulas claras.',
          content: '# 12.2 Nombres definidos y Administrador de nombres\n\n## Práctica\n1. Nombra rango TasaITBIS.\n2. Usa =Subtotal*TasaITBIS.\n3. Edita/elimina en Administrador de nombres.\n4. Usa nombres en validación.',
          type: 'text',
          status: 'draft',
        },
        {
          id: 'm8-l3',
          title: '12.3 Inmovilizar paneles, vistas y agrupar/esquematizar datos',
          durationMinutes: 15,
          summary: 'Mejora navegación y lectura de hojas grandes.',
          content: '# 12.3 Inmovilizar paneles, vistas y agrupar/esquematizar datos\n\n## Práctica\n1. Inmoviliza fila superior.\n2. Vistas personalizadas.\n3. Agrupa filas/columnas.\n4. Contraer/expandir en reportes.',
          type: 'text',
          status: 'draft',
        },
        {
          id: 'm8-l4',
          title: '12.4 Vincular y consolidar hojas y libros',
          durationMinutes: 15,
          summary: 'Vincula y consolida datos entre hojas/libros.',
          content: '# 12.4 Vincular y consolidar hojas y libros\n\n## Práctica\n1. =Hoja2!A1.\n2. Vínculo a otro libro (rutas).\n3. Herramienta Consolidar.\n4. Evalúa riesgos de vínculos rotos.',
          type: 'text',
          status: 'draft',
        },
        {
          id: 'm8-l5',
          title: '12.5 Configurar página, áreas de impresión, saltos y encabezados',
          durationMinutes: 15,
          summary: 'Prepara hojas para impresión profesional.',
          content: '# 12.5 Configurar página, áreas de impresión, saltos y encabezados\n\n## Práctica\n1. Área de impresión.\n2. Márgenes, orientación, escala.\n3. Repetir filas de títulos.\n4. Encabezado/pie con fecha y página.',
          type: 'text',
          status: 'draft',
        },
        {
          id: 'm8-l6',
          title: '12.6 Auditoría de fórmulas (rastrear precedentes y dependientes, Evaluar fórmula)',
          durationMinutes: 15,
          summary: 'Depura fórmulas con auditoría.',
          content: '# 12.6 Auditoría de fórmulas (rastrear precedentes y dependientes, Evaluar fórmula)\n\n## Práctica\n1. Rastrear precedentes/dependientes.\n2. Mostrar fórmulas (Ctrl+`).\n3. Evaluar fórmula.\n4. Comprobación de errores.',
          type: 'text',
          status: 'draft',
        },
        {
          id: 'm8-l7',
          title: '12.7 Análisis de hipótesis: Buscar objetivo y Administrador de escenarios',
          durationMinutes: 15,
          summary: 'Análisis con Buscar objetivo y Escenarios.',
          content: '# 12.7 Análisis de hipótesis: Buscar objetivo y Administrador de escenarios\n\n## Práctica\n1. Buscar objetivo: ventas necesarias para meta.\n2. Escenarios Optimista/Base/Pesimista.\n3. Resumen de escenarios.\n4. Interpreta resultados.',
          type: 'text',
          status: 'draft',
        },
        {
          id: 'm8-l8',
          title: '12.8 Introducción a Power Query y a las Macros',
          durationMinutes: 15,
          summary: 'Introducción a Power Query y Macros.',
          content: '# 12.8 Introducción a Power Query y a las Macros\n\n## Práctica\n1. Importa CSV con Power Query.\n2. Pasos: filtrar, cambiar tipo, quitar columnas.\n3. Carga a hoja.\n4. Graba macro simple y ejecútala.\n5. Cuándo usar cada herramienta.',
          type: 'text',
          status: 'draft',
        },
        {
          id: 'm8-l9',
          title: '12.9 Proyecto Final: Sistema de ventas e inventario con panel (dashboard)',
          durationMinutes: 25,
          summary: 'Proyecto final integrando ventas, inventario y dashboard.',
          content: '# 12.9 Proyecto Final: Sistema de ventas e inventario con panel (dashboard)\n\n## Caso práctico\n1. Catálogo (Tabla): Código, Producto, Costo, Precio.\n2. Ventas (Tabla): Fecha, Código, Cantidad, Cliente; BUSCARX, Total e ITBIS.\n3. Inventario: entradas/salidas, stock, alerta.\n4. Dashboard: tabla dinámica, gráfico, segmentación.\n5. Protege fórmulas, entradas editables.',
          type: 'excel',
          status: 'draft',
        },
        {
          id: 'm8-l10',
          title: '12.10 Evaluación final y siguientes pasos (Excel Avanzado)',
          durationMinutes: 25,
          summary: 'Evalúa el nivel intermedio y define ruta al avanzado.',
          content: '# 12.10 Evaluación final y siguientes pasos (Excel Avanzado)\n\n## Evaluación\n- Lógica, texto, fecha, búsqueda.\n- Tablas, validación, formato condicional.\n- Tablas dinámicas, gráficos, dashboard.\n- Auditoría, protección, impresión.\n## Siguientes pasos\n- Power Query avanzado, Power Pivot, Macros/VBA, dashboards profesionales.',
          type: 'excel',
          status: 'draft',
        }
      ],
    }
  ],
};


export const EXCEL_AVANZADO_COURSE: Course = {
  id: 'excel-avanzado-01',
  title: 'Excel Experto (eliminado)',
  subtitle: '',
  description: '',
  category: 'Productividad',
  level: 'advanced',
  priceCents: 0,
  currency: 'DOP',
  coverImage: '',
  instructorId: 'platform-faculty',
  instructorName: 'Equipo DB Academy',
  published: false,
  technologies: [],
  modulesCount: 0,
  totalLessons: 0,
  modules: [],
};

export const REMOVED_SEED_COURSE_IDS: readonly string[] = [
  'sys-arch-distributed-01',
  'data-science-applied-02',
  'ux-design-systems-03',
  'cybersecurity-e2ee-04',
  'excel-avanzado-01',
];

export const SEED_COURSES: Course[] = [
  EXCEL_BASICO_COURSE,
  EXCEL_INTERMEDIO_COURSE,
];
