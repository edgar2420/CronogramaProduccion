/**
 * Parser del "CRONOGRAMA DE FABRICACIÓN" real de la planta (planillas de
 * Drive exportadas como tabla markdown). Ver AUDITORIA-DATOS.md.
 *
 * Cada área usa un layout ligeramente distinto (PPV/Vidrio agrega "Cantidad de
 * Bandejas" y "Tamaño del lote", los sueros trabajan en litros y PPV en mL),
 * así que las columnas se resuelven por ENCABEZADO y no por posición fija.
 * Una misma planilla repite el encabezado en cada bloque semanal.
 */

export interface FilaProgramada {
  fecha: Date;
  opCode: string | null;
  numeroLote: string;
  productoNombre: string;
  volumenUnitarioL: number | null;
  volumenTotalL: number | null;
  /** Unidades planificadas del lote. */
  planificado: number | null;
  correlativoFabricacion: number | null;
  correlativoProduccion: number | null;
  fechaVencimiento: string | null;
  observaciones: string | null;
}

export interface FilaCumplida {
  numeroLote: string;
  fechaInicio: Date | null;
  fechaFin: Date | null;
  cantidad: number | null;
  observaciones: string | null;
}

export interface ResultadoParseo {
  programado: FilaProgramada[];
  cumplido: FilaCumplida[];
  /** Nº de lote cancelado -> motivo, extraído de las observaciones en texto libre. */
  cancelados: Map<string, string>;
}

interface MapaColumnas {
  fecha: number;
  opCode: number;
  numeroLote: number;
  producto: number;
  volumenUnitario: number;
  volumenTotal: number;
  tamanoLote: number;
  /** Algunas planillas traen las unidades del lote como "Volumen total unidades". */
  volumenTotalUnidades: number;
  correlativoFabricacion: number;
  correlativoProduccion: number;
  fechaVencimiento: number;
  observaciones: number;
  /** El bloque CUMPLIDO vive a la derecha, en la misma fila. */
  cumplidoLote: number;
  cumplidoInicio: number;
  cumplidoFin: number;
  cumplidoCantidad: number;
  cumplidoObservaciones: number;
  /** Cada columna declara su unidad por separado: PGV-PVC trae el envase en mL
   *  y el total en L en la misma fila. */
  volumenUnitarioEnMl: boolean;
  volumenTotalEnMl: boolean;
}

/**
 * División Plástico no fabrica lotes de solución sino corridas de máquina: su
 * planilla no tiene día, producto ni volúmenes. El "producto" es la máquina
 * programada y lo programado y lo cumplido viven en la misma fila.
 */
interface MapaColumnasPlasticos {
  lote: number;
  op: number;
  correlativoAnual: number;
  correlativoProducto: number;
  maquina: number;
  fechaInicio: number;
  fechaFin: number;
  cantidadProgramada: number;
  cantidadCumplida: number;
  observaciones: number;
}

export function limpiarCelda(celda: string): string {
  return celda
    .trim()
    .replace(/^\\\[merged\\\]\s*/, "")
    .replace(/\\/g, "")
    .trim();
}

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Las planillas usan dd/mm/aa. */
export function parseFechaDDMMAA(valor: string): Date | null {
  const m = valor.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (!m) return null;
  const [, d, mes, a] = m;
  const anio = a!.length === 2 ? 2000 + Number(a) : Number(a);
  const dia = Number(d);
  const mesN = Number(mes);
  if (mesN < 1 || mesN > 12 || dia < 1 || dia > 31) return null;
  const fecha = new Date(Date.UTC(anio, mesN - 1, dia));
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

/**
 * Formato boliviano: "." separador de miles, "," decimal.
 * "56.288" -> 56288 · "29,03" -> 29.03 · "0,15" -> 0.15
 */
export function parseNumero(valor: string): number | null {
  const v = valor.trim();
  if (!v || !/\d/.test(v)) return null;
  let normalizado = v.replace(/\s/g, "");
  if (normalizado.includes(",")) {
    normalizado = normalizado.replace(/\./g, "").replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(normalizado)) {
    normalizado = normalizado.replace(/\./g, "");
  }
  const n = Number(normalizado);
  return Number.isFinite(n) ? n : null;
}

function celdasDeLinea(linea: string): string[] {
  return linea.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map(limpiarCelda);
}

/** Detecta la fila de encabezado de un bloque y arma el mapa de columnas. */
function detectarColumnas(celdas: string[]): MapaColumnas | null {
  const norm = celdas.map(normalizar);
  const tieneDia = norm.some((c) => c === "dia");
  const tieneLote = norm.some((c) => c.includes("lote") && c.startsWith("n"));
  if (!tieneDia || !tieneLote) return null;

  const buscar = (predicado: (c: string) => boolean, desde = 0): number =>
    norm.findIndex((c, i) => i >= desde && predicado(c));

  const numeroLote = buscar((c) => c.includes("lote") && c.startsWith("n"));
  const producto = buscar((c) => c === "producto");
  const observaciones = buscar((c) => c === "observaciones");
  const cumplidoLote = buscar((c) => c === "lote", numeroLote + 1);
  const cumplidoObservaciones = buscar((c) => c === "observaciones", observaciones + 1);
  const volumenUnitario = buscar((c) => c.includes("volumen") && (c.includes("unitario") || c.includes("envase")));
  // "Volumen total unidades" son piezas, no litros: se excluye del volumen y
  // sirve como cantidad planificada.
  const volumenTotal = buscar((c) => c.includes("volumen total") && !c.includes("unidades"));
  const enMl = (i: number): boolean => (i >= 0 ? norm[i]!.includes("ml") : false);

  return {
    fecha: buscar((c) => c === "fecha"),
    opCode: buscar((c) => c === "o.p." || c === "op" || c === "o p"),
    numeroLote,
    producto,
    volumenUnitario,
    volumenTotal,
    tamanoLote: buscar((c) => c.includes("tamano del") && c.includes("lote")),
    volumenTotalUnidades: buscar((c) => c.includes("volumen total") && c.includes("unidades")),
    correlativoFabricacion: buscar((c) => c.includes("correlativo") && c.includes("fabricacion")),
    correlativoProduccion: buscar((c) => c.includes("correlativo") && (c.includes("produccion") || c.includes("producto"))),
    fechaVencimiento: buscar((c) => c.includes("vencimiento")),
    observaciones,
    cumplidoLote,
    cumplidoInicio: buscar((c) => c.includes("fecha de inicio")),
    cumplidoFin: buscar((c) => c.includes("fecha final")),
    cumplidoCantidad: buscar((c) => c.includes("cantidad cumplida")),
    cumplidoObservaciones,
    volumenUnitarioEnMl: enMl(volumenUnitario),
    volumenTotalEnMl: enMl(volumenTotal),
  };
}

/** Detecta el encabezado de la planilla de División Plástico. */
function detectarColumnasPlasticos(celdas: string[]): MapaColumnasPlasticos | null {
  const norm = celdas.map(normalizar);
  const buscar = (predicado: (c: string) => boolean): number => norm.findIndex(predicado);

  const lote = buscar((c) => c === "lote");
  const maquina = buscar((c) => c.includes("maquina programada"));
  if (lote < 0 || maquina < 0) return null;

  return {
    lote,
    op: buscar((c) => c === "op"),
    correlativoAnual: buscar((c) => c.includes("correlativo") && c.includes("anual")),
    correlativoProducto: buscar((c) => c.includes("correlativo de producto")),
    maquina,
    fechaInicio: buscar((c) => c.includes("fecha de inicio")),
    fechaFin: buscar((c) => c.includes("fecha final")),
    cantidadProgramada: buscar((c) => c.includes("cantidad programada")),
    cantidadCumplida: buscar((c) => c.includes("cantidad cumplida")),
    observaciones: buscar((c) => c === "observaciones"),
  };
}

const col = (celdas: string[], i: number): string => (i >= 0 ? celdas[i] ?? "" : "");

/** "Se cancela lote 2030060,2030061 en fecha 09/01/26 por X" -> {lote: motivo} */
function extraerCancelaciones(texto: string, destino: Map<string, string>): void {
  if (!/se cancela/i.test(texto)) return;
  for (const lotes of texto.matchAll(/lotes?\s+((?:\d{4,}[\s,y]*)+)/gi)) {
    for (const lote of (lotes[1] ?? "").match(/\d{4,}/g) ?? []) {
      destino.set(lote, texto.trim());
    }
  }
}

interface Acumulador {
  programado: FilaProgramada[];
  cumplido: FilaCumplida[];
  cancelados: Map<string, string>;
  vistosProgramado: Set<string>;
  vistosCumplido: Set<string>;
}

/**
 * Una fila de División Plástico trae programado y cumplido juntos; se parte en
 * las mismas dos estructuras que el resto de las áreas para que el importador
 * no tenga que distinguir el origen.
 */
function leerFilaPlasticos(celdas: string[], columnas: MapaColumnasPlasticos, acc: Acumulador): void {
  const numeroLote = col(celdas, columnas.lote).trim();
  const maquina = col(celdas, columnas.maquina).trim();
  const fecha = parseFechaDDMMAA(col(celdas, columnas.fechaInicio));
  const observaciones = col(celdas, columnas.observaciones).trim();
  if (observaciones) extraerCancelaciones(observaciones, acc.cancelados);

  if (!fecha || !/^\d{4,}$/.test(numeroLote) || !maquina || acc.vistosProgramado.has(numeroLote)) return;
  acc.vistosProgramado.add(numeroLote);

  acc.programado.push({
    fecha,
    opCode: col(celdas, columnas.op).trim() || null,
    numeroLote,
    productoNombre: maquina,
    // La planilla mide piezas moldeadas, no volumen de solución.
    volumenUnitarioL: null,
    volumenTotalL: null,
    planificado: parseNumero(col(celdas, columnas.cantidadProgramada)),
    correlativoFabricacion: parseNumero(col(celdas, columnas.correlativoAnual)),
    correlativoProduccion: parseNumero(col(celdas, columnas.correlativoProducto)),
    fechaVencimiento: null,
    observaciones: observaciones || null,
  });

  const cantidad = parseNumero(col(celdas, columnas.cantidadCumplida));
  if (cantidad !== null && !acc.vistosCumplido.has(numeroLote)) {
    acc.vistosCumplido.add(numeroLote);
    acc.cumplido.push({
      numeroLote,
      fechaInicio: fecha,
      fechaFin: parseFechaDDMMAA(col(celdas, columnas.fechaFin)),
      cantidad,
      observaciones: observaciones || null,
    });
  }
}

export function parsearCronograma(contenido: string): ResultadoParseo {
  const programado: FilaProgramada[] = [];
  const cumplido: FilaCumplida[] = [];
  const cancelados = new Map<string, string>();
  const vistosProgramado = new Set<string>();
  const vistosCumplido = new Set<string>();

  let columnas: MapaColumnas | null = null;
  let columnasPlasticos: MapaColumnasPlasticos | null = null;

  for (const linea of contenido.split("\n")) {
    if (!linea.trim().startsWith("|")) continue;
    const celdas = celdasDeLinea(linea);
    if (celdas.length < 8) continue;

    const posibleEncabezado = detectarColumnas(celdas);
    if (posibleEncabezado) {
      columnas = posibleEncabezado;
      columnasPlasticos = null;
      continue;
    }
    const posibleEncabezadoPlasticos = detectarColumnasPlasticos(celdas);
    if (posibleEncabezadoPlasticos) {
      columnasPlasticos = posibleEncabezadoPlasticos;
      columnas = null;
      continue;
    }

    if (columnasPlasticos) {
      leerFilaPlasticos(celdas, columnasPlasticos, {
        programado,
        cumplido,
        cancelados,
        vistosProgramado,
        vistosCumplido,
      });
      continue;
    }
    if (!columnas) continue;

    // ── Bloque programado ────────────────────────────────────────────────
    const fecha = parseFechaDDMMAA(col(celdas, columnas.fecha));
    const numeroLote = col(celdas, columnas.numeroLote).trim();
    const productoNombre = col(celdas, columnas.producto).trim();
    const observaciones = col(celdas, columnas.observaciones).trim();
    if (observaciones) extraerCancelaciones(observaciones, cancelados);

    if (fecha && /^\d{4,}$/.test(numeroLote) && productoNombre && !vistosProgramado.has(numeroLote)) {
      vistosProgramado.add(numeroLote);

      const aLitros = (valor: number | null, enMl: boolean): number | null =>
        valor === null ? null : enMl ? valor / 1000 : valor;
      const volumenUnitarioL = aLitros(
        parseNumero(col(celdas, columnas.volumenUnitario)),
        columnas.volumenUnitarioEnMl
      );
      const volumenTotalL = aLitros(parseNumero(col(celdas, columnas.volumenTotal)), columnas.volumenTotalEnMl);
      const tamanoLote = parseNumero(col(celdas, columnas.tamanoLote));
      const totalUnidades = parseNumero(col(celdas, columnas.volumenTotalUnidades));

      // Unidades planificadas: PPV/Vidrio las trae como "Tamaño del lote" y
      // BFS-PPV-312 como "Volumen total unidades"; en el resto se derivan del
      // volumen total sobre el unitario (ya normalizados a litros).
      const planificado =
        tamanoLote ??
        totalUnidades ??
        (volumenTotalL !== null && volumenUnitarioL ? Math.round(volumenTotalL / volumenUnitarioL) : null);

      programado.push({
        fecha,
        opCode: col(celdas, columnas.opCode).trim() || null,
        numeroLote,
        productoNombre,
        volumenUnitarioL,
        volumenTotalL,
        planificado,
        correlativoFabricacion: parseNumero(col(celdas, columnas.correlativoFabricacion)),
        correlativoProduccion: parseNumero(col(celdas, columnas.correlativoProduccion)),
        fechaVencimiento: col(celdas, columnas.fechaVencimiento).trim() || null,
        observaciones: observaciones || null,
      });
    }

    // ── Bloque CUMPLIDO ──────────────────────────────────────────────────
    const loteCumplido = col(celdas, columnas.cumplidoLote).trim();
    const fechaInicio = parseFechaDDMMAA(col(celdas, columnas.cumplidoInicio));
    if (/^\d{4,}$/.test(loteCumplido) && fechaInicio && !vistosCumplido.has(loteCumplido)) {
      vistosCumplido.add(loteCumplido);
      cumplido.push({
        numeroLote: loteCumplido,
        fechaInicio,
        fechaFin: parseFechaDDMMAA(col(celdas, columnas.cumplidoFin)),
        cantidad: parseNumero(col(celdas, columnas.cumplidoCantidad)),
        observaciones: col(celdas, columnas.cumplidoObservaciones).trim() || null,
      });
    }
  }

  return { programado, cumplido, cancelados };
}
