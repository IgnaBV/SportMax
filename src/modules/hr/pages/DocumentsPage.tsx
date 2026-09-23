import { useState } from "react";
import { Plus, ExternalLink } from "lucide-react";
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
import { date, same, fullName } from "@/lib/data";
import { useToast } from "@/context/toast";
export default function DocumentsPage() {
  const q = useQuery(loadHR);
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [employee, setEmployee] = useState("");
  const [open, setOpen] = useState(false);
  const d = q.data;
  return (
    <>
      <PageTitle
        eyebrow="RECURSOS HUMANOS / ARCHIVO"
        title="Documentos"
        description="La documentación de tu equipo, organizada y accesible."
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus />
            Añadir documento
          </Button>
        }
      />
      <section className="panel">
        <div className="toolbar">
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder="Buscar nombre o tipo…"
          />
          <select
            aria-label="Trabajador"
            value={employee}
            onChange={(e) => setEmployee(e.target.value)}
          >
            <option value="">Todos los trabajadores</option>
            {d?.employees.map((e) => (
              <option key={e.id} value={e.id}>
                {fullName(e)}
              </option>
            ))}
          </select>
        </div>
        <QueryState {...q}>
          <Table
            headers={["Documento", "Trabajador", "Tipo", "Fecha", "Archivo"]}
            rows={
              d?.documents
                .filter(
                  (doc) =>
                    (!employee || same(employee, doc.trabajador_id)) &&
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
                  <Badge>{doc.tipo}</Badge>,
                  date(doc.created_at),
                  /^https:\/\//i.test(doc.archivo_url) ? (
                    <a
                      className="text-link"
                      href={doc.archivo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Abrir <ExternalLink size={14} />
                    </a>
                  ) : (
                    "URL no válida"
                  ),
                ]) || []
            }
          />
        </QueryState>
      </section>
      {open && (
        <Modal title="Añadir documento" onClose={() => setOpen(false)}>
          <p className="modal-note">
            Vincula un archivo existente. Para documentación privada, utiliza un
            enlace con acceso restringido.
          </p>
          <DataForm
            onClose={() => setOpen(false)}
            fields={[
              {
                name: "trabajador_id",
                label: "Trabajador",
                required: true,
                options:
                  d?.employees.map((e) => ({
                    value: String(e.id),
                    label: fullName(e),
                  })) || [],
              },
              { name: "nombre", label: "Nombre del documento", required: true },
              { name: "tipo", label: "Tipo", required: true },
              {
                name: "archivo_url",
                label: "Enlace HTTPS del archivo",
                type: "url",
                required: true,
              },
            ]}
            onSave={async (v) => {
              await saveDocument(v);
              setOpen(false);
              q.reload();
              toast("Documento vinculado correctamente");
            }}
          />
        </Modal>
      )}
    </>
  );
}
