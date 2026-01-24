export type StaffRol = "Operador" | "Supervisor" | "Tecnólogo";

/** Niveles de capacitación */
export type SkillLevel = "ok" | "reforzar" | "capacitar";

/** Claves de skill sugeridas (ajústalas a tu realidad) */
export type SkillKey =
  | "op_ppv_vidrio"
  | "aux_ppv_vidrio"
  | "central_pesada"
  | "op_bidones"
  | "aux_bidones"
  | "op_pgv_rigido"
  | "aux_pgv_rigido"
  | "op_pgv_pvc"
  | "aux_pgv_pvc"
  | "op_autoclave"
  | "aux_autoclave"
  | "op_bfs_pgv"
  | "prep_bfs_pgv"
  | "gen_vapor"
  | "integrity_test"
  | "aux_bfs_pgv"
  | "op_bfs_ppv"
  | "op_inyeccion"
  | "op_soplado"
  | "aux_soplado"
  | "op_peletizadora"
  | "aux_inyectora"
  | "aux_peletizado"
  | "equipos_suero"
  | "esterilizacion";

/** Staff con mapa de skills por tarea */
export interface Staff {
  id: string;
  nombre: string;
  rolBase: StaffRol;
  /** etiquetas libres para pertenencia/área base (ej: ["PGV","Autoclave"]) */
  areas: string[];
  activo: boolean;

  /** Capacitación por tarea/skill (opcional: si no hay dato, no se muestra nivel) */
  skills?: Partial<Record<SkillKey, SkillLevel>>;
}
