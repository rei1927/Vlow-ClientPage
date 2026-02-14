import ListFilters from "../common/ListFilters";

/**
 * Component untuk Search, Filter, dan Sort Platforms
 * Wrapper untuk ListFilters dengan konfigurasi spesifik untuk Platforms
 */
const PlatformListFilters = ({
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
        searchPlaceholder: "Cari berdasarkan nama atau session ID...",
        filterOptions: [
          { value: "all", label: "Semua Status" },
          { value: "WORKING", label: "Connected" },
          { value: "SCANNING", label: "Scanning QR" },
          { value: "STOPPED", label: "Stopped" },
          { value: "FAILED", label: "Failed" },
        ],
        sortOptions: [
          { value: "name", label: "Nama Platform" },
          { value: "status", label: "Status" },
          { value: "createdAt", label: "Tanggal Dibuat" },
          { value: "updatedAt", label: "Terakhir Diupdate" },
        ],
        getFilterLabel: (value) => {
          const labels = {
            WORKING: "Connected",
            SCANNING: "Scanning QR",
            STOPPED: "Stopped",
            FAILED: "Failed",
          };
          return labels[value] || value;
        },
      }}
    />
  );
};

export default PlatformListFilters;
