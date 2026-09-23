import { useState } from "react";
import { Modal, DataForm, Confirm, type Field } from "@/components/common/UI";
import type { Employee } from "@/types/entities";
import { saveEmployee } from "../services/hr";
import { useToast } from "@/context/toast";
const positionsByArea = new Map<string, string[]>([
  ["RECURSOS HUMANOS", [
    "Responsable de Recursos Humanos",
    "Analista de Recursos Humanos",
    "Auxiliar de Recursos Humanos",
  ]],
  ["LOGÍSTICA E INVENTARIOS", [
    "Responsable de Logística e Inventarios",
    "Encargado de Inventario",
    "Encargado de Almacén",
    "Auxiliar de Inventario",
  ]],
  ["VENTAS", [
    "Responsable de Ventas",
    "Supervisor de Ventas",
    "Vendedor",
    "Vendedor/Cajero",
  ]],
]);
const fields: Field[] = [
  {
    name: "nombres",
    label: "Nombres",
    required: true,
    section: "Datos personales",
  },
  { name: "apellidos", label: "Apellidos", required: true },
  { name: "identificacion", label: "Identificación", required: true },
  { name: "telefono", label: "Teléfono", type: "tel" },
  { name: "direccion", label: "Dirección" },
  {
    name: "area", label: "Área", required: true, section: "Datos laborales",
    options: [...positionsByArea.keys()].map((area) => ({ value: area, label: area })),
  },
  {
    name: "cargo", label: "Cargo", required: true, dependsOn: "area",
    getOptions: (values) => (positionsByArea.get(values.area) ?? []).map(
      (cargo) => ({ value: cargo, label: cargo }),
    ),
  },
  {
    name: "fecha_ingreso",
    label: "Fecha de ingreso",
    type: "date",
    required: true,
  },
  {
    name: "salario",
    label: "Salario",
    type: "number",
    min: 0,
    step: "0.01",
    required: true,
  },
  {
    name: "estado",
    label: "Estado",
    required: true,
    options: [
      { value: "ACTIVO", label: "Activo" },
      { value: "INACTIVO", label: "Inactivo" },
    ],
  },
];
export default function EmployeeEditor({
  employee,
  onClose,
  onSaved,
}: {
  employee: Employee | "new";
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [pending, setPending] = useState<Record<string, string> | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function persist(v: Record<string, string>) {
    await saveEmployee(v, employee === "new" ? undefined : employee.id);
    onSaved();
    onClose();
    toast("Trabajador guardado correctamente");
  }
  return (
    <>
      <Modal
        title={
          employee === "new" ? "Registrar trabajador" : "Editar trabajador"
        }
        onClose={onClose}
      >
        <DataForm
          initial={employee === "new" ? { estado: "ACTIVO" } : { ...employee }}
          fields={fields}
          validate={(values) => {
            const errors: Record<string, string> = {};
            if (!positionsByArea.has(values.area)) {
              errors.area = "Selecciona un área del listado";
            }
            if (!positionsByArea.get(values.area)?.includes(values.cargo)) {
              errors.cargo = "Selecciona un cargo correspondiente al área";
            }
            return errors;
          }}
          onClose={onClose}
          onSave={async (v) => {
            if (
              employee !== "new" &&
              employee.estado === "ACTIVO" &&
              v.estado !== "ACTIVO"
            ) {
              setPending(v);
              return;
            }
            await persist(v);
          }}
        />
      </Modal>
      {pending && (
        <Confirm
          title="Desactivar trabajador"
          busy={busy}
          onClose={() => setPending(null)}
          onConfirm={async () => {
            setBusy(true);
            try {
              await persist(pending);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Error al guardar");
            } finally {
              setBusy(false);
            }
          }}
        >
          <p>
            Se conservarán los registros históricos del trabajador. Confirma el
            cambio de estado.
          </p>
          {error && (
            <p role="alert" className="field-error">
              {error}
            </p>
          )}
        </Confirm>
      )}
    </>
  );
}
