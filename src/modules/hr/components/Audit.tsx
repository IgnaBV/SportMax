import type { Audited } from "@/types/entities";
import { timestamp } from "../services/presentation";
import { Table } from "@/components/common/UI";
export function AuditStamp({ record }: { record: Audited }) {
  return (
    <div className="audit-stamp">
      <span>{timestamp(record.updated_at)}</span>
      <small>
        {record.updated_by_label ||
          record.updated_by ||
          "Responsable no registrado"}
      </small>
    </div>
  );
}
export function AuditHistory({
  record,
  fields,
}: {
  record: Audited;
  fields: Record<string, string>;
}) {
  return (
    <details className="audit-history">
      <summary>Historial de cambios ({record.historial?.length ?? 0})</summary>
      <Table
        headers={["Fecha", "Acción", "Responsable", "Cambios"]}
        empty="No hay historial anterior registrado"
        rows={[...(record.historial || [])].reverse().map((event) => [
          timestamp(event.fecha),
          event.accion,
          event.responsable || event.usuario_id || "No registrado",
          <div>
            {Object.entries(fields)
              .filter(
                ([key]) =>
                  !event.anterior || event.anterior[key] !== event.nuevo[key],
              )
              .map(([key, label]) => (
                <p key={key}>
                  <strong>{label}:</strong>{" "}
                  {event.anterior
                    ? `${String(event.anterior[key] ?? "—")} → `
                    : ""}
                  {String(event.nuevo[key] ?? "—")}
                </p>
              ))}
          </div>,
        ])}
      />
    </details>
  );
}
