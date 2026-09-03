# Auditoría de datos reales (Drive de la planta) — Septiembre 2026

Revisión de todo lo accesible en el Drive compartido, comparado contra lo que
el sistema modela hoy. Sirve como registro de qué se importó, qué faltaba y
qué cambios de modelo se hicieron a raíz de esto.

## 1. Fuentes encontradas

| Fuente | Contenido | Estado |
|---|---|---|
| `catalogoProductos.ts` (código) | 142 productos por área | ✅ Importado (Fase 1) |
| `horario para Edgar` | Roster real: 112 personas con código de empleado | ✅ Importado (Fase 3) |
| `LEVANTAMIENTO DE LOTES PARA FM SEGÚN ÁREA` | 9 tanques + 111 capacidades producto‑tanque | ✅ Importado (Fase 3) |
| **Carpeta "registro de lotes 2026"** (7 planillas, 1 por área) | **CRONOGRAMA DE FABRICACIÓN real: O.P., Nº de lote, correlativos, vencimiento, cumplido** | ⚠️ **Hallazgo nuevo — motivó reprogramación del modelo** |
| Carpeta 2025 (mismas 7 planillas, año anterior) | Histórico | Disponible, no importado |
| `ENTREGA DE REGISTROS A DIRECCIÓN TECNICA` | Control de entrega documental | No aplica al modelo actual |
| `Mantenimiento preventivo ABD 2026` | Mantenimiento de equipos (otro dominio) | Fuera de alcance |
| `Programa de producción 2.0.xlsx` | Planificación anual agregada (la hace otra persona) | Fuera de alcance por decisión del usuario |

## 2. Hallazgo principal: el modelo de `Orden` no reflejaba el registro real

Las planillas "CRONOGRAMA DE FABRICACIÓN" (una por área, actualizadas
semanalmente) son el **registro de fabricación real** de la planta. Su
estructura por fila es:

**Programado:** Día · Fecha · **O.P.** · **Nº LOTE** · Producto · Volumen
unitario [L] · Volumen total [L] · **Correlativo de Fabricación** ·
**Correlativo de Producción** · **Fecha de vencimiento** · Observaciones

**Cumplido:** Producto · Lote · **Fecha de inicio** · **Fecha final** ·
**Cantidad cumplida (unidades)** · Observaciones

El modelo anterior de `Orden` solo tenía `planificado`, `real`,
`observaciones` y un `opCode` que nunca se usaba. Faltaban **todos los campos
que hacen trazable un lote farmacéutico**: número de lote, correlativos,
fecha de vencimiento y las fechas reales de inicio/fin de fabricación.

Para un sistema que apunta a 21 CFR Part 11 / ALCOA+, esto no es un detalle
cosmético: el número de lote y su fecha de vencimiento son la clave de
trazabilidad de todo el producto liberado al mercado.

### Además se detectó

- **Cancelación de lotes**: en la planilla se registra en texto libre
  ("Se cancela lote 1020279, 1020280 y 1020281 en fecha 23/01/26 por problemas
  en la máquina bottelpack"). No existía un estado `cancelada` con motivo.
- **Un lote puede abarcar varios días** (fecha inicio ≠ fecha final), algo que
  el modelo de una orden atada a un solo día no representaba.
- Los bloques de las planillas son **semanales** (lunes a viernes/sábado), lo
  que sí coincide con la entidad `Semana` ya existente.

## 3. Reprogramación aplicada

`Orden` se extendió con los campos del registro real (ver
`prisma/schema.prisma`):

| Campo | Origen en la planilla |
|---|---|
| `numeroLote` | Nº LOTE |
| `opCode` | O.P. (ya existía, ahora sí se usa) |
| `volumenUnitarioL` | VOLUMEN UNITARIO [L] |
| `volumenTotalL` | Volumen total [L] |
| `correlativoFabricacion` | Correlativo de Fabricación |
| `correlativoProduccion` | Correlativo de Producción |
| `fechaVencimiento` | Fecha de vencimiento |
| `fechaInicioReal` / `fechaFinReal` | CUMPLIDO · Fecha de inicio / Fecha final |
| `estado: cancelada` + `motivoCancelacion` | Cancelaciones que antes iban en texto libre |

Toda edición de estos campos queda en `audit_log`, igual que el resto.

## 4. Resultado de la importación (03/09/2026)

Las 7 planillas de Drive quedaron importadas en `Semana` + `Orden`
(`prisma/import-cronograma.ts`, idempotente por Nº de lote):

| Área | Órdenes | Con cumplido | Canceladas | Rango |
|---|---:|---:|---:|---|
| BFS_PGV_305 | 60 | 29 | 3 | 2026-02 → 2026-09 |
| BFS_PGV_321 | 68 | 62 | 0 | 2026-01 → 2026-09 |
| BFS_PPV_312 | 38 | 37 | 0 | 2026-01 → 2026-08 |
| DIVISION_PLASTICOS | 64 | 25 | 0 | 2026-01 → 2026-09 |
| HEMODIALISIS | 67 | 28 | 4 | 2026-01 → 2026-09 |
| PVC_PP | 3 | 0 | 0 | 2026-08 → 2026-09 |
| VIDRIO | 75 | 66 | 1 | 2026-01 → 2026-09 |
| **Total** | **375** | **247** | **8** | 177 semanas |

### Los cuatro layouts de planilla

Cada área arma su cronograma distinto, así que el parser resuelve las columnas
por **encabezado** y no por posición (`cronogramaParser.ts`):

| Layout | Unidades | Cantidad planificada |
|---|---|---|
| Sueros (BFS 305/321, Hemodiálisis) | litros | volumen total ÷ unitario |
| PPV/Vidrio | mL | columna "Tamaño del lote" |
| BFS-PPV-312 | envase en mL, total en L | columna "Volumen total unidades" |
| PGV-PVC | envase en mL, **total en L** en la misma fila | volumen total ÷ unitario |
| División Plástico | piezas, sin volumen | "Cantidad programada" |

División Plástico no fabrica lotes de solución sino corridas de máquina: no
tiene día, producto ni volúmenes. Su "producto" es la máquina programada y lo
programado y lo cumplido van en la misma fila.

## 5. Hallazgos que requieren decisión de la planta

Nada de esto se corrigió por cuenta propia: son datos de origen y la corrección
debe quedar trazada (GDocP).

### 5.1 Errores de tipeo en fechas

| Área | Lote | Fecha en la planilla | Probablemente |
|---|---|---|---|
| BFS_PGV_305 | 6210006 | 13/02/**2006** | 13/02/2026 |
| DIVISION_PLASTICOS | 7050080 | 18/05/**29** | 18/05/2026 (la fecha final es 29/05/26) |

### 5.2 Productos de la planilla que no están en el catálogo

Se importó todo lo demás; estas 12 filas quedaron fuera hasta resolver el
nombre. Varias parecen ser el mismo producto escrito distinto:

| Área | Nombre en la planilla | Nota |
|---|---|---|
| BFS_PGV_305 | Solución Ringer Lactato "Hartmann" - Foil Cap | |
| BFS_PGV_305 | Solución Glucosa Isotónica al 5% - Foil Cap | |
| BFS_PGV_305 | Solución Glucosa Hipertónica 10% - Foil Cap | |
| BFS_PGV_321 | Solución Ringer Lactato "Hartm**m**an" - Flex | error de tipeo |
| BFS_PGV_321 | Levofloxacina - Flex | |
| BFS_PGV_321 | Solución glucosa isotónica al 5% - Foil Cap | |
| BFS_PGV_321 | Solución Glucosa Clorurada Isotónica - Foil Cap | |
| BFS_PPV_312 | Lidocaín al 2% / Lidocaín al 2% ABD | el catálogo dice "Lidocaín 2% ABD" |
| DIVISION_PLASTICOS | Peletizadora Kingdom Machine | falta darla de alta |
| DIVISION_PLASTICOS | Inyectora LM ZSJ 138 | falta darla de alta |
| VIDRIO | Glucosa al 50% | |

### 5.3 Lotes cancelados y después re-emitidos

15 lotes aparecían en una nota de cancelación ("Se cancela lote X…") y más
tarde con cantidad cumplida. El importador da prioridad al cumplido: si el lote
llegó a producirse queda `terminada`, no `cancelada`.

### 5.4 Duplicados y codificación en el catálogo

`PVC_PP` tiene "Solución Ringer Normal" dos veces, una como
"Soluci�n Ringer Normal (corregido)" con la codificación rota. Igual pasa con
"Solución Fisiológica 0,9%" (4 filas) y "Agua para inyección ABD" en
BFS_PPV_312 (2 filas): hay que decidir cuál es la vigente y dar de baja lógica
las otras.
