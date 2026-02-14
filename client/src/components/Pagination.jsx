const Pagination = ({ currentPage, totalPages, totalData, onPageChange }) => {
  return (
    <div className="p-4 border-t border-[var(--color-border)] flex flex-col sm:flex-row justify-between items-center gap-4 bg-[var(--color-surface)]">
      <span className="text-xs text-[var(--color-text-muted)] font-medium">
        Menampilkan data {totalData > 0 ? currentPage : 0} dari total {totalData} entries
      </span>

      <div className="join shadow-sm">
        <button
          className="join-item btn btn-sm bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-border)] disabled:opacity-50"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          « Prev
        </button>

        <button className="join-item btn btn-sm bg-[var(--color-primary)] text-white border-none pointer-events-none">
          Page {currentPage} of {totalPages || 1}
        </button>

        <button
          className="join-item btn btn-sm bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-border)] disabled:opacity-50"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next »
        </button>
      </div>
    </div>
  );
};

export default Pagination;
