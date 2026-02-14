import { FaChevronLeft, FaChevronRight, FaSpinner } from "react-icons/fa";

/**
 * General Reusable Component untuk Pagination
 * 
 * @param {Object} props
 * @param {number} props.currentPage - Halaman saat ini
 * @param {number} props.totalPages - Total halaman
 * @param {number} props.totalItems - Total item
 * @param {number} props.itemsPerPage - Item per halaman
 * @param {Function} props.onPageChange - Handler untuk perubahan halaman
 * @param {boolean} props.isLoading - Loading state
 * @param {string} props.itemLabel - Label untuk item (default: "item")
 */
const ListPagination = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  isLoading = false,
  itemLabel = "item",
}) => {
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("ellipsis");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("ellipsis");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("ellipsis");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("ellipsis");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  if (totalPages <= 1) return null;

  const pageNumbers = getPageNumbers();
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 bg-[var(--color-surface)] rounded-lg shadow-sm border border-[var(--color-border)] p-2.5">
      {/* Info - Compact */}
      <div className="text-xs text-[var(--color-text-muted)]">
        Menampilkan <span className="font-semibold text-[var(--color-text)]">{startItem}</span> -{" "}
        <span className="font-semibold text-[var(--color-text)]">{endItem}</span> dari{" "}
        <span className="font-semibold text-[var(--color-text)]">{totalItems}</span> {itemLabel}
      </div>

      {/* Pagination Controls - Compact */}
      <div className="flex items-center gap-1.5">
        {/* Previous Button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || isLoading}
          className="btn btn-xs btn-outline rounded-lg border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-border)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <FaSpinner className="animate-spin text-xs text-[var(--color-primary)]" />
          ) : (
            <FaChevronLeft className="text-xs" />
          )}
        </button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((page, index) => {
            if (page === "ellipsis") {
              return (
                <span key={`ellipsis-${index}`} className="px-1 text-[var(--color-text-muted)] text-xs">
                  ...
                </span>
              );
            }

            return (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                disabled={isLoading}
                className={`btn btn-xs rounded-lg min-w-[2rem] h-8 ${
                  currentPage === page
                    ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                    : "btn-outline border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-border)] hover:text-[var(--color-text)]"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {page}
              </button>
            );
          })}
        </div>

        {/* Next Button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || isLoading}
          className="btn btn-xs btn-outline rounded-lg border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-border)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <FaSpinner className="animate-spin text-xs text-[var(--color-primary)]" />
          ) : (
            <FaChevronRight className="text-xs" />
          )}
        </button>
      </div>
    </div>
  );
};

export default ListPagination;
