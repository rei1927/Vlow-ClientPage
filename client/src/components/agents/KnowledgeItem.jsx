import { FaTrash, FaImage } from "react-icons/fa";

const KnowledgeItem = ({ item, onDelete }) => {
  return (
    <div className="flex items-center gap-4 bg-[var(--color-surface)] p-3 rounded-xl border border-[var(--color-border)] shadow-sm hover:border-[var(--color-primary)]/40 transition-colors group">
      <div className="w-16 h-16 rounded-lg overflow-hidden bg-[var(--color-bg)] shrink-0 border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-muted)]">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt="Knowledge" className="w-full h-full object-cover" />
        ) : (
          <FaImage size={24} />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-[var(--color-text)] text-sm line-clamp-1" title={item.description}>
          {item.description}
        </p>
        <p className="text-[10px] text-[var(--color-text-muted)] mt-1">
          ID: {item.id.substring(0, 8)}... • Ditambahkan:{" "}
          {new Date(item.createdAt).toLocaleDateString("id-ID")}
        </p>
      </div>

      <button
        onClick={() => onDelete(item.id)}
        className="btn btn-xs btn-square btn-ghost text-[var(--color-text-muted)] hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
        title="Hapus Knowledge"
      >
        <FaTrash />
      </button>
    </div>
  );
};

export default KnowledgeItem;
