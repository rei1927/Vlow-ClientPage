# Common Components

Komponen-komponen umum yang dapat digunakan kembali (reusable) di berbagai halaman.

## ListFilters

Komponen general untuk search, filter, dan sort yang dapat dikustomisasi.

### Props

- `onSearchChange` (Function): Handler untuk perubahan search query
- `onFilterChange` (Function): Handler untuk perubahan filter
- `onSortChange` (Function): Handler untuk perubahan sort (menerima `{ sortBy, sortOrder }`)
- `filters` (Object): Object berisi `{ searchQuery, statusFilter, sortBy, sortOrder }`
- `isLoading` (boolean): Loading state
- `config` (Object): Konfigurasi untuk kustomisasi
  - `searchPlaceholder` (string): Placeholder untuk search input
  - `filterOptions` (Array): Array of `{ value, label }` untuk filter dropdown
  - `sortOptions` (Array): Array of `{ value, label }` untuk sort dropdown
  - `getFilterLabel` (Function): Function untuk mendapatkan label filter yang aktif (optional)

### Contoh Penggunaan

```jsx
import ListFilters from "../common/ListFilters";

<ListFilters
  onSearchChange={setSearchQuery}
  onFilterChange={setStatusFilter}
  onSortChange={({ sortBy, sortOrder }) => {
    setSortBy(sortBy);
    setSortOrder(sortOrder);
  }}
  filters={{
    searchQuery,
    statusFilter,
    sortBy,
    sortOrder,
  }}
  isLoading={isFiltering}
  config={{
    searchPlaceholder: "Cari berdasarkan nama...",
    filterOptions: [
      { value: "all", label: "Semua Status" },
      { value: "active", label: "Aktif" },
    ],
    sortOptions: [
      { value: "name", label: "Nama" },
      { value: "createdAt", label: "Tanggal Dibuat" },
    ],
    getFilterLabel: (value) => {
      if (value === "active") return "Aktif";
      return value;
    },
  }}
/>
```

## ListPagination

Komponen general untuk pagination yang dapat dikustomisasi.

### Props

- `currentPage` (number): Halaman saat ini
- `totalPages` (number): Total halaman
- `totalItems` (number): Total item
- `itemsPerPage` (number): Item per halaman
- `onPageChange` (Function): Handler untuk perubahan halaman
- `isLoading` (boolean): Loading state
- `itemLabel` (string): Label untuk item (default: "item")

### Contoh Penggunaan

```jsx
import ListPagination from "../common/ListPagination";

<ListPagination
  currentPage={pagination.page}
  totalPages={pagination.totalPages}
  totalItems={pagination.total}
  itemsPerPage={pagination.limit}
  onPageChange={setCurrentPage}
  isLoading={isFiltering}
  itemLabel="agent"
/>
```

## Catatan

- Komponen-komponen ini dirancang untuk digunakan dengan backend pagination
- Pastikan backend mengembalikan metadata pagination dalam format:
  ```json
  {
    "success": true,
    "data": [...],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 9,
      "totalPages": 12,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
  ```
