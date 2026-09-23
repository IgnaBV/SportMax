export type Id = string | number;
export interface Named {
  id: Id;
  nombre: string;
}
export interface Product extends Named {
  codigo: string;
  descripcion: string | null;
  categoria_id: Id | null;
  talla: string | null;
  color: string | null;
  stock_minimo: number;
  activo: boolean;
  created_at: string;
}
export interface Stock {
  id: Id;
  producto_id: Id;
  sucursal_id: Id;
  cantidad: number;
}
export type MovementType = "ENTRADA" | "SALIDA" | "AJUSTE";
export interface Movement {
  id: Id;
  producto_id: Id;
  sucursal_id: Id;
  tipo: MovementType;
  cantidad: number;
  cantidad_anterior: number;
  cantidad_nueva: number;
  motivo: string;
  responsable: string;
  created_at: string;
}
export interface AuditEvent {
  fecha: string;
  usuario_id: string | null;
  responsable: string;
  accion: string;
  anterior: Record<string, unknown> | null;
  nuevo: Record<string, unknown>;
}
export interface Audited {
  updated_at?: string | null;
  updated_by?: string | null;
  updated_by_label?: string | null;
  historial?: AuditEvent[];
}
export interface Employee extends Audited {
  id: Id;
  nombres: string;
  apellidos: string;
  identificacion: string;
  telefono: string;
  direccion: string;
  area: string;
  cargo: string;
  fecha_ingreso: string;
  salario: number;
  estado: string;
  created_at: string;
}
export interface Attendance extends Audited {
  id: Id;
  trabajador_id: Id;
  fecha: string;
  hora_entrada: string | null;
  hora_salida: string | null;
  estado: string;
  observacion: string;
}
export interface Schedule extends Audited {
  created_at?: string;
  id: Id;
  trabajador_id: Id;
  hora_entrada: string;
  hora_salida: string;
  activo: boolean;
}
export interface Request extends Audited {
  id: Id;
  trabajador_id: Id;
  tipo: "PERMISO" | "VACACIONES";
  fecha_inicio: string;
  fecha_fin: string;
  motivo: string;
  estado: string;
  observacion_respuesta: string | null;
  created_at: string;
}
export interface Document extends Audited {
  id: Id;
  trabajador_id: Id;
  nombre: string;
  tipo: string;
  archivo_url: string;
  created_at: string;
}
