import ListFilters from "../common/ListFilters";

/**
 * Component untuk Search, Filter, dan Sort Agents
 * Wrapper untuk ListFilters dengan konfigurasi spesifik untuk Agents
 */
const AgentListFilters = ({
  onSearchChange,
  onFilterChange,
  onSortChange,
  filters,
  isLoading = false,
}) => {
  return (
    <ListFilters
      onSearchChange={onSearchChange}
      onFilterChange={onFilterChange}
      onSortChange={onSortChange}
      filters={filters}
      isLoading={isLoading}
      config={{
        searchPlaceholder: "Cari berdasarkan nama atau deskripsi...",
        filterOptions: [
          { value: "all", label: "Semua Status" },
          { value: "active", label: "Hanya Aktif" },
          { value: "inactive", label: "Hanya Tidak Aktif" },
        ],
        sortOptions: [
          { value: "name", label: "Nama Agent" },
          { value: "createdAt", label: "Tanggal Dibuat" },
          { value: "updatedAt", label: "Terakhir Diupdate" },
        ],
        getFilterLabel: (value) => {
          if (value === "active") return "Aktif";
          if (value === "inactive") return "Tidak Aktif";
          return value;
        },
      }}
    />
  );
};

export default AgentListFilters;
