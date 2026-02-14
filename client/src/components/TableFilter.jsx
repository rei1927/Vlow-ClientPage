import { FaFilter } from "react-icons/fa";

const TableFilter = ({ options, value, onChange, label = "Filter" }) => {
  return (
    <div className="w-full md:w-48 relative">
      <div className="absolute z-10 inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--color-text-muted)]">
        <FaFilter size={12} />
      </div>
      <select
        className="select select-bordered w-full pl-9 rounded-xl bg-[var(--color-bg)] border-[var(--color-border)] focus:border-[var(--color-primary)] text-[var(--color-text)] text-sm [color-scheme:inherit]"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{label}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default TableFilter;
