import { useId, useState } from "react";

type Option = { value: string; label: string };
const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .trim();

export default function SearchableSelect({
  id,
  label,
  value,
  options,
  onChange,
  placeholder = "Seleccionar trabajador…",
  invalid,
  describedBy,
}: {
  id?: string;
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  placeholder?: string;
  invalid?: boolean;
  describedBy?: string;
}) {
  const generatedId = useId();
  const [search, setSearch] = useState("");
  const terms = normalize(search).split(/\s+/).filter(Boolean);
  const matches = options.filter((option) =>
    terms.every((term) => normalize(option.label).includes(term)),
  );
  const selected = options.find((option) => option.value === value);
  return (
    <div className="field">
      <label htmlFor={`${generatedId}-search`}>
        Buscar trabajador por nombre
      </label>
      <input
        id={`${generatedId}-search`}
        type="search"
        placeholder="Escribe nombres o apellidos…"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      <select
        id={id}
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={invalid}
        aria-describedby={describedBy}
      >
        <option value="">{placeholder}</option>
        {selected && !matches.includes(selected) && (
          <option value={selected.value}>
            {selected.label} (seleccionado)
          </option>
        )}
        {matches.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {search && (
        <small role="status">
          {matches.length
            ? `${matches.length} coincidencias`
            : "No se encontraron trabajadores"}
        </small>
      )}
    </div>
  );
}
