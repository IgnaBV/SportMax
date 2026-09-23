import SearchableSelect from "@/components/common/SearchableSelect";
import { useState, useCallback } from "react";
import { Plus, ExternalLink, Pencil, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  PageTitle,
  QueryState,
  SearchBox,
  Table,
  Badge,
  Modal,
  DataForm,
} from "@/components/common/UI";
import { useQuery } from "@/hooks/useQuery";
import { loadHR, saveDocument } from "../services/hr";
import { same, fullName } from "@/lib/data";
import { useToast } from "@/context/toast";
import { useAuth } from "@/context/auth";
import type { Id, Document } from "@/types/entities";
import { AuditStamp, AuditHistory } from "../components/Audit";
import { timestamp } from "../services/presentation";
export default function DocumentsPage({ employeeId }: { employeeId?: Id }) {
  const loader = useCallback(() => loadHR(employeeId), [employeeId]);
  const q = useQuery(loader);
  const toast = useToast();
  const { session } = useAuth();
  const [search, setSearch] = useState("");
  const [employee, setEmployee] = useState("");
  const [edit, setEdit] = useState<Document | "new" | null>(null);
  const [view, setView] = useState<Document | null>(null);
  const d = q.data;
  const selected = employeeId ?? employee;
  const action = (
    <Button onClick={() => setEdit("new")}>
      <Plus />
      Añadir documento
    </Button>
  );
  return (
    <>
      {employeeId ? (
        <div className="record-section-heading">
          <div>
            <h2>Documentos</h2>
            <p>Referencias y documentación laboral de este trabajador.</p>
          </div>
          {action}
        </div>
      ) : (
        <PageTitle
          eyebrow="RECURSOS HUMANOS / ARCHIVO"
          title="Documentos"
          description="La documentación de tu equipo, organizada y accesible."
          action={action}
        />
      )}
      <section className="panel">
        <div className="toolbar">
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder="Buscar nombre o tipo…"
          />
          {!employeeId && (
            <SearchableSelect
              label="Trabajador"
              value={employee}
              onChange={setEmployee}
              placeholder="Todos los trabajadores"
              options={
                d?.employees.map((e) => ({
                  value: String(e.id),
                  label: fullName(e),
                })) ?? []
              }
            />
          )}
        </div>
        <QueryState {...q}>
          <Table
            key={`${selected}-${search}`}
            headers={[
              "Documento",
              "Trabajador",
              "Tipo",
              "Registro",
              "Última modificación",
              "Consulta",
              "Edición",
            ]}
            rows={
              d?.documents
                .filter(
                  (doc) =>
                    (!selected || same(selected, doc.trabajador_id)) &&
                    `${doc.nombre} ${doc.tipo}`
                      .toLowerCase()
                      .includes(search.toLowerCase()),
                )
                .map((doc) => [
                  <strong>{doc.nombre}</strong>,
                  fullName(
                    d.employees.find((e) => same(e.id, doc.trabajador_id)) || {
                      nombres: "Trabajador",
                      apellidos: "no disponible",
                    },
                  ),
                  <Badge>{doc.tipo || "Referencia"}</Badge>,
                  timestamp(doc.created_at),
                  <AuditStamp record={doc} />,
                  <Button variant="ghost" onClick={() => setView(doc)}>
                    <Eye />
                    Consultar
                  </Button>,
                  <Button variant="outline" onClick={() => setEdit(doc)}>
                    <Pencil />
                    Editar
                  </Button>,
                ]) || []
            }
          />
        </QueryState>
      </section>
      {view && (
        <Modal title={view.nombre} onClose={() => setView(null)}>
          <div className="modal-body">
            <p>{view.tipo || "Referencia documental"}</p>
            <p>Registro: {timestamp(view.created_at)}</p>
            <AuditStamp record={view} />
            {/^https:\/\//i.test(view.archivo_url || "") ? (
              <a
                className="text-link"
                href={view.archivo_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Abrir archivo <ExternalLink size={16} />
              </a>
            ) : (
              <p>Referencia registrada sin archivo enlazado.</p>
            )}
            <AuditHistory
              record={view}
              fields={{ nombre: "Nombre", tipo: "Tipo", archivo_url: "Enlace" }}
            />
          </div>
        </Modal>
      )}
      {edit && (
        <Modal
          title={edit === "new" ? "Añadir documento" : "Editar documento"}
          onClose={() => setEdit(null)}
        >
          <p className="modal-note">
            Puedes registrar una referencia sin archivo o vincular un enlace
            HTTPS con acceso restringido. Responsable: {session?.user.email}.
          </p>
          <DataForm
            initial={
              edit === "new"
                ? { trabajador_id: String(employeeId ?? employee) }
                : { ...edit }
            }
            onClose={() => setEdit(null)}
            fields={[
              ...(edit === "new" && !employeeId
                ? [
                    {
                      name: "trabajador_id",
                      searchable: true,
                      label: "Trabajador",
                      required: true,
                      options:
                        d?.employees.map((e) => ({
                          value: String(e.id),
                          label: fullName(e),
                        })) || [],
                    },
                  ]
                : []),
              { name: "nombre", label: "Nombre del documento", required: true },
              { name: "tipo", label: "Tipo", required: true },
              {
                name: "archivo_url",
                label: "Enlace HTTPS del archivo (opcional)",
                type: "url",
              },
            ]}
            onSave={async (v) => {
              await saveDocument(
                { ...v, trabajador_id: String(employeeId ?? v.trabajador_id) },
                edit === "new" ? undefined : edit,
              );
              setEdit(null);
              q.reload();
              toast("Documento guardado correctamente");
            }}
          />
        </Modal>
      )}
    </>
  );
}
