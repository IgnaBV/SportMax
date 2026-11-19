import AttendanceDifference from "./AttendanceDifference";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import SearchableSelect from "@/components/common/SearchableSelect";
import { fullName, same } from "@/lib/data";
import type { Attendance, Employee, Id, Schedule } from "@/types/entities";
import { saveAttendance } from "../services/hr";
import {
  attendanceStatus,
  hour,
} from "../services/presentation";

type Mark = "pending" | "ontime" | "actual";
export default function AttendanceEditor({
  current,
  employeeId,
  selected,
  employees,
  schedules,
  records,
  onClose,
  onSaved,
}: {
  current: Attendance | "new";
  employeeId?: Id;
  selected: Id;
  employees: Employee[];
  schedules: Schedule[];
  records: Attendance[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const today = new Date();
  const [worker, setWorker] = useState(
    String(current === "new" ? selected : current.trabajador_id),
  );
  const [date, setDate] = useState(
    current === "new"
      ? `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
      : current.fecha,
  );
  const [entry, setEntry] = useState(
    current === "new" ? "" : (current.hora_entrada?.slice(0, 5) ?? ""),
  );
  const [exit, setExit] = useState(
    current === "new" ? "" : (current.hora_salida?.slice(0, 5) ?? ""),
  );
  const [entryMark, setEntryMark] = useState<Mark>(
    entry ? "actual" : "pending",
  );
  const [exitMark, setExitMark] = useState<Mark>(exit ? "actual" : "pending");
  const [status, setStatus] = useState(
    current === "new" ? "PRESENTE" : current.estado,
  );
  const [note, setNote] = useState(
    current === "new" ? "" : (current.observacion ?? ""),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const matches = schedules.filter(
    (s) => s.activo && same(s.trabajador_id, worker),
  );
  const schedule = matches.length === 1 ? matches[0] : undefined;
  const absence = status === "AUSENTE" || status === "PERMISO";
  const preview = {
    hora_entrada: entry || null,
    hora_salida: exit || null,
  };

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!worker || !date)
      return setError("Selecciona un trabajador y la fecha.");
    if (!absence && !entry)
      return setError("Marca la entrada a tiempo o introduce la hora real.");
    if (
      exit &&
      (!entry ||
        exit === entry ||
        (!(schedule && schedule.hora_salida < schedule.hora_entrada) &&
          exit < entry))
    )
      return setError(
        "La salida debe ser posterior a la entrada; solo se permite cruzar medianoche con un horario nocturno asignado.",
      );
    if (
      records.some(
        (record) =>
          same(record.trabajador_id, worker) &&
          record.fecha === date &&
          (current === "new" || !same(record.id, current.id)),
      )
    )
      return setError(
        "Ya existe asistencia para este trabajador y fecha. Edita ese registro para marcar su salida.",
      );
    setBusy(true);
    try {
      await saveAttendance(
        {
          trabajador_id: worker,
          fecha: date,
          hora_entrada: absence ? "" : entry,
          hora_salida: absence ? "" : exit,
          estado: absence
            ? status
            : schedule
              ? attendanceStatus(entry, schedule)
              : status,
          observacion: note.trim(),
        },
        current === "new" ? undefined : current.id,
      );
      onSaved();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo guardar la asistencia",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <fieldset disabled={busy} className="form-grid modal-body">
        {!employeeId && (
          <div className="field wide">
            <SearchableSelect
              label="Trabajador"
              value={worker}
              options={employees
                .filter(
                  (e) =>
                    e.estado === "ACTIVO" ||
                    (current !== "new" && same(e.id, current.trabajador_id)),
                )
                .map((e) => ({ value: String(e.id), label: fullName(e) }))}
              onChange={(value) => {
                setWorker(value);
                setEntry("");
                setExit("");
                setEntryMark("pending");
                setExitMark("pending");
                setError("");
              }}
            />
          </div>
        )}
        <div className="field">
          <label htmlFor="attendance-date">Fecha de inicio de jornada *</label>
          <input
            id="attendance-date"
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="attendance-status">Estado</label>
          <select
            id="attendance-status"
            value={schedule && !absence ? "PRESENTE" : status}
            onChange={(e) => {
              setStatus(e.target.value);
              if (
                e.target.value === "AUSENTE" ||
                e.target.value === "PERMISO"
              ) {
                setEntry("");
                setExit("");
                setEntryMark("pending");
                setExitMark("pending");
              }
            }}
          >
            <option value="PRESENTE">
              Asistencia{schedule ? " (puntualidad automática)" : " presente"}
            </option>
            {!schedule && <option value="ATRASO">Atraso</option>}
            <option value="AUSENTE">Ausente</option>
            <option value="PERMISO">Permiso</option>
          </select>
        </div>
        <p className="notice wide">
          {schedule
            ? `Horario asignado: ${hour(schedule.hora_entrada)} — ${hour(schedule.hora_salida)}${schedule.hora_salida < schedule.hora_entrada ? " (salida al día siguiente)" : ""}. Puedes modificarlo en la pestaña Horario de la ficha.`
            : "Selecciona un trabajador con un único horario vigente para marcar a tiempo. También puedes introducir las horas manualmente."}
        </p>
        {!absence && (
          <>
            <div className="field">
              <label htmlFor="entry-mark">Entrada</label>
              <select
                id="entry-mark"
                value={entryMark}
                onChange={(e) => {
                  const mark = e.target.value as Mark;
                  setEntryMark(mark);
                  setEntry(
                    mark === "ontime" && schedule
                      ? schedule.hora_entrada.slice(0, 5)
                      : "",
                  );
                }}
              >
                <option value="pending">Sin marcar</option>
                <option value="ontime" disabled={!schedule}>
                  A tiempo
                </option>
                <option value="actual">Otra hora / retraso</option>
              </select>
              <label htmlFor="actual-entry">Hora real de entrada</label>
              <input
                id="actual-entry"
                type="time"
                value={entry}
                onChange={(e) => {
                  setEntry(e.target.value);
                  setEntryMark(e.target.value ? "actual" : "pending");
                }}
              />
              <AttendanceDifference record={preview} schedule={schedule} kind="entry" />
            </div>
            <div className="field">
              <label htmlFor="exit-mark">Salida</label>
              <select
                id="exit-mark"
                value={exitMark}
                onChange={(e) => {
                  const mark = e.target.value as Mark;
                  setExitMark(mark);
                  setExit(
                    mark === "ontime" && schedule
                      ? schedule.hora_salida.slice(0, 5)
                      : "",
                  );
                }}
              >
                <option value="pending">Pendiente / sin marcar</option>
                <option value="ontime" disabled={!schedule}>
                  A tiempo
                </option>
                <option value="actual">Otra hora / salida anticipada</option>
              </select>
              <label htmlFor="actual-exit">Hora real de salida</label>
              <input
                id="actual-exit"
                type="time"
                value={exit}
                onChange={(e) => {
                  setExit(e.target.value);
                  setExitMark(e.target.value ? "actual" : "pending");
                }}
              />
              <AttendanceDifference record={preview} schedule={schedule} kind="exit" />
            </div>
          </>
        )}
        <div className="field wide">
          <label htmlFor="attendance-note">Observación</label>
          <textarea
            id="attendance-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
        {error && (
          <p className="field-error wide" role="alert">
            {error}
          </p>
        )}
      </fieldset>
      <div className="modal-footer">
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={onClose}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={busy}>
          {busy ? "Guardando…" : "Guardar asistencia"}
        </Button>
      </div>
    </form>
  );
}
