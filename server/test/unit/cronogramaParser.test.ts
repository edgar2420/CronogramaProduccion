import { describe, expect, it } from "vitest";
import { parsearCronograma, parseNumero, parseFechaDDMMAA } from "../../src/infrastructure/import/cronogramaParser.js";

/**
 * Fixtures copiadas literalmente de las planillas reales de Drive (recortadas).
 * Los dos layouts difieren de verdad: sueros trabaja en litros y sin columna de
 * "tamaño de lote"; PPV/Vidrio trabaja en mL y sí la trae.
 */

const SUEROS_BFS_PGV_321 = String.raw`
| \[merged\] Día | \[merged\] Fecha | \[merged\] O.P. | \[merged\] Nº LOTE | \[merged\] PRODUCTO | \[merged\] VOLUMEN UNITARIO \[L\] | \[merged\] Volumen total                \[L\] | \[merged\] Correlativo de Fabricación | \[merged\] Correlativo de Producción | \[merged\] Fecha de vencimiento |  | \[merged\] Observaciones | \[merged\] Nº |  |  | PRODUCTO | LOTE | FECHA DE INICIO | FECHA FINAL | CANTIDAD CUMPLIDA (UNIDADES) | OBSERVACIONES |  |
| \[merged\] LUNES | \[merged\] 05/01/26 | 1003 | 1090008 | Solución Estéril ABD - Flex | 1 | 5000 | 1 | 1 | 01/28 |  |  | 1 |  |  | Solución Estéril ABD - Flex | 1090008 | 05/01/26 | 05/01/26 | 4848 | N.A |  |
| \[merged\] MARTES | \[merged\] 06/01/26 | 1005 | 1020266 | Solución Fisiológica 0,9% - Flex | 1 | 5000 | 3 | 1 | 01/31 |  | Se cancela lote 1020279,1020280 y 1020281 en fecha 23/01/26 por problemas en la maquina bottelpack | 3 |  |  | Solución Fisiológica 0,9% - Flex | 1020266 | 06/01/26 | 07/01/26 | 4890 | Atraso por temperatura |  |
`;

const PPV_VIDRIO = String.raw`
| Dia  | Fecha | O.P. | Nº de Lote | Producto | Volumen del envase \[mL\] | Cantidad de Bandejas  | Volumen total          \[mL\] | Tamaño del          lote \[unidades\] | Correlativo de fabricación | Correlativo de producto | Fecha de vencimiento | Observaciones | Nº |  | PRODUCTO | LOTE | FECHA DE INICIO | FECHA FINAL | CANTIDAD CUMPLIDA (UNIDADES) | OBSERVACIONES |  |  |  |
| \[merged\] JUEVES | \[merged\] 08/01/26 | 2137 | 2030056 | Bicarbonato de sodio 8% | 20 | 12 | 56288 | 2736 | 1 | 1 | 01/31 |  | 1 |  | Bicarbonato de sodio 8% | 2030056 | 08/01/26 | 08/01/26 | 2486 | Entrega tardía de envasadora |  |  |  |
| LUNES  | 26/01/26 | 2155 | 2210006 | Morfium ABD | 1 | 19 | 24.140 | 19.950 | 19 | 1 | 01/28 | 1 prep de 19b  | 19 |  | Morfium ABD | 2210006 | 26/01/26 | 26/01/26 | 22035 | N.A |  |  |  |
`;

// PGV-PVC mezcla unidades en la misma fila: el envase en mL y el total en L.
const PGV_PVC = String.raw`
| \[merged\] Día | \[merged\] Fecha | \[merged\] O.P. | \[merged\] Nº LOTE | \[merged\] Producto | \[merged\] VOLUMEN UNITARIO \[ML\] | \[merged\] Volumen total          \[L\] | \[merged\] Correlativo de Fabricación | \[merged\] Correlativo de Producción | \[merged\] N° | \[merged\] Fecha de vencimiento | \[merged\] TIPO DE PEDIDO | \[merged\] TIPO DE PEDIDO | \[merged\] LEYENDA DE ETIQUETA | \[merged\] OBSERVACIONES |
| SABADO | 29/08/26 | 4196 | 3130001 | Dipa ABD 4,25% con dextrosa | 2.000 | 3.000 | 1 | 1 | 1 | 08/28 |  | X | CNS |  |
`;

// BFS-PPV-312 trae las unidades del lote explícitas en "Volumen total unidades".
const BFS_PPV_312 = String.raw`
| \[merged\] Dia  | Fecha | O.P. | Nº de Lote | Producto | Volumen del envase \[mL\] | Volumen total unidades  | Volumen total \[L\] | Correlativo de fabricación | Correlativo de producto | Fecha de Vencimiento | Observaciones | Nº |  | PRODUCTO | LOTE | FECHA DE INICIO | FECHA FINAL | CANTIDAD CUMPLIDA (UNIDADES) | OBSERVACIONES |  |  |  |
| LUNES | 19/01/26 | 493 | 4010084 | Agua para inyección ABD | 5 | 52000 | 276 | 1 | 1 | 01/29 |  | 1 |  | Agua para inyección ABD | 4010084 | 19/01/26 | 20/01/26 | 51236 | Retraso por prueba de integridad. |  |  |  |
`;

// División Plástico: corridas de máquina, sin día ni volúmenes.
const DIVISION_PLASTICOS = String.raw`
| CORRELATIVO MES | CORRELATIVO DE PRODUCCION MENSUAL SEGÚN MAQUINA | CORRELATIVO DE PRODUCCION ANUAL | LOTE | OP | CORRELATIVO DE PRODUCTO | MAQUINA PROGRAMADA | FECHA DE INICIO | FECHA FINAL | CANTIDAD PROGRAMADA | CANTIDAD CUMPLIDA | OBSERVACIONES |  |
| 1 | 1 | 1 | 7050071 | 942 | 1 | INYECTORAS FB 160R - FB 230R | 05/01/26 | 17/01/26 | 640000 | 755000 | N.A |  |
| 4 | 1 | 16 | 7070012 | 957 | 1 | Inyectora SOUND SE - 160 - F3 | 09/02/26 | 13/02/26 | 32500 |  | Se cancela lote 7010099 en fecha 10/02/26 |  |
`;

describe("parseNumero (formato boliviano)", () => {
  it("interpreta el punto como separador de miles", () => {
    expect(parseNumero("56.288")).toBe(56288);
    expect(parseNumero("24.140")).toBe(24140);
  });
  it("interpreta la coma como decimal", () => {
    expect(parseNumero("29,03")).toBeCloseTo(29.03);
    expect(parseNumero("0,15")).toBeCloseTo(0.15);
  });
  it("devuelve null para celdas vacías o sin dígitos", () => {
    expect(parseNumero("")).toBeNull();
    expect(parseNumero("N.A")).toBeNull();
  });
});

describe("parseFechaDDMMAA", () => {
  it("parsea dd/mm/aa a UTC", () => {
    const f = parseFechaDDMMAA("05/01/26")!;
    expect(f.toISOString().slice(0, 10)).toBe("2026-01-05");
  });
  it("rechaza valores que no son fecha", () => {
    expect(parseFechaDDMMAA("LUNES")).toBeNull();
    expect(parseFechaDDMMAA("45/13/26")).toBeNull();
  });
});

describe("parsearCronograma — layout de sueros (litros, sin tamaño de lote)", () => {
  const { programado, cumplido, cancelados } = parsearCronograma(SUEROS_BFS_PGV_321);

  it("extrae los lotes programados con su O.P. y correlativos", () => {
    expect(programado).toHaveLength(2);
    const [primero] = programado;
    expect(primero!.numeroLote).toBe("1090008");
    expect(primero!.opCode).toBe("1003");
    expect(primero!.correlativoFabricacion).toBe(1);
    expect(primero!.fechaVencimiento).toBe("01/28");
    expect(primero!.fecha.toISOString().slice(0, 10)).toBe("2026-01-05");
  });

  it("deriva las unidades planificadas de volumen total / volumen unitario", () => {
    // 5000 L totales en envases de 1 L = 5000 unidades
    expect(programado[0]!.planificado).toBe(5000);
    expect(programado[0]!.volumenUnitarioL).toBe(1);
    expect(programado[0]!.volumenTotalL).toBe(5000);
  });

  it("cruza el bloque CUMPLIDO por número de lote", () => {
    expect(cumplido).toHaveLength(2);
    const c = cumplido.find((x) => x.numeroLote === "1020266")!;
    expect(c.cantidad).toBe(4890);
    expect(c.fechaFin!.toISOString().slice(0, 10)).toBe("2026-01-07");
    expect(c.observaciones).toBe("Atraso por temperatura");
  });

  it("detecta los lotes cancelados escritos en texto libre", () => {
    expect([...cancelados.keys()].sort()).toEqual(["1020279", "1020280", "1020281"]);
    expect(cancelados.get("1020280")).toContain("bottelpack");
  });
});

describe("parsearCronograma — layout PPV/Vidrio (mL, con tamaño de lote)", () => {
  const { programado } = parsearCronograma(PPV_VIDRIO);

  it("usa el 'Tamaño del lote' explícito como unidades planificadas", () => {
    const bicarbonato = programado.find((p) => p.numeroLote === "2030056")!;
    expect(bicarbonato.planificado).toBe(2736);
  });

  it("convierte los volúmenes de mL a litros", () => {
    const bicarbonato = programado.find((p) => p.numeroLote === "2030056")!;
    expect(bicarbonato.volumenUnitarioL).toBeCloseTo(0.02); // 20 mL
    expect(bicarbonato.volumenTotalL).toBeCloseTo(56.288); // 56288 mL
  });

  it("maneja el separador de miles en volumen y tamaño de lote", () => {
    const morfium = programado.find((p) => p.numeroLote === "2210006")!;
    expect(morfium.planificado).toBe(19950);
    expect(morfium.volumenTotalL).toBeCloseTo(24.14);
  });
});

describe("parsearCronograma — layout PGV-PVC (envase en mL, total en L)", () => {
  const { programado } = parsearCronograma(PGV_PVC);

  it("convierte cada columna con su propia unidad", () => {
    const [dipa] = programado;
    expect(dipa!.volumenUnitarioL).toBeCloseTo(2); // 2.000 mL
    expect(dipa!.volumenTotalL).toBeCloseTo(3000); // 3.000 L
  });

  it("deriva las unidades con ambos volúmenes ya en litros", () => {
    expect(programado[0]!.planificado).toBe(1500);
  });
});

describe("parsearCronograma — layout BFS-PPV-312", () => {
  const { programado, cumplido } = parsearCronograma(BFS_PPV_312);

  it("usa 'Volumen total unidades' como cantidad planificada", () => {
    expect(programado[0]!.planificado).toBe(52000);
  });

  it("no confunde esa columna con el volumen total en litros", () => {
    expect(programado[0]!.volumenTotalL).toBeCloseTo(276);
    expect(programado[0]!.volumenUnitarioL).toBeCloseTo(0.005);
  });

  it("cruza el bloque cumplido de la derecha", () => {
    expect(cumplido[0]!.cantidad).toBe(51236);
  });
});

describe("parsearCronograma — layout División Plástico (corridas de máquina)", () => {
  const { programado, cumplido, cancelados } = parsearCronograma(DIVISION_PLASTICOS);

  it("toma la máquina programada como producto y la fecha de inicio como fecha", () => {
    const corrida = programado.find((p) => p.numeroLote === "7050071")!;
    expect(corrida.productoNombre).toBe("INYECTORAS FB 160R - FB 230R");
    expect(corrida.fecha.toISOString().slice(0, 10)).toBe("2026-01-05");
    expect(corrida.planificado).toBe(640000);
    expect(corrida.volumenUnitarioL).toBeNull();
  });

  it("lee el cumplido de la misma fila", () => {
    const c = cumplido.find((x) => x.numeroLote === "7050071")!;
    expect(c.cantidad).toBe(755000);
    expect(c.fechaFin!.toISOString().slice(0, 10)).toBe("2026-01-17");
  });

  it("deja sin cumplido las corridas sin cantidad y detecta la cancelación", () => {
    expect(cumplido.find((x) => x.numeroLote === "7070012")).toBeUndefined();
    expect(cancelados.get("7010099")).toContain("Se cancela lote");
  });
});
