import { useId } from "react";
import ProductCombobox from "./ProductCombobox";

type Option = { value: string; label: string };
export default function SearchableSelect({
  id,
  label,
  value,
  options,
  onChange,
  placeholder = "Buscar trabajador por nombre…",
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
  return (
    <ProductCombobox
      id={id ?? generatedId}
      label={label}
      value={value}
      options={options.map((option) => ({ ...option, search: option.label }))}
      onChange={onChange}
      placeholder={
        placeholder === "Todos los trabajadores"
          ? "Buscar nombre / todos los trabajadores…"
          : placeholder
      }
      emptyMessage="No se encontraron trabajadores."
      required={false}
      invalid={invalid}
      describedBy={describedBy}
    />
  );
}
