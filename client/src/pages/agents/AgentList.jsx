import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { FaPlus, FaRobot } from "react-icons/fa";
import { getAgents, deleteAgent, resetAgentState } from "../../features/agents/agentSlice";
import toast from "react-hot-toast";
import useDebounce from "../../hooks/useDebounce";

// Modular Components
import AgentCard from "../../components/agents/AgentCard";
import AgentListFilters from "../../components/agents/AgentListFilters";
import AgentListPagination from "../../components/agents/AgentListPagination";
import AgentListLoading from "../../components/agents/AgentListLoading";
import Loader from "../../components/Loader";
import ConfirmationModal from "../../components/ConfirmationModal";
import SubscriptionWarning from "../../components/common/SubscriptionWarning";

const ITEMS_PER_PAGE = 9;

const AgentList = () => {
  const dispatch = useDispatch();
  const { agents, isLoading, isError, message, isSuccess, pagination } = useSelector(
    (state) => state.agents,
  );
  const { user } = useSelector((state) => state.auth);

  // State Management
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    agentId: null,
  });

  // Filter & Sort State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("updatedAt");
  const [sortOrder, setSortOrder] = useState("desc");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);

  // Loading state for filters (separate from main loading)
  const [isFilterLoading, setIsFilterLoading] = useState(false);

  // Debounce search query
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Fetch agents with filters
  useEffect(() => {
    const fetchAgents = async () => {
      setIsFilterLoading(true);
      try {
        await dispatch(
          getAgents({
            page: currentPage,
            limit: ITEMS_PER_PAGE,
            search: debouncedSearchQuery || undefined,
            status: statusFilter !== "all" ? statusFilter : undefined,
            sortBy,
            sortOrder,
          }),
        );
      } finally {
        setIsFilterLoading(false);
      }
    };

    fetchAgents();
  }, [dispatch, currentPage, debouncedSearchQuery, statusFilter, sortBy, sortOrder]);

  // Reset to page 1 when filters change (except page itself)
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [debouncedSearchQuery, statusFilter, sortBy, sortOrder]);

  // Handle notifications
  useEffect(() => {
    if (isError) {
      toast.error(message, { id: "agent-list-status" });
      dispatch(resetAgentState());
    }
    if (isSuccess && message) {
      toast.success(message, { id: "agent-list-status" });
      dispatch(resetAgentState());
    }
  }, [isError, isSuccess, message, dispatch]);

  // Handlers
  const handleDelete = (id) => {
    setConfirmState({ isOpen: true, agentId: id });
  };

  const closeDeleteConfirm = () => {
    setConfirmState({ isOpen: false, agentId: null });
  };

  const handleConfirmDelete = async () => {
    if (!confirmState.agentId) return;
    try {
      await dispatch(deleteAgent(confirmState.agentId)).unwrap();
      // Refetch agents after delete
      setIsFilterLoading(true);
      try {
        await dispatch(
          getAgents({
            page: currentPage,
            limit: ITEMS_PER_PAGE,
            search: debouncedSearchQuery || undefined,
            status: statusFilter !== "all" ? statusFilter : undefined,
            sortBy,
            sortOrder,
          }),
        );
      } finally {
        setIsFilterLoading(false);
      }
    } finally {
      closeDeleteConfirm();
    }
  };

  const handleSearchChange = (value) => {
    setSearchQuery(value);
  };

  const handleFilterChange = (value) => {
    setStatusFilter(value);
  };

  const handleSortChange = ({ sortBy: newSortBy, sortOrder: newSortOrder }) => {
    if (newSortBy) setSortBy(newSortBy);
    if (newSortOrder) setSortOrder(newSortOrder);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const totalAgents = pagination?.total || agents.length;
  const totalPages = pagination?.totalPages || 1;
  const isInitialLoad = isLoading && agents.length === 0;
  const isFiltering = isFilterLoading && agents.length > 0;

  // Check subscription status
  const isSubscriptionExpired = (() => {
    if (user?.role !== "customer") return false;
    if (!user?.subscriptionExpiry) return true; // No subscription = expired
    const expiryDate = new Date(user.subscriptionExpiry);
    return expiryDate < new Date();
  })();

  return (
    <div className="space-y-3 animate-[fadeIn_0.5s_ease-out]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 pb-2 border-b border-[var(--color-border)]">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-[var(--color-text)]">My AI Agents</h1>
          <p className="text-[var(--color-text-muted)] text-xs mt-0.5">
            Kelola asisten AI Agent{" "}
            <span className="font-semibold text-[var(--color-primary)]">({totalAgents})</span>
          </p>
        </div>
        <Link
          to="/ai-agents/create"
          className={`btn btn-sm border-none rounded-md gap-1.5 shadow-sm normal-case px-3 h-8 ${
            isSubscriptionExpired
              ? "bg-[var(--color-text-muted)] text-white cursor-not-allowed pointer-events-none"
              : "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]"
          }`}
          onClick={(e) => {
            if (isSubscriptionExpired) {
              e.preventDefault();
              toast.error("Langganan Anda telah berakhir. Silakan hubungi administrator.", {
                id: "subscription-expired",
              });
            }
          }}
        >
          <FaPlus className="text-xs" /> Buat Agent
        </Link>
      </div>

      {/* SUBSCRIPTION WARNING */}
      <SubscriptionWarning
        subscriptionExpiry={user?.subscriptionExpiry}
        userRole={user?.role}
      />

      {/* FILTERS - Professional Design */}
      <AgentListFilters
        onSearchChange={handleSearchChange}
        onFilterChange={handleFilterChange}
        onSortChange={handleSortChange}
        filters={{
          searchQuery,
          statusFilter,
          sortBy,
          sortOrder,
        }}
        isLoading={isFiltering}
      />

      {/* CONTENT */}
      {isInitialLoad ? (
        <div className="py-8">
          <AgentListLoading type="grid" message="Memuat daftar agents..." />
        </div>
      ) : agents.length === 0 ? (
        <div className="text-center py-16 bg-[var(--color-surface)] rounded-xl border-2 border-dashed border-[var(--color-border)]">
          <div className="w-16 h-16 bg-[var(--color-primary)]/20 text-[var(--color-primary)] rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">
            <FaRobot />
          </div>
          <h3 className="font-bold text-[var(--color-text)] text-base mb-1.5">
            {searchQuery || statusFilter !== "all"
              ? "Tidak ada agent yang sesuai filter"
              : "Belum ada Agent"}
          </h3>
          <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mb-4">
            {searchQuery || statusFilter !== "all"
              ? "Coba ubah filter atau kata kunci pencarian Anda."
              : "Mulai buat AI Agent pertamamu sekarang."}
          </p>
          {!searchQuery && statusFilter === "all" && (
            <Link
              to="/ai-agents/create"
              className="btn btn-sm bg-[var(--color-primary)] text-white normal-case hover:bg-[var(--color-primary-hover)]"
            >
              Buat Sekarang
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* AGENT GRID - Clean and Proportional */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {agents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onDelete={handleDelete}
                isSubscriptionExpired={isSubscriptionExpired}
              />
            ))}
          </div>

          {/* PAGINATION */}
          {totalPages > 1 && (
            <AgentListPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalAgents}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={handlePageChange}
              isLoading={isFilterLoading}
            />
          )}
        </>
      )}

      {/* CONFIRMATION MODAL */}
      <ConfirmationModal
        isOpen={confirmState.isOpen}
        onClose={closeDeleteConfirm}
        onConfirm={handleConfirmDelete}
        title="Hapus Agent?"
        message="Yakin ingin menghapus agent ini? Data yang dihapus tidak dapat dikembalikan."
        variant="danger"
        confirmText="Hapus"
        cancelText="Batal"
      />
    </div>
  );
};

export default AgentList;
