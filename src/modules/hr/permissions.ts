import type { Role } from "@/context/auth";
// Un futuro rol de Gerencia deberá habilitarse solo en un servicio de resúmenes
// autorizado por RLS. No hereda acceso a fichas ni escrituras.
export const HR_ROLES: Role[] = ["ADMINISTRADOR", "RRHH"];
export const canReadHR = (role: Role | null) =>
  !!role && HR_ROLES.includes(role);
const HR_WRITE_ROLES: Role[] = ["ADMINISTRADOR", "RRHH"];
const HR_SUMMARY_ROLES: Role[] = ["ADMINISTRADOR", "RRHH"];
export const canEditHR = (role: Role | null) =>
  !!role && HR_WRITE_ROLES.includes(role);
export const canReadHRSummary = (role: Role | null) =>
  !!role && HR_SUMMARY_ROLES.includes(role);
