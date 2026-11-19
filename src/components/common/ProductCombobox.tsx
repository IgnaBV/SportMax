import { useId, useRef, useState } from "react";
import "./ProductCombobox.css";

type Option = { value: string; label: string; search: string };
const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

export default function ProductCombobox({
  id,
  value,
  options,
  onChange,
  label = "Productos",
  placeholder = "Buscar por código o nombre…",
  emptyMessage = "No se encontraron productos.",
  required = true,
  invalid,
  describedBy,
}: {
  id: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  emptyMessage?: string;
  required?: boolean;
  invalid?: boolean;
  describedBy?: string;
}) {
  const listId = useId();
  const list = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(-1);
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  const matches = options.filter((option) =>
    terms.every((term) => normalize(option.search).includes(term)),
  );
  const selected = options.find((option) => option.value === value);
  function choose(option: Option) {
    onChange(option.value);
    setQuery("");
    setActive(-1);
    setOpen(false);
  }
  return (
    <div className="product-combobox">
      <input
        id={id}
        role="combobox"
        autoComplete="off"
        required={required}
        aria-label={label}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={
          open && matches[active] ? `${listId}-${active}` : undefined
        }
        placeholder={placeholder}
        value={open ? query : (selected?.label ?? "")}
        onFocus={() => {
          setOpen(true);
          setQuery("");
          setActive(-1);
        }}
        onClick={() => setOpen(true)}
        onBlur={() => {
          setOpen(false);
          setQuery("");
          setActive(-1);
        }}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
          setActive(-1);
          if (value) onChange("");
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            if (open) event.stopPropagation();
            setOpen(false);
            setQuery("");
            setActive(-1);
          }
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            setOpen(true);
            const next =
              event.key === "ArrowDown"
                ? Math.min(active + 1, matches.length - 1)
                : Math.max(active - 1, 0);
            setActive(next);
            list.current?.children[next]?.scrollIntoView({ block: "nearest" });
          }
          if (event.key === "Enter" && open) {
            event.preventDefault();
            if (matches[active]) choose(matches[active]);
            else if (matches.length === 1) choose(matches[0]);
          }
        }}
      />
      {open && (
        <ul
          id={listId}
          ref={list}
          role="listbox"
          aria-label={label}
          className="product-combobox-options"
        >
          {matches.map((option, index) => (
            <li
              id={`${listId}-${index}`}
              key={option.value}
              role="option"
              aria-selected={value === option.value}
              className={active === index ? "active" : ""}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(option)}
            >
              {option.label}
            </li>
          ))}
          {!matches.length && <li role="presentation">{emptyMessage}</li>}
        </ul>
      )}
    </div>
  );
}
