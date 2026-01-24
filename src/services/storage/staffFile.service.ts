/**
 * Servicio para exportar/importar personal como archivo TXT
 * El archivo se guarda en la carpeta de Descargas del usuario
 */

import type { Staff } from "@/features/staff/types";
import { loadStaff, saveStaff } from "./staff.store";

/**
 * Descarga el personal actual como un archivo .txt
 * El archivo se guardará en la carpeta de Descargas del navegador
 */
export function downloadStaffAsTxt(): void {
    const staff = loadStaff();

    if (staff.length === 0) {
        alert("No hay personal registrado para guardar.");
        return;
    }

    // Generar contenido del archivo
    const fecha = new Date().toLocaleDateString("es-BO", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
    });

    let contenido = `========================================\n`;
    contenido += `LISTA DE PERSONAL - CRONOGRAMA PRODUCCIÓN\n`;
    contenido += `========================================\n`;
    contenido += `Fecha de exportación: ${fecha}\n`;
    contenido += `Total de personal: ${staff.length}\n`;
    contenido += `========================================\n\n`;

    staff.forEach((persona, index) => {
        contenido += `${index + 1}. ${persona.nombre}\n`;
        contenido += `   Rol: ${persona.rolBase}\n`;
        contenido += `   Áreas: ${persona.areas.join(", ") || "Sin asignar"}\n`;
        contenido += `   Estado: ${persona.activo ? "Activo" : "Inactivo"}\n`;
        contenido += `   ID: ${persona.id}\n`;
        contenido += `\n`;
    });

    contenido += `========================================\n`;
    contenido += `Fin del archivo\n`;
    contenido += `========================================\n`;

    // Crear y descargar archivo
    const blob = new Blob([contenido], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    const nombreArchivo = `personal_cronograma_${new Date().toISOString().slice(0, 10)}.txt`;
    link.href = url;
    link.download = nombreArchivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    alert(`✅ Archivo guardado como:\n\n📁 ${nombreArchivo}\n\n(Revisa tu carpeta de Descargas)`);
}

/**
 * Parsea un archivo TXT y extrae el personal
 * Retorna un array de Staff si el parsing es exitoso
 */
export function parseStaffFromTxt(contenido: string): Staff[] {
    const lineas = contenido.split("\n");
    const staff: Staff[] = [];
    let currentPerson: Partial<Staff> | null = null;

    for (const linea of lineas) {
        const trimmed = linea.trim();

        // Detectar inicio de nueva persona (número. Nombre)
        const matchNombre = trimmed.match(/^\d+\.\s+(.+)$/);
        if (matchNombre) {
            // Guardar persona anterior si existe
            if (currentPerson && currentPerson.nombre) {
                staff.push(currentPerson as Staff);
            }
            currentPerson = {
                id: `imported_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                nombre: matchNombre[1].trim(),
                rolBase: "Operador",
                areas: [],
                activo: true
            };
            continue;
        }

        if (!currentPerson) continue;

        // Parsear campos
        if (trimmed.startsWith("Rol:")) {
            const rol = trimmed.replace("Rol:", "").trim();
            if (rol === "Operador" || rol === "Supervisor" || rol === "Tecnólogo") {
                currentPerson.rolBase = rol;
            }
        } else if (trimmed.startsWith("Áreas:")) {
            const areasStr = trimmed.replace("Áreas:", "").trim();
            if (areasStr && areasStr !== "Sin asignar") {
                currentPerson.areas = areasStr.split(",").map(a => a.trim());
            }
        } else if (trimmed.startsWith("Estado:")) {
            currentPerson.activo = trimmed.includes("Activo");
        } else if (trimmed.startsWith("ID:")) {
            currentPerson.id = trimmed.replace("ID:", "").trim();
        }
    }

    // Agregar última persona
    if (currentPerson && currentPerson.nombre) {
        staff.push(currentPerson as Staff);
    }

    return staff;
}

/**
 * Importa personal desde un archivo TXT
 * Abre un diálogo para seleccionar archivo
 */
export function importStaffFromTxt(): Promise<{ imported: number; total: number }> {
    return new Promise((resolve, reject) => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".txt";

        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) {
                reject(new Error("No se seleccionó archivo"));
                return;
            }

            try {
                const contenido = await file.text();
                const nuevoPersonal = parseStaffFromTxt(contenido);

                if (nuevoPersonal.length === 0) {
                    reject(new Error("No se encontró personal válido en el archivo"));
                    return;
                }

                // Cargar personal existente y combinar
                const existente = loadStaff();
                const nombresExistentes = new Set(existente.map(s => s.nombre.toLowerCase()));

                // Solo agregar los que no existen
                let importados = 0;
                for (const persona of nuevoPersonal) {
                    if (!nombresExistentes.has(persona.nombre.toLowerCase())) {
                        existente.push(persona);
                        importados++;
                    }
                }

                saveStaff(existente);
                resolve({ imported: importados, total: nuevoPersonal.length });

            } catch (error) {
                reject(error);
            }
        };

        input.click();
    });
}

/**
 * Obtiene un resumen del personal guardado localmente
 */
export function getStaffSummary(): {
    total: number;
    activos: number;
    porRol: Record<string, number>;
    porArea: Record<string, number>;
} {
    const staff = loadStaff();

    const porRol: Record<string, number> = {};
    const porArea: Record<string, number> = {};

    for (const persona of staff) {
        // Contar por rol
        porRol[persona.rolBase] = (porRol[persona.rolBase] || 0) + 1;

        // Contar por área
        for (const area of persona.areas) {
            porArea[area] = (porArea[area] || 0) + 1;
        }
    }

    return {
        total: staff.length,
        activos: staff.filter(s => s.activo).length,
        porRol,
        porArea
    };
}
