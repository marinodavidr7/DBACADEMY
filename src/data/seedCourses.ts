import type { Course } from '../types';

export const EXCEL_BASICO_COURSE: Course = {
  id: 'excel-basico-05',
  title: 'Excel Básico: Fundamentos y Funciones Matemáticas y Estadísticas',
  subtitle: 'Domina referencias, manejo de errores, anidamiento y las funciones esenciales de cálculo y análisis en Excel.',
  description:
    'Curso práctico paso a paso diseñado para dominar la anatomía de fórmulas en Excel, referencias relativas/absolutas/mixtas, resolución de errores frecuentes y las 12 familias de funciones matemáticas y estadísticas básicas.',
  category: 'Productividad',
  level: 'beginner',
  priceCents: 4900,
  currency: 'USD',
  coverImage: '/src/assets/images/course_excel_basico_1795186770853.jpg',
  instructorId: 'platform-faculty',
  instructorName: 'Equipo DB Academy',
  published: true,
  modulesCount: 2,
  totalLessons: 20,
  modules: [
    {
      id: 'mod-excel-0',
      title: 'MÓDULO 0 — FUNDAMENTOS PREVIOS',
      durationMinutes: 105,
      quizQuestion: '¿Qué símbolo fija tanto la columna como la fila en una referencia absoluta?',
      quizOptions: [
        'El signo dólar antes de la letra y el número ($A$1)',
        'El signo igual al final de la celda (A1=)',
        'Comillas dobles alrededor de la coordenada ("A1")',
      ],
      quizCorrectIndex: 0,
      lessons: [
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
            'La función SI comprueba si una prueba lógica es VERDADERO o FALSO y devuelve un resultado distinto para cada rama. Sintaxis: =SI(prueba_lógica; valor_si_verdadero; [valor_si_falso]). Puedes anidar múltiples SI para clasificar en 3 o más niveles, o combinarla con Y() y O() para evaluar múltiples condiciones simultáneas. Usa el Simulador 3D de =SI() integrado arriba para ver cómo cada dato toma decisiones en tiempo real.',
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

export const SEED_COURSES: Course[] = [EXCEL_BASICO_COURSE];
