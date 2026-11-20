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
  totalLessons: 19,
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
      durationMinutes: 180,
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
      ],
    },
  ],
};

export const SEED_COURSES: Course[] = [
  EXCEL_BASICO_COURSE,
  {
    id: 'sys-arch-distributed-01',
    title: 'Arquitectura de Sistemas Distribuidos y Alta Disponibilidad',
    subtitle: 'Consenso, replicación multi-región, colas de eventos y tolerancia a fallos en producción.',
    description:
      'Domina los fundamentos de ingeniería detrás de plataformas resilientes: particionamiento consistente, patrones CQRS, replicación sin punto único de fallo y observabilidad distribuida.',
    category: 'Ingeniería',
    level: 'advanced',
    priceCents: 14900,
    currency: 'USD',
    coverImage: '/src/assets/images/course_system_architecture_1795146988857.jpg',
    instructorId: 'platform-faculty',
    instructorName: 'Dra. Elena Valdivia',
    published: true,
    modulesCount: 3,
    totalLessons: 6,
    modules: [
      {
        id: 'mod-sys-1',
        title: '01. Fundamentos de Consenso y Replicación',
        durationMinutes: 55,
        quizQuestion: '¿Qué propiedad garantiza el protocolo Raft cuando existe una partición de red?',
        quizOptions: [
          'Consistencia linealizable en la mayoría de nodos (quorum)',
          'Disponibilidad total sin coordinación entre réplicas',
          'Eliminación automática de latencia entre continentes',
        ],
        quizCorrectIndex: 0,
        lessons: [
          {
            id: 'les-sys-1a',
            title: 'Teorema CAP y PACELC en sistemas reales',
            durationMinutes: 25,
            summary: 'Compromisos reales entre latencia y consistencia fuerte bajo particiones.',
            content:
              'En entornos distribuidos globales, las particiones de red son inevitables. El modelo PACELC amplía el teorema CAP analizando el equilibrio entre latencia (L) y consistencia (C) incluso durante operación normal sin fallos.',
          },
          {
            id: 'les-sys-1b',
            title: 'Elección de líder y logs replicados con Raft',
            durationMinutes: 30,
            summary: 'Mecanismos de heartbeat, términos lógicos y confirmación por mayoría.',
            content:
              'Cada término en Raft inicia con una elección de líder. Un nodo solo gana si su log está al menos tan actualizado como el de la mayoría del clúster, asegurando que ninguna entrada confirmada se pierda.',
          },
        ],
      },
      {
        id: 'mod-sys-2',
        title: '02. Mensajería Asíncrona y Event Sourcing',
        durationMinutes: 60,
        quizQuestion: '¿Por qué es indispensable la idempotencia en consumidores de eventos?',
        quizOptions: [
          'Para evitar efectos duplicados ante entregas "at-least-once"',
          'Para reducir el tamaño de los encabezados HTTP',
          'Para deshabilitar el cifrado TLS en redes internas',
        ],
        quizCorrectIndex: 0,
        lessons: [
          {
            id: 'les-sys-2a',
            title: 'Patrón Outbox Transaccional',
            durationMinutes: 30,
            summary: 'Publicación fiable de eventos sin transacciones distribuidas 2PC.',
            content:
              'Al persistir el evento de dominio en la misma transacción local que la entidad de negocio y publicarlo mediante un relé asíncrono, garantizamos coherencia eventual sin bloqueos globales.',
          },
          {
            id: 'les-sys-2b',
            title: 'Diseño de consumidores idempotentes y Dead Letter Queues',
            durationMinutes: 30,
            summary: 'Claves de deduplicación y recuperación segura ante fallos transitorios.',
            content:
              'Todo consumidor debe registrar el identificador único del mensaje procesado o usar operaciones conmutativas para que los reintentos automáticos nunca corrompan el estado.',
          },
        ],
      },
      {
        id: 'mod-sys-3',
        title: '03. Circuit Breakers y Multi-Región Activo-Activo',
        durationMinutes: 50,
        quizQuestion: '¿Cuándo pasa un Circuit Breaker al estado Half-Open?',
        quizOptions: [
          'Tras vencer el temporizador de enfriamiento para probar recuperación',
          'Inmediatamente después de la primera petición exitosa',
          'Cuando el servidor alcanza 100% de uso de disco',
        ],
        quizCorrectIndex: 0,
        lessons: [
          {
            id: 'les-sys-3a',
            title: 'Aislamiento de fallos con Bulkheads y Timeouts adaptativos',
            durationMinutes: 25,
            summary: 'Cómo evitar fallos en cascada en arquitecturas de microservicios.',
            content:
              'Limitar los pools de conexiones por dependencia crítica impide que un servicio degradado consuma todos los hilos del sistema principal.',
          },
          {
            id: 'les-sys-3b',
            title: 'Enrutamiento geográfico y resolución de conflictos CRDT',
            durationMinutes: 25,
            summary: 'Sincronización multi-dispositivo y multi-región sin bloqueos.',
            content:
              'Los tipos de datos replicados libres de conflictos (CRDT) permiten que múltiples usuarios o dispositivos editen concurrentemente convergiendo al mismo estado matemático.',
          },
        ],
      },
    ],
  },
  {
    id: 'data-science-applied-02',
    title: 'Ciencia de Datos Aplicada y Analítica Predictiva',
    subtitle: 'Modelado estadístico, pipelines reproducibles, métricas de negocio y despliegue seguro.',
    description:
      'Construye modelos predictivos auditables desde la exploración inicial de datos hasta su integración mediante APIs en tiempo real, con rigor estadístico y visualización clara.',
    category: 'Datos',
    level: 'intermediate',
    priceCents: 11900,
    currency: 'USD',
    coverImage: '/src/assets/images/course_data_science_1795146987818.jpg',
    instructorId: 'platform-faculty',
    instructorName: 'Dr. Mateo Navarro',
    published: true,
    modulesCount: 2,
    totalLessons: 4,
    modules: [
      {
        id: 'mod-ds-1',
        title: '01. Ingeniería de Características y Validación Cruzada',
        durationMinutes: 45,
        quizQuestion: '¿Qué problema previene la separación estricta antes de escalar variables?',
        quizOptions: [
          'Fuga de datos (Data Leakage) del conjunto de prueba al entrenamiento',
          'Exceso de memoria RAM en la tarjeta gráfica',
          'Duplicación de columnas en archivos CSV',
        ],
        quizCorrectIndex: 0,
        lessons: [
          {
            id: 'les-ds-1a',
            title: 'Prevención de Data Leakage en pipelines temporales',
            durationMinutes: 20,
            summary: 'Validación temporal por ventanas deslizantes para series reales.',
            content:
              'Nunca mezcles observaciones futuras dentro de folds de entrenamiento en problemas temporales. Toda transformación de media o varianza debe ajustarse exclusivamente sobre el conjunto de entrenamiento.',
          },
          {
            id: 'les-ds-1b',
            title: 'Selección de métricas según costo de error',
            durationMinutes: 25,
            summary: 'Cuándo priorizar PR-AUC, F1 calibrado o pérdida asimétrica.',
            content:
              'En conjuntos desbalanceados como detección de fraude o deserción estudiantil, la exactitud (accuracy) es engañosa; la curva Precisión-Recall revela el rendimiento real.',
          },
        ],
      },
      {
        id: 'mod-ds-2',
        title: '02. Calibración, Explicabilidad y Monitoreo de Deriva',
        durationMinutes: 50,
        quizQuestion: '¿Qué indica un incremento sostenido en el Population Stability Index (PSI)?',
        quizOptions: [
          'Desviación en la distribución de datos de entrada (Data Drift)',
          'Mejora automática de la precisión del modelo',
          'Reducción del costo de almacenamiento en la nube',
        ],
        quizCorrectIndex: 0,
        lessons: [
          {
            id: 'les-ds-2a',
            title: 'Valores SHAP para decisiones transparentes',
            durationMinutes: 25,
            summary: 'Atribución local y global de características en modelos de ensamble.',
            content:
              'SHAP descompone cada predicción individual en contribuciones aditivas exactas basadas en teoría de juegos, permitiendo auditar sesgos.',
          },
          {
            id: 'les-ds-2b',
            title: 'Alertas tempranas de Concept Drift en producción',
            durationMinutes: 25,
            summary: 'Umbrales estadísticos y reentrenamiento automatizado.',
            content:
              'Comparar la distribución de producción frente al baseline de entrenamiento permite detectar cambios de comportamiento antes de que impacten los KPIs.',
          },
        ],
      },
    ],
  },
  {
    id: 'ux-design-systems-03',
    title: 'Ingeniería de Sistemas de Diseño y UX Multiplataforma',
    subtitle: 'Tokens semánticos, accesibilidad WCAG AA, tipografía de precisión y modo oscuro nativo.',
    description:
      'Diseña e implementa sistemas de interfaz escalables que funcionan con fluidez en móvil y escritorio, priorizando legibilidad, contraste y consistencia visual.',
    category: 'Diseño',
    level: 'beginner',
    priceCents: 8900,
    currency: 'USD',
    coverImage: '/src/assets/images/course_ux_engineering_1795146988343.jpg',
    instructorId: 'platform-faculty',
    instructorName: 'Camila Mendoza',
    published: true,
    modulesCount: 2,
    totalLessons: 4,
    modules: [
      {
        id: 'mod-ux-1',
        title: '01. Jerarquía Tipográfica y Tokens Dual-Theme',
        durationMinutes: 40,
        quizQuestion: '¿Cuál es el contraste mínimo WCAG AA para texto de cuerpo estándar?',
        quizOptions: ['4.5:1 respecto al fondo', '1.8:1 respecto al fondo', '12:1 obligatorio'],
        quizCorrectIndex: 0,
        lessons: [
          {
            id: 'les-ux-1a',
            title: 'Arquitectura de color 60-30-10 y compensación en modo oscuro',
            durationMinutes: 20,
            summary: 'Evita contrastes agresivos o texto ilegible en superficies oscuras.',
            content:
              'En modo oscuro, las superficies elevadas deben incrementar sutilmente su luminosidad sin saturar el lienzo, y el texto claro requiere ajuste de peso y espaciado.',
          },
          {
            id: 'les-ux-1b',
            title: 'Ritmo espacial y diseño responsivo táctil',
            durationMinutes: 20,
            summary: 'Objetivos táctiles >= 44px y jerarquía móvil sin pérdida de función.',
            content:
              'Un sistema responsivo real adapta la densidad y el flujo de navegación a la ergonomía del pulgar en móvil sin recortar capacidades críticas.',
          },
        ],
      },
      {
        id: 'mod-ux-2',
        title: '02. Internacionalización (i18n) y Estados Completos',
        durationMinutes: 45,
        quizQuestion: '¿Qué regla asegura alineación vertical en tablas financieras?',
        quizOptions: [
          'Usar numerales tabulares (tabular-nums)',
          'Centrar todos los párrafos de texto',
          'Usar sombras múltiples en cada celda',
        ],
        quizCorrectIndex: 0,
        lessons: [
          {
            id: 'les-ux-2a',
            title: 'Diseño resistente a expansión de texto multilingüe',
            durationMinutes: 22,
            summary: 'Evita desbordamientos entre español, inglés, francés y portugués.',
            content:
              'Las traducciones al español o francés suelen ser un 20-35% más extensas que el inglés. Usar truncamiento controlado y contenedores flexibles previene roturas.',
          },
          {
            id: 'les-ux-2b',
            title: 'Estados vacíos, carga y retroalimentación inmediata',
            durationMinutes: 23,
            summary: 'Cada vista de datos debe guiar la siguiente acción útil.',
            content:
              'Un buen estado vacío explica qué aparecerá y ofrece una acción directa, reduciendo la fricción del usuario en su primera sesión.',
          },
        ],
      },
    ],
  },
  {
    id: 'cybersecurity-e2ee-04',
    title: 'Criptografía Aplicada y Seguridad Zero-Trust E2EE',
    subtitle: 'Web Crypto API, AES-GCM-256, intercambio de claves y protección de datos en la nube.',
    description:
      'Implementa cifrado de extremo a extremo real en aplicaciones web modernas, protegiendo documentos sensibles antes de salir del dispositivo del usuario.',
    category: 'Seguridad',
    level: 'advanced',
    priceCents: 13500,
    currency: 'USD',
    coverImage: '/src/assets/images/course_cybersecurity_e2ee_1795146988090.jpg',
    instructorId: 'platform-faculty',
    instructorName: 'Ing. RodrigoSalazar',
    published: true,
    modulesCount: 2,
    totalLessons: 4,
    modules: [
      {
        id: 'mod-sec-1',
        title: '01. Cifrado Autenticado con AES-GCM y Derivación PBKDF2',
        durationMinutes: 50,
        quizQuestion: '¿Por qué es crítico generar un vector de inicialización (IV) único por cada cifrado AES-GCM?',
        quizOptions: [
          'Reutilizar un IV con la misma clave compromete la confidencialidad y autenticación',
          'Para hacer que el texto cifrado sea más corto',
          'Para permitir que el servidor lea el contenido sin clave',
        ],
        quizCorrectIndex: 0,
        lessons: [
          {
            id: 'les-sec-1a',
            title: 'Uso seguro de window.crypto.subtle en navegadores',
            durationMinutes: 25,
            summary: 'Generación de claves simétricas de 256 bits y vectores de 96 bits.',
            content:
              'AES-GCM combina cifrado de flujo con autenticación integrada (AEAD), detectando cualquier manipulación del texto cifrado durante el tránsito o almacenamiento.',
          },
          {
            id: 'les-sec-1b',
            title: 'Derivación robusta desde frase de recuperación',
            durationMinutes: 25,
            summary: 'PBKDF2 con al menos 120,000 iteraciones y verificación por huella SHA-256.',
            content:
              'Al derivar claves localmente, el usuario mantiene soberanía total: la plataforma almacena únicamente el sobre cifrado y su IV.',
          },
        ],
      },
      {
        id: 'mod-sec-2',
        title: '02. Reglas Zero-Trust y Auditoría de APIs',
        durationMinutes: 45,
        quizQuestion: '¿Cuál es la función del encabezado HMAC-SHA256 en un Webhook?',
        quizOptions: [
          'Verificar autenticidad e integridad del emisor antes de procesar el evento',
          'Comprimir el archivo JSON enviado',
          'Evitar el uso de certificados HTTPS',
        ],
        quizCorrectIndex: 0,
        lessons: [
          {
            id: 'les-sec-2a',
            title: 'Aislamiento de PII y validación estricta de esquemas',
            durationMinutes: 20,
            summary: 'Principio de mínimo privilegio en bases de datos en tiempo real.',
            content:
              'Separar perfiles públicos de documentos privados con datos personales evita filtraciones accidentales en consultas de listado.',
          },
          {
            id: 'les-sec-2b',
            title: 'Firma HMAC para webhooks e integraciones externas',
            durationMinutes: 25,
            summary: 'Protege tus endpoints de terceros frente a peticiones suplantadas.',
            content:
              'Firmar el cuerpo exacto de la petición permite al receptor validar criptográficamente el origen y evitar ataques de repetición.',
          },
        ],
      },
    ],
  },
];
