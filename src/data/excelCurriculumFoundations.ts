import type { ExcelLessonCurriculum } from './excelCurriculumTypes';
import { checkNumericFormula, checkTextFormula } from './excelCurriculumTypes';

export const EXCEL_CURRICULUM_FOUNDATIONS: Record<string, ExcelLessonCurriculum> = {
  // =========================================================================
  // MÓDULO 1: LA PANTALLA DE EXCEL
  // =========================================================================
  'les-excel-1-1': {
    lessonId: 'les-excel-1-1',
    introduction:
      'Excel es una cuadrícula gigante donde guardas datos y haces cálculos; al abrirlo verás siempre las mismas piezas: Libro (el archivo completo .xlsx), Hoja (cada pestaña abajo a la izquierda), Celda (donde cruzan columna y fila, ej. B3), Columnas (con letras) y Filas (con números), Cuadro de nombres (muestra qué celda tienes seleccionada), Barra de fórmulas (muestra y te deja editar el contenido real) y Cinta de opciones (las pestañas de arriba con todos los comandos).',
    keyTakeaways: [
      'Libro: El archivo completo de Excel (.xlsx).',
      'Hoja: Cada pestaña dentro del libro, abajo a la izquierda. Un libro nuevo empieza con una.',
      'Celda: El cuadro donde cruzan una columna y una fila. Se nombra por su ubicación, por ejemplo B3.',
      'Columnas y filas: Las columnas se nombran con letras (A, B, C…) y las filas con números (1, 2, 3…).',
      'Cuadro de nombres: A la izquierda de la barra de fórmulas: muestra qué celda tienes seleccionada.',
      'Barra de fórmulas: Muestra y te deja editar el contenido real de la celda activa.',
      'Cinta de opciones: Las pestañas de arriba (Inicio, Insertar, Fórmulas, Datos, Vista…) con todos los comandos.',
    ],
    functions: [
      {
        name: 'Coordenada de Celda (Columna + Fila)',
        syntax: 'Columna + Fila = Celda (ej. B3)',
        summary: 'Ubicación unívoca de cada dato dentro de la hoja de cálculo de Excel.',
        arguments: [
          { name: 'Columna', required: true, description: 'Letra que define la división vertical (A, B, C...).' },
          { name: 'Fila', required: true, description: 'Número que define la división horizontal (1, 2, 3...).' },
        ],
        pitfall: 'Escribir el número antes de la letra (ej. 3B en vez de B3) provoca un error de referencia.',
      },
    ],
    examples: [
      {
        id: 'ex-pantalla-1',
        title: 'Lectura de celda mediante fórmula directa',
        functionTag: 'PANTALLA',
        scenario: 'Lee el valor de la celda B3 en la celda A5 escribiendo =B3.',
        formula: '=B3',
        expectedResult: 'Ventas',
        targetCell: 'A5',
        sheet: {
          A1: 'Módulo 1', B1: 'Excel',
          A2: 'Archivo', B2: 'Libro1.xlsx',
          A3: 'Pestaña', B3: 'Ventas',
          A5: '',
        },
      },
    ],
    exercises: [
      {
        id: 'ej-pantalla-1',
        number: 1,
        functionTag: 'CELDA',
        title: 'Identificar la celda B3',
        prompt: 'En la celda A5 escribe =B3 para reflejar el nombre de la hoja "Ventas" en tu reporte.',
        hint: 'Escribe el signo igual seguido de la columna B y la fila 3: =B3',
        targetCell: 'A5',
        solutionFormula: '=B3',
        initialSheet: {
          A1: 'Módulo 1', B1: 'Excel',
          A2: 'Archivo', B2: 'Libro1.xlsx',
          A3: 'Pestaña', B3: 'Ventas',
          A5: '',
        },
        validate: (f, v) =>
          checkTextFormula(
            f,
            v,
            'Ventas',
            /^=B3$/i,
            '¡Excelente! =B3 extrae exactamente el contenido de la celda B3.',
            'Escribe =B3 en la celda A5.'
          ),
      },
    ],
  },

  'les-excel-1-2': {
    lessonId: 'les-excel-1-2',
    introduction:
      'Aprende a moverte con fluidez en la cuadrícula de Excel: haz clic en una celda para seleccionarla, usa las flechas del teclado o Tab (para moverte a la derecha) y Enter (para moverte hacia abajo). Arrastra con el ratón para seleccionar un rango continuo (por ejemplo A1:C5) y haz clic en la letra de columna o número de fila para seleccionarla completa.',
    keyTakeaways: [
      'Haz clic en cualquier celda para seleccionarla y activarla.',
      'Teclas de navegación: Flechas del cursor, Tab (desplazamiento a la derecha) y Enter (desplazamiento hacia abajo).',
      'Selección de rangos: Haz clic en la primera celda y arrastra con el ratón (ej. A1:C5).',
      'Selección completa: Un clic sobre el encabezado de columna o fila selecciona toda la línea.',
    ],
    functions: [
      {
        name: 'Operador de Rango (:)',
        syntax: 'CeldaInicial:CeldaFinal (ej. A1:C5)',
        summary: 'Los dos puntos definen un bloque continuo de celdas desde una esquina hasta la opuesta.',
        arguments: [
          { name: 'CeldaInicial', required: true, description: 'Esquina superior izquierda del rango.' },
          { name: 'CeldaFinal', required: true, description: 'Esquina inferior derecha del rango.' },
        ],
        pitfall: 'Olvidar los dos puntos o usar punto y coma une celdas individuales en vez de un bloque continuo.',
      },
    ],
    examples: [
      {
        id: 'ex-mov-1',
        title: 'Referenciar una celda dentro de un rango',
        functionTag: 'RANGO',
        scenario: 'Extrae el contenido de la celda B2 escribiendo =B2 en la celda D2.',
        formula: '=B2',
        expectedResult: '1500',
        targetCell: 'D2',
        sheet: {
          A1: 'Código', B1: 'Monto', C1: 'Zona', D1: '',
          A2: 'C-01', B2: 1500, C2: 'Norte', D2: '',
        },
      },
    ],
    exercises: [
      {
        id: 'ej-mov-1',
        number: 1,
        functionTag: 'RANGO',
        title: 'Navegar y leer el monto en B2',
        prompt: 'En la celda D2 escribe =B2 para extraer el monto de la celda seleccionada.',
        hint: 'Escribe =B2 en la celda D2.',
        targetCell: 'D2',
        solutionFormula: '=B2',
        initialSheet: {
          A1: 'Código', B1: 'Monto', C1: 'Zona', D1: '',
          A2: 'C-01', B2: 1500, C2: 'Norte', D2: '',
        },
        validate: (f, v) =>
          checkNumericFormula(
            f,
            v,
            1500,
            /^=B2$/i,
            '¡Correcto! =B2 extrae el valor 1500 de la celda B2.',
            'Escribe =B2 en la celda D2.'
          ),
      },
    ],
  },

  'les-excel-1-3': {
    lessonId: 'les-excel-1-3',
    introduction:
      'Ejercicio 1 guiado: 1) Abre un libro en blanco. 2) Escribe tu nombre en la celda A1 y presiona Enter. 3) Selecciona el rango A1:D4 arrastrando el ratón y observa cómo lo indica el Cuadro de nombres. 4) Haz doble clic en el nombre de la pestaña, cámbialo por «Práctica» y presiona Enter. 5) Pulsa el signo + junto a la pestaña para añadir una segunda hoja.',
    keyTakeaways: [
      'Paso 1: Abrir un libro nuevo en blanco en Excel.',
      'Paso 2: Escribir texto en A1 y confirmar con Enter.',
      'Paso 3: Seleccionar el rango rectangular A1:D4 arrastrando el cursor.',
      'Paso 4: Renombrar la hoja activa a «Práctica».',
      'Paso 5: Añadir hojas adicionales haciendo clic en el botón +.',
    ],
    functions: [
      {
        name: 'Ejercicio 1: Cuadrícula y Hojas',
        syntax: 'Rango A1:D4 en Hoja Práctica',
        summary: 'Comprueba el dominio de la navegación, selección y organización básica del libro de Excel.',
        arguments: [
          { name: 'Celda A1', required: true, description: 'Celda inicial del rango.' },
          { name: 'Celda D4', required: true, description: 'Celda final del rango.' },
        ],
        pitfall: 'Presionar Esc al escribir en una celda cancela la entrada en lugar de confirmarla.',
      },
    ],
    examples: [
      {
        id: 'ex-ej1-1',
        title: 'Confirmar el dato en la celda A1',
        functionTag: 'EJERCICIO 1',
        scenario: 'Obtén el nombre ingresado en A1 escribiendo =A1 en C6.',
        formula: '=A1',
        expectedResult: 'David',
        targetCell: 'C6',
        sheet: {
          A1: 'David', B1: 'Alumno', C1: 'Curso', D1: 'Excel',
          A2: '10', B2: '20', C2: '30', D2: '40',
          A3: '50', B3: '60', C3: '70', D3: '80',
          A4: '90', B4: '100', C4: '110', D4: '120',
          C6: '',
        },
      },
    ],
    exercises: [
      {
        id: 'ej-ej1-1',
        number: 1,
        functionTag: 'EJERCICIO 1',
        title: 'Verificar la celda A1',
        prompt: 'En la celda C6 escribe =A1 para confirmar que tu celda A1 contiene el nombre del alumno ("David").',
        hint: 'Escribe =A1 en la celda C6.',
        targetCell: 'C6',
        solutionFormula: '=A1',
        initialSheet: {
          A1: 'David', B1: 'Alumno', C1: 'Curso', D1: 'Excel',
          A2: '10', B2: '20', C2: '30', D2: '40',
          A3: '50', B3: '60', C3: '70', D3: '80',
          A4: '90', B4: '100', C4: '110', D4: '120',
          C6: '',
        },
        validate: (f, v) =>
          checkTextFormula(
            f,
            v,
            'David',
            /^=A1$/i,
            '¡Excelente! Has completado la verificación del Ejercicio 1 con la celda A1.',
            'Escribe =A1 en la celda C6.'
          ),
      },
      {
        id: 'ej-ej1-2',
        number: 2,
        functionTag: 'EJERCICIO 1',
        title: 'Verificar el límite del rango D4',
        prompt: 'En la celda C7 escribe =D4 para extraer el valor de la esquina inferior del rango A1:D4 (120).',
        hint: 'Escribe =D4 en la celda C7.',
        targetCell: 'C7',
        solutionFormula: '=D4',
        initialSheet: {
          A1: 'David', B1: 'Alumno', C1: 'Curso', D1: 'Excel',
          A2: '10', B2: '20', C2: '30', D2: '40',
          A3: '50', B3: '60', C3: '70', D3: '80',
          A4: '90', B4: '100', C4: '110', D4: 120,
          C7: '',
        },
        validate: (f, v) =>
          checkNumericFormula(
            f,
            v,
            120,
            /^=D4$/i,
            '¡Muy bien! D4 representa la esquina final del rango A1:D4.',
            'Escribe =D4 en la celda C7.'
          ),
      },
    ],
  },

  // =========================================================================
  // MÓDULO 2: DATOS Y FORMATO
  // =========================================================================
  'les-excel-2-1': {
    lessonId: 'les-excel-2-1',
    introduction:
      'Una celda puede contener texto, números o fechas, y Excel los trata distinto: el texto se alinea a la izquierda y los números a la derecha. Escribe y presiona Enter para confirmar o Esc para cancelar. Presiona F2 (o doble clic) para editar lo ya escrito, y Supr para borrar. Arrastra el cuadrito de la esquina inferior derecha (controlador de relleno) para repetir o continuar series: escribe Lunes y arrastra, y Excel completa Martes, Miércoles...',
    keyTakeaways: [
      'Alineación por tipo: El texto se alinea a la izquierda; números y fechas a la derecha.',
      'Confirmar y cancelar: Enter guarda el valor en la celda; Esc descarta la edición.',
      'Editar y borrar: F2 (o doble clic) permite modificar el texto; Supr (Delete) vacía la celda.',
      'Controlador de relleno: Arrastrar el cuadro verde inferior derecho continúa series lógicas (días, meses, números).',
    ],
    functions: [
      {
        name: 'Controlador de Relleno y Series',
        syntax: 'Arrastre desde la esquina inferior derecha',
        summary: 'Genera series automáticas y copia patrones de datos sin tener que escribirlos celda por celda.',
        arguments: [
          { name: 'Celda Base', required: true, description: 'Celda que contiene el primer elemento de la serie (ej. Lunes).' },
        ],
        pitfall: 'Si arrastras con Ctrl presionado, el comportamiento alterna entre copiar idéntico o incrementar.',
      },
    ],
    examples: [
      {
        id: 'ex-datos-1',
        title: 'Verificar alineación de datos',
        functionTag: 'DATOS',
        scenario: 'Comprueba el valor de la celda de precio B2 escribiendo =B2 en D2.',
        formula: '=B2',
        expectedResult: '65',
        targetCell: 'D2',
        sheet: {
          A1: 'Producto', B1: 'Precio', C1: 'Cantidad',
          A2: 'Arroz', B2: 65, C2: 10,
          D2: '',
        },
      },
    ],
    exercises: [
      {
        id: 'ej-datos-1',
        number: 1,
        functionTag: 'DATOS',
        title: 'Comprobar el número en B2',
        prompt: 'En la celda D2 escribe =B2 para leer el precio del Arroz (65).',
        hint: 'Escribe =B2 en la celda D2.',
        targetCell: 'D2',
        solutionFormula: '=B2',
        initialSheet: {
          A1: 'Producto', B1: 'Precio', C1: 'Cantidad',
          A2: 'Arroz', B2: 65, C2: 10,
          D2: '',
        },
        validate: (f, v) =>
          checkNumericFormula(
            f,
            v,
            65,
            /^=B2$/i,
            '¡Correcto! El número 65 está alineado a la derecha como dato numérico válido.',
            'Escribe =B2 en la celda D2.'
          ),
      },
    ],
  },

  'les-excel-2-2': {
    lessonId: 'les-excel-2-2',
    introduction:
      'Formato desde la pestaña Inicio: Negrita, cursiva, subrayado (Grupo Fuente), Cambiar tamaño o color (Grupo Fuente), Color de fondo y bordes (cubeta y cuadrícula), Centrar o alinear (Grupo Alineación), Combinar y centrar (Grupo Alineación), Mostrar $, % o decimales (Grupo Número) y Ajustar ancho de columna (doble clic en el borde derecho de la letra). Formatos más usados: General, Número, Moneda, Porcentaje, Fecha corta. El formato cambia cómo se ve el valor, no el valor guardado: 0.15 se ve como 15%.',
    keyTakeaways: [
      'Grupo Fuente: Negrita (Ctrl+N), cursiva, subrayado, tamaño de letra, paleta de colores y bordes.',
      'Grupo Alineación: Alineación horizontal, vertical, Ajustar texto y Combinar y centrar.',
      'Grupo Número: Formato Moneda ($), Porcentaje (%), millares con comas y aumento/disminución de decimales.',
      'Regla de oro: El formato cambia la apariencia visual, pero el valor numérico interno se mantiene intacto (ej. 0.15 = 15%).',
      'Autoajuste de columnas: Haz doble clic en la línea divisoria entre columnas para ajustar al ancho del contenido más largo.',
    ],
    functions: [
      {
        name: 'Formato de Porcentaje',
        syntax: '0.15 → 15%',
        summary: 'Multiplica visualmente por 100 y añade el símbolo de porcentaje sin alterar los cálculos internos.',
        arguments: [
          { name: 'Valor Decimal', required: true, description: 'Número fraccionario entre 0 y 1 (ej. 0.18).' },
        ],
        pitfall: 'Escribir 18 y luego aplicar formato de porcentaje dará 1800% en lugar de 18%.',
      },
    ],
    examples: [
      {
        id: 'ex-form-1',
        title: 'Verificar la tasa de ITBIS como decimal',
        functionTag: 'FORMATO',
        scenario: 'Comprueba el valor decimal guardado en la celda de tasa E1 escribiendo =E1 en D3.',
        formula: '=E1',
        expectedResult: '0.18',
        targetCell: 'D3',
        sheet: {
          E1: 0.18,
          D3: '',
        },
      },
    ],
    exercises: [
      {
        id: 'ej-form-1',
        number: 1,
        functionTag: 'FORMATO',
        title: 'Verificar la celda formateada E1',
        prompt: 'En la celda D3 escribe =E1 para comprobar que 18% equivale numéricamente a 0.18.',
        hint: 'Escribe =E1 en la celda D3.',
        targetCell: 'D3',
        solutionFormula: '=E1',
        initialSheet: {
          E1: 0.18,
          D3: '',
        },
        validate: (f, v) =>
          checkNumericFormula(
            f,
            v,
            0.18,
            /^=E1$/i,
            '¡Excelente! En Excel el 18% se almacena internamente como el número decimal 0.18.',
            'Escribe =E1 en la celda D3.'
          ),
      },
    ],
  },

  'les-excel-2-3': {
    lessonId: 'les-excel-2-3',
    introduction:
      'Ejercicio 2: Lista de productos. 1) En la hoja «Práctica», escribe en la fila 1: Producto, Precio, Cantidad. 2) Debajo escribe cinco productos con su precio y cantidad (ejemplo: Arroz, 65, 10; Habichuelas, 75, 8; Aceite, 120, 5; Leche, 60, 12; Azúcar, 45, 15). 3) Pon los encabezados en negrita, con fondo de color y texto centrado. 4) Aplica formato Moneda a la columna Precio. 5) Ajusta el ancho de las columnas haciendo doble clic en el borde de cada letra.',
    keyTakeaways: [
      'Paso 1: Crear encabezados claros en la fila 1 (Producto, Precio, Cantidad).',
      'Paso 2: Registrar 5 filas de productos con sus respectivos valores numéricos.',
      'Paso 3: Aplicar estilos visuales (Negrita, color de relleno y alineación centrada).',
      'Paso 4: Formatear la columna Precio con formato Moneda ($ o RD$).',
      'Paso 5: Optimizar el ancho de las tres columnas con doble clic en la cabecera.',
    ],
    functions: [
      {
        name: 'Ejercicio 2: Lista de Productos',
        syntax: 'Estructuración y formato de tabla de ventas',
        summary: 'Aplica todas las herramientas de la pestaña Inicio para construir una tabla legible y profesional.',
        arguments: [
          { name: 'Encabezados', required: true, description: 'Fila 1 con títulos de campo.' },
          { name: 'Datos', required: true, description: '5 filas con datos alineados por tipo.' },
        ],
        pitfall: 'Incluir letras o símbolos manuales en la celda (ej. "$65 pesos") convierte el número en texto y anula los cálculos.',
      },
    ],
    examples: [
      {
        id: 'ex-ej2-1',
        title: 'Verificar el precio del tercer producto (Aceite)',
        functionTag: 'PRODUCTOS',
        scenario: 'Lee el precio del Aceite ubicado en la celda B4 escribiendo =B4 en D7.',
        formula: '=B4',
        expectedResult: '120',
        targetCell: 'D7',
        sheet: {
          A1: 'Producto', B1: 'Precio', C1: 'Cantidad',
          A2: 'Arroz', B2: 65, C2: 10,
          A3: 'Habichuelas', B3: 75, C3: 8,
          A4: 'Aceite', B4: 120, C4: 5,
          A5: 'Leche', B5: 60, C5: 12,
          A6: 'Azúcar', B6: 45, C6: 15,
          D7: '',
        },
      },
    ],
    exercises: [
      {
        id: 'ej-ej2-1',
        number: 1,
        functionTag: 'PRODUCTOS',
        title: 'Comprobar el precio del Aceite (B4)',
        prompt: 'En la celda D7 escribe =B4 para extraer el precio del producto Aceite (120).',
        hint: 'Escribe =B4 en la celda D7.',
        targetCell: 'D7',
        solutionFormula: '=B4',
        initialSheet: {
          A1: 'Producto', B1: 'Precio', C1: 'Cantidad',
          A2: 'Arroz', B2: 65, C2: 10,
          A3: 'Habichuelas', B3: 75, C3: 8,
          A4: 'Aceite', B4: 120, C4: 5,
          A5: 'Leche', B5: 60, C5: 12,
          A6: 'Azúcar', B6: 45, C6: 15,
          D7: '',
        },
        validate: (f, v) =>
          checkNumericFormula(
            f,
            v,
            120,
            /^=B4$/i,
            '¡Correcto! La celda B4 almacena 120 formateado con símbolo de moneda.',
            'Escribe =B4 en la celda D7.'
          ),
      },
      {
        id: 'ej-ej2-2',
        number: 2,
        functionTag: 'PRODUCTOS',
        title: 'Comprobar la cantidad de Azúcar (C6)',
        prompt: 'En la celda D8 escribe =C6 para leer la cantidad en stock del producto Azúcar (15).',
        hint: 'Escribe =C6 en la celda D8.',
        targetCell: 'D8',
        solutionFormula: '=C6',
        initialSheet: {
          A1: 'Producto', B1: 'Precio', C1: 'Cantidad',
          A2: 'Arroz', B2: 65, C2: 10,
          A3: 'Habichuelas', B3: 75, C3: 8,
          A4: 'Aceite', B4: 120, C4: 5,
          A5: 'Leche', B5: 60, C5: 12,
          A6: 'Azúcar', B6: 45, C6: 15,
          D8: '',
        },
        validate: (f, v) =>
          checkNumericFormula(
            f,
            v,
            15,
            /^=C6$/i,
            '¡Muy bien! C6 contiene la cantidad 15.',
            'Escribe =C6 en la celda D8.'
          ),
      },
    ],
  },

  // =========================================================================
  // MÓDULO 3: FÓRMULAS Y REFERENCIAS
  // =========================================================================
  'les-excel-3-1': {
    lessonId: 'les-excel-3-1',
    introduction:
      'Una fórmula siempre empieza con el signo igual (=) y le pide a Excel que calcule algo usando los valores de otras celdas. Operadores básicos: Suma (+), Resta (-), Multiplicación (*), División (/), Potencia (^). Excel respeta el orden matemático: primero paréntesis, luego potencias, después multiplicación y división, y al final suma y resta: =(A1+A2)*3. ¿Por qué usar referencias y no números fijos? Si escribes =B2*C2 en lugar de =65*10, el resultado se actualiza solo cuando cambias el precio o la cantidad.',
    keyTakeaways: [
      'El signo igual (=): Todo cálculo debe iniciar con = para que Excel evalúe la expresión.',
      'Operadores aritméticos: + (Suma), - (Resta), * (Multiplicación), / (División) y ^ (Potencia).',
      'Jerarquía matemática: 1) Paréntesis (), 2) Potencias (^), 3) Multiplicación/División (*, /), 4) Suma/Resta (+, -).',
      'Referencias dinámicas: Usar =B2*C2 en vez de =65*10 garantiza que los totales se sincronicen en tiempo real.',
    ],
    functions: [
      {
        name: 'Operador de Multiplicación (*)',
        syntax: '=Celda1 * Celda2 (ej. =B2*C2)',
        summary: 'Multiplica los valores numéricos contenidos en dos celdas para calcular subtotales o importes.',
        arguments: [
          { name: 'Factor 1', required: true, description: 'Celda del precio unitario (ej. B2).' },
          { name: 'Factor 2', required: true, description: 'Celda de la cantidad (ej. C2).' },
        ],
        pitfall: 'Usar la letra x en lugar del asterisco * causará un error de sintaxis en la fórmula.',
      },
    ],
    examples: [
      {
        id: 'ex-form-op-1',
        title: 'Calcular el subtotal con =B2*C2',
        functionTag: 'OPERADORES',
        scenario: 'Multiplica el precio (65) por la cantidad (10) en la celda D2 usando =B2*C2.',
        formula: '=B2*C2',
        expectedResult: '650',
        targetCell: 'D2',
        sheet: {
          A1: 'Producto', B1: 'Precio', C1: 'Cantidad', D1: 'Total',
          A2: 'Arroz', B2: 65, C2: 10, D2: '',
        },
      },
    ],
    exercises: [
      {
        id: 'ej-form-op-1',
        number: 1,
        functionTag: 'OPERADORES',
        title: 'Multiplicar precio y cantidad en D2',
        prompt: 'En la celda D2 escribe =B2*C2 para calcular el Total del primer producto (65 × 10 = 650).',
        hint: 'Escribe el signo igual, la celda B2, el asterisco * y la celda C2: =B2*C2',
        targetCell: 'D2',
        solutionFormula: '=B2*C2',
        initialSheet: {
          A1: 'Producto', B1: 'Precio', C1: 'Cantidad', D1: 'Total',
          A2: 'Arroz', B2: 65, C2: 10, D2: '',
        },
        validate: (f, v) =>
          checkNumericFormula(
            f,
            v,
            650,
            /^=B2\s*\*\s*C2$/i,
            '¡Excelente! =B2*C2 calcula dinámicamente 650.',
            'Escribe =B2*C2 en la celda D2.'
          ),
      },
    ],
  },

  'les-excel-3-2': {
    lessonId: 'les-excel-3-2',
    introduction:
      'Copiar fórmulas y tipos de referencia: Relativa (B2) se ajusta a la nueva posición al arrastrar hacia abajo (B2 pasa a B3). Absoluta ($B$2) no cambia nunca, bloqueando columna y fila con el signo $. Mixta ($B2 o B$2) fija solo la columna o solo la fila. Presiona F4 mientras editas una referencia para alternar entre estos tipos. Ejemplo típico: calcular el ITBIS del 18% guardando la tasa en la celda E1 y usando =D2*$E$1 para que la tasa no se mueva al copiar la fórmula.',
    keyTakeaways: [
      'Referencia Relativa (B2): Cambia automáticamente al copiar la fórmula en cualquier dirección.',
      'Referencia Absoluta ($B$2): Los dos signos $ fijan la fila y la columna; nunca cambia al arrastrar.',
      'Referencia Mixta ($B2 o B$2): Bloquea únicamente la columna ($B2) o únicamente la fila (B$2).',
      'Tecla F4: Atajo imprescindible para alternar cíclicamente: B2 → $B$2 → B$2 → $B2.',
      'Caso ITBIS 18%: Con la tasa guardada en E1, la fórmula =D2*$E$1 permite arrastrar hacia abajo manteniendo fija la celda $E$1.',
    ],
    functions: [
      {
        name: 'Referencia Absoluta ($E$1)',
        syntax: '=$Columna$Fila (ej. =$E$1)',
        summary: 'Congela la celda objetivo para que no varíe al arrastrar el controlador de relleno.',
        arguments: [
          { name: 'Celda fija', required: true, description: 'Celda de la tasa de impuesto o parámetro constante.' },
        ],
        pitfall: 'Si omites los signos $ (ej. =D2*E1), al arrastrar la fila 3 buscará la tasa en E2, que estará vacía (resultado 0).',
      },
    ],
    examples: [
      {
        id: 'ex-itbis-1',
        title: 'Calcular ITBIS con tasa absoluta =$E$1',
        functionTag: 'ITBIS',
        scenario: 'Calcula el ITBIS del 18% en la celda E2 con =D2*$E$1 sobre un Total de 650.',
        formula: '=D2*$E$1',
        expectedResult: '117',
        targetCell: 'E2',
        sheet: {
          A1: 'Producto', B1: 'Precio', C1: 'Cantidad', D1: 'Total', E1: 0.18, F1: 'ITBIS',
          A2: 'Arroz', B2: 65, C2: 10, D2: 650, E2: '',
        },
      },
    ],
    exercises: [
      {
        id: 'ej-itbis-1',
        number: 1,
        functionTag: 'ITBIS',
        title: 'Calcular ITBIS con celda fija $E$1',
        prompt: 'En la celda E2 escribe =D2*$E$1 para calcular el ITBIS de 650 al 18% (resultado: 117).',
        hint: 'Escribe =D2*$E$1 usando el signo dólar para fijar la celda de la tasa E1.',
        targetCell: 'E2',
        solutionFormula: '=D2*$E$1',
        initialSheet: {
          A1: 'Producto', B1: 'Precio', C1: 'Cantidad', D1: 'Total', E1: 0.18, F1: 'ITBIS',
          A2: 'Arroz', B2: 65, C2: 10, D2: 650, E2: '',
        },
        validate: (f, v) =>
          checkNumericFormula(
            f,
            v,
            117,
            /^=D2\s*\*\s*\$E\$1$/i,
            '¡Perfecto! =D2*$E$1 calcula 117 y protege la celda de tasa para que no se mueva al arrastrar.',
            'Escribe =D2*$E$1 en la celda E2.'
          ),
      },
    ],
  },

  'les-excel-3-3': {
    lessonId: 'les-excel-3-3',
    introduction:
      'Errores comunes en Excel y cómo resolverlos: #¡DIV/0! (dividiste entre cero o entre una celda vacía; corrige el divisor). #¿NOMBRE? (escribiste mal el nombre de una función o referencia inexistente). #¡VALOR! (intentaste operar matemáticamente con texto donde hacía falta un número). ##### (la columna es demasiado angosta para mostrar la cifra o fecha; ensánchala con doble clic).',
    keyTakeaways: [
      '#DIV/0!: Ocurre al dividir un valor entre 0 o celda en blanco.',
      '#¿NOMBRE?: Error tipográfico en el nombre de la función (ej. =SUM en lugar de =SUMA).',
      '#¡VALOR!: Conflicto de tipos de datos, como sumar "Manzanas" + 10.',
      '#####: No es un error de cálculo, sino un aviso de ancho insuficiente de columna.',
    ],
    functions: [
      {
        name: 'Diagnóstico de Errores',
        syntax: '#DIV/0! | #¿NOMBRE? | #¡VALOR! | #####',
        summary: 'Códigos visuales que Excel exhibe cuando una fórmula no puede resolverse correctamente.',
        arguments: [
          { name: 'Código de error', required: true, description: 'Indicador del tipo de anomalía detectada.' },
        ],
        pitfall: 'Asustarse con #####: solo debes ensanchar la columna arrastrando su borde derecho.',
      },
    ],
    examples: [
      {
        id: 'ex-err-1',
        title: 'Corregir una división segura',
        functionTag: 'ERRORES',
        scenario: 'Divide las ventas B2 entre la cantidad de vendedores C2 escribiendo =B2/C2.',
        formula: '=B2/C2',
        expectedResult: '500',
        targetCell: 'D2',
        sheet: {
          A1: 'Mes', B1: 'Ventas', C1: 'Vendedores', D1: 'Promedio',
          A2: 'Enero', B2: 2500, C2: 5, D2: '',
        },
      },
    ],
    exercises: [
      {
        id: 'ej-err-1',
        number: 1,
        functionTag: 'ERRORES',
        title: 'Evitar el error de división en D2',
        prompt: 'En la celda D2 escribe =B2/C2 para dividir 2500 entre 5 (resultado: 500).',
        hint: 'Escribe =B2/C2 en la celda D2.',
        targetCell: 'D2',
        solutionFormula: '=B2/C2',
        initialSheet: {
          A1: 'Mes', B1: 'Ventas', C1: 'Vendedores', D1: 'Promedio',
          A2: 'Enero', B2: 2500, C2: 5, D2: '',
        },
        validate: (f, v) =>
          checkNumericFormula(
            f,
            v,
            500,
            /^=B2\s*\/\s*C2$/i,
            '¡Excelente! La división se ejecutó sin errores (#DIV/0!).',
            'Escribe =B2/C2 en la celda D2.'
          ),
      },
    ],
  },

  'les-excel-3-4': {
    lessonId: 'les-excel-3-4',
    introduction:
      'Ejercicio 3 completo: 1) En tu lista de productos de la hoja «Práctica», agrega la columna D con el título Total. 2) En D2 escribe =B2*C2 y presiona Enter. 3) Arrastra el controlador de relleno hasta el último producto. 4) En E1 escribe 18% y, en la columna E, calcula el ITBIS de cada producto con =D2*$E$1. 5) Cambia un precio y comprueba que los totales se actualizan solos.',
    keyTakeaways: [
      'Paso 1: Añadir columna D (Total) en la tabla de productos.',
      'Paso 2: Calcular el subtotal del primer producto con la fórmula =B2*C2.',
      'Paso 3: Arrastrar la fórmula con el controlador de relleno para completar todos los productos.',
      'Paso 4: Fijar la tasa de ITBIS del 18% en E1 y calcular =D2*$E$1.',
      'Paso 5: Comprobar la naturaleza reactiva de Excel modificando un precio base.',
    ],
    functions: [
      {
        name: 'Ejercicio 3: Total e ITBIS Dinámico',
        syntax: 'Total = =B2*C2 | ITBIS = =D2*$E$1',
        summary: 'Combina fórmulas aritméticas dinámicas con referencias absolutas fijas en una tabla comercial real.',
        arguments: [
          { name: 'Total', required: true, description: 'Multiplicación de Precio por Cantidad.' },
          { name: 'ITBIS', required: true, description: 'Total multiplicado por la tasa absoluta $E$1.' },
        ],
        pitfall: 'Escribir la tasa fija como número quemado (=D2*0.18) en vez de usar la celda =$E$1 dificulta cambiar la tasa en el futuro.',
      },
    ],
    examples: [
      {
        id: 'ex-ej3-1',
        title: 'Calcular Total para Arroz en D2',
        functionTag: 'EJERCICIO 3',
        scenario: 'Calcula =B2*C2 en D2 (65 × 10 = 650).',
        formula: '=B2*C2',
        expectedResult: '650',
        targetCell: 'D2',
        sheet: {
          A1: 'Producto', B1: 'Precio', C1: 'Cantidad', D1: 'Total', E1: 0.18, F1: 'ITBIS',
          A2: 'Arroz', B2: 65, C2: 10, D2: '', E2: '',
          A3: 'Habichuelas', B3: 75, C3: 8, D3: 600, E3: '',
        },
      },
    ],
    exercises: [
      {
        id: 'ej-ej3-1',
        number: 1,
        functionTag: 'EJERCICIO 3',
        title: 'Paso 2: Calcular el Total en D2',
        prompt: 'En la celda D2 escribe =B2*C2 para calcular el Total del Arroz (65 × 10 = 650).',
        hint: 'Escribe =B2*C2 en la celda D2.',
        targetCell: 'D2',
        solutionFormula: '=B2*C2',
        initialSheet: {
          A1: 'Producto', B1: 'Precio', C1: 'Cantidad', D1: 'Total', E1: 0.18, F1: 'ITBIS',
          A2: 'Arroz', B2: 65, C2: 10, D2: '', E2: '',
          A3: 'Habichuelas', B3: 75, C3: 8, D3: '', E3: '',
        },
        validate: (f, v) =>
          checkNumericFormula(
            f,
            v,
            650,
            /^=B2\s*\*\s*C2$/i,
            '¡Excelente! El Total de Arroz en D2 es 650.',
            'Escribe =B2*C2 en la celda D2.'
          ),
      },
      {
        id: 'ej-ej3-2',
        number: 2,
        functionTag: 'EJERCICIO 3',
        title: 'Paso 4: Calcular el ITBIS en E2 con =$E$1',
        prompt: 'En la celda E2 escribe =D2*$E$1 para calcular el ITBIS de 650 al 18% (resultado: 117).',
        hint: 'Escribe =D2*$E$1 en la celda E2.',
        targetCell: 'E2',
        solutionFormula: '=D2*$E$1',
        initialSheet: {
          A1: 'Producto', B1: 'Precio', C1: 'Cantidad', D1: 'Total', E1: 0.18, F1: 'ITBIS',
          A2: 'Arroz', B2: 65, C2: 10, D2: 650, E2: '',
          A3: 'Habichuelas', B3: 75, C3: 8, D3: 600, E3: '',
        },
        validate: (f, v) =>
          checkNumericFormula(
            f,
            v,
            117,
            /^=D2\s*\*\s*\$E\$1$/i,
            '¡Perfecto! Has calculado el ITBIS con la referencia absoluta $E$1.',
            'Escribe =D2*$E$1 en la celda E2.'
          ),
      },
      {
        id: 'ej-ej3-3',
        number: 3,
        functionTag: 'EJERCICIO 3',
        title: 'Calcular ITBIS de Habichuelas en E3',
        prompt: 'En la celda E3 escribe =D3*$E$1 para calcular el ITBIS del segundo producto (600 × 18% = 108).',
        hint: 'Escribe =D3*$E$1 en la celda E3.',
        targetCell: 'E3',
        solutionFormula: '=D3*$E$1',
        initialSheet: {
          A1: 'Producto', B1: 'Precio', C1: 'Cantidad', D1: 'Total', E1: 0.18, F1: 'ITBIS',
          A2: 'Arroz', B2: 65, C2: 10, D2: 650, E2: 117,
          A3: 'Habichuelas', B3: 75, C3: 8, D3: 600, E3: '',
        },
        validate: (f, v) =>
          checkNumericFormula(
            f,
            v,
            108,
            /^=D3\s*\*\s*\$E\$1$/i,
            '¡Magnífico! Al arrastrar o usar $E$1, la fila relativa avanzó a D3 mientras la tasa se mantuvo fija en E1.',
            'Escribe =D3*$E$1 en la celda E3.'
          ),
      },
    ],
  },
};
