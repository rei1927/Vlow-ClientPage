import { Link } from "react-router-dom";
import {
  FaRobot,
  FaEdit,
  FaTrash,
  FaCheckCircle,
  FaPowerOff,
  FaDatabase,
} from "react-icons/fa";

/**
 * Enhanced Agent Card Component
 * Professional, clean design with essential information
 */
const AgentCard = ({ agent, onDelete, isSubscriptionExpired = false }) => {
  const getKnowledgeCount = () => {
    return agent.KnowledgeSources?.length || 0;
  };

  return (
    <div className="group bg-[var(--color-surface)] rounded-lg shadow-sm border border-[var(--color-border)] hover:shadow-md hover:border-[var(--color-primary)]/40 transition-all duration-200 flex flex-col h-full overflow-hidden">
      <div className="relative bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-hover)] p-4 text-white">
        <div className="flex items-start justify-between mb-2.5">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center text-lg shadow-sm">
            <FaRobot />
          </div>

          {agent.isActive ? (
            <span className="badge badge-sm bg-green-500 text-white border-none font-medium gap-1.5 px-2.5 py-1 shadow-sm">
              <FaCheckCircle size={10} /> Active
            </span>
          ) : (
            <span className="badge badge-sm bg-gray-500/90 text-white border-none font-medium gap-1.5 px-2.5 py-1 shadow-sm">
              <FaPowerOff size={10} /> Inactive
            </span>
          )}
        </div>

        <h3
          className="font-bold text-base text-white mb-1 line-clamp-1 group-hover:text-white/90 transition-colors"
          title={agent.name}
        >
          {agent.name}
        </h3>
        <p className="text-white/80 text-xs line-clamp-2 min-h-[2.5rem] leading-relaxed">
          {agent.description || "Tidak ada deskripsi tersedia untuk agent ini."}
        </p>
      </div>

      <div className="p-4 flex-1 flex items-center justify-between bg-[var(--color-bg)]/50">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-[var(--color-primary)]/10 rounded-lg">
            <FaDatabase className="text-[var(--color-primary)] text-sm" />
          </div>
          <div>
            <div className="text-xs text-[var(--color-text-muted)] font-medium">Knowledge Base</div>
            <div className="text-sm font-bold text-[var(--color-text)]">{getKnowledgeCount()} Item</div>
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--color-border)] p-3 bg-[var(--color-surface)] flex gap-2">
        <Link
          to={`/ai-agents/${agent.id}`}
          className={`btn btn-sm flex-1 border-none rounded-lg gap-2 normal-case font-medium transition-all h-9 ${
            isSubscriptionExpired
              ? "bg-[var(--color-text-muted)] text-white cursor-not-allowed pointer-events-none"
              : "bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white"
          }`}
          onClick={(e) => {
            if (isSubscriptionExpired) {
              e.preventDefault();
            }
          }}
        >
          <FaEdit /> Kelola
        </Link>
        <button
          onClick={() => onDelete(agent.id)}
          className="btn btn-sm btn-square bg-[var(--color-bg)] hover:bg-red-50 text-[var(--color-text-muted)] hover:text-red-500 border border-[var(--color-border)] hover:border-red-200 rounded-lg transition-all h-9"
          title="Hapus Agent"
        >
          <FaTrash />
        </button>
      </div>
    </div>
  );
};

export default AgentCard;
