/**
 * Convierte las descargas de Google Sheets (JSON con el CSV en base64) al
 * formato de tabla que consume el parser de cronogramas.
 *
 *   node prisma/preparar-cronograma.mjs <carpeta-con-los-json>
 *
 * Mapea el título de la planilla ("1. BFS PGV 321 (2026)") al código de área
 * del sistema y escribe prisma/seed-data/cronograma/<AREA_CODE>.md
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DESTINO = path.join(__dirname, "seed-data", "cronograma");

// Título de la planilla en Drive -> código de área en el sistema.
const AREA_POR_TITULO = [
  [/BFS\s*PGV\s*321/i, "BFS_PGV_321"],
  [/BFS\s*PPV\s*312/i, "BFS_PPV_312"],
  [/BFS\s*305/i, "BFS_PGV_305"],
  [/HEMODIALISIS/i, "HEMODIALISIS"],
  [/PGV\s*-?\s*PVC/i, "PVC_PP"],
  [/DIVISION\s*PL[ÁA]STICO/i, "DIVISION_PLASTICOS"],
  // "2. PPV (2026)" es el área de ampollas de vidrio (PPV-VIDRIO en la planilla).
  [/^\d*\.?\s*PPV\b/i, "VIDRIO"],
];

function areaDeTitulo(titulo) {
  for (const [patron, codigo] of AREA_POR_TITULO) {
    if (patron.test(titulo)) return codigo;
  }
  return null;
}

/** CSV -> filas de celdas, respetando comillas y comas dentro de celdas. */
function parseCSV(texto) {
  const filas = [];
  let fila = [];
  let celda = "";
  let entreComillas = false;

  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (entreComillas) {
      if (c === '"') {
        if (texto[i + 1] === '"') {
          celda += '"';
          i++;
        } else {
          entreComillas = false;
        }
      } else {
        celda += c;
      }
      continue;
    }
    if (c === '"') entreComillas = true;
    else if (c === ",") {
      fila.push(celda);
      celda = "";
    } else if (c === "\n") {
      fila.push(celda);
      filas.push(fila);
      fila = [];
      celda = "";
    } else if (c !== "\r") {
      celda += c;
    }
  }
  if (celda || fila.length) {
    fila.push(celda);
    filas.push(fila);
  }
  return filas;
}

const origen = process.argv[2];
if (!origen) {
  console.error("Uso: node prisma/preparar-cronograma.mjs <carpeta-con-los-json-descargados>");
  process.exit(1);
}

mkdirSync(DESTINO, { recursive: true });

let generados = 0;
for (const archivo of readdirSync(origen).filter((f) => f.endsWith(".txt") || f.endsWith(".json"))) {
  let datos;
  try {
    datos = JSON.parse(readFileSync(path.join(origen, archivo), "utf-8"));
  } catch {
    continue;
  }
  if (!datos?.content || !datos?.title) continue;

  const areaCode = areaDeTitulo(datos.title);
  if (!areaCode) {
    console.warn(`· "${datos.title}" no corresponde a un área conocida, se omite`);
    continue;
  }

  const csv = Buffer.from(datos.content, "base64").toString("utf-8");
  // El parser lee tablas delimitadas por "|"; las celdas no pueden contenerlo.
  const tabla = parseCSV(csv)
    .map((fila) => `| ${fila.map((c) => c.replace(/\|/g, "/").trim()).join(" | ")} |`)
    .join("\n");

  writeFileSync(path.join(DESTINO, `${areaCode}.md`), tabla, "utf-8");
  console.log(`✔ ${datos.title} → ${areaCode}.md`);
  generados++;
}

console.log(`\n${generados} planillas preparadas en ${DESTINO}`);
