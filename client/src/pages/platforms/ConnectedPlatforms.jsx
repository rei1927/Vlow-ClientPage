import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getPlatforms,
  createPlatform,
  updatePlatform,
  deletePlatform,
  resetPlatformState,
} from "../../features/platforms/platformSlice";
import { getAgents } from "../../features/agents/agentSlice";
import {
  FaWhatsapp,
  FaInstagram,
  FaRobot,
  FaPlus,
  FaEllipsisV,
  FaTrash,
  FaPen,
  FaExclamationTriangle,
  FaQrcode,
  FaFacebook,
} from "react-icons/fa";
import toast from "react-hot-toast";
import useDebounce from "../../hooks/useDebounce";

import PlatformModal from "../../components/platforms/PlatformModal";
import Loader from "../../components/Loader";
import ConfirmationModal from "../../components/ConfirmationModal";
import PlatformListFilters from "../../components/platforms/PlatformListFilters";
import PlatformListPagination from "../../components/platforms/PlatformListPagination";
import AgentListLoading from "../../components/agents/AgentListLoading";

const ITEMS_PER_PAGE = 9;

const ConnectedPlatforms = () => {
  const dispatch = useDispatch();
  const { platforms, isLoading, isError, message, pagination } = useSelector(
    (state) => state.platforms,
  );
  const { agents } = useSelector((state) => state.agents);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [confirmState, setConfirmState] = useState({ isOpen: false, platform: null });

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

  // Initial load agents
  useEffect(() => {
    dispatch(getAgents());
  }, [dispatch]);

  // Load FB SDK
  useEffect(() => {
    if (!window.FB) {
      window.fbAsyncInit = function () {
        window.FB.init({
          appId: "1191217912806430", // Facebook App ID
          cookie: true,
          xfbml: true,
          version: "v22.0",
        });
      };

      (function (d, s, id) {
        var js,
          fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) {
          return;
        }
        js = d.createElement(s);
        js.id = id;
        js.src = "https://connect.facebook.net/en_US/sdk.js";
        fjs.parentNode.insertBefore(js, fjs);
      })(document, "script", "facebook-jssdk");
    }
  }, []);

  // Fetch platforms with filters
  useEffect(() => {
    const fetchPlatforms = async () => {
      setIsFilterLoading(true);
      try {
        await dispatch(
          getPlatforms({
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

    fetchPlatforms();
  }, [dispatch, currentPage, debouncedSearchQuery, statusFilter, sortBy, sortOrder]);

  // Reset to page 1 when filters change (except page itself)
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [debouncedSearchQuery, statusFilter, sortBy, sortOrder]);

  // Handle notifications
  useEffect(() => {
    if (isError && message) {
      toast.error(message, { id: "platform-status" });
      dispatch(resetPlatformState());
    }
  }, [isError, message, dispatch]);

  const sendMetaCodeToBackend = async (code) => {
    try {
      console.log("Mengirim kode Meta ke backend...", code);
      const response = await fetch("/api/whatsapp/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Sukses menghubungkan WhatsApp:", data);
        toast.success("WhatsApp berhasil terhubung melalui Meta!");
        dispatch(
          getPlatforms({
            page: currentPage,
            limit: ITEMS_PER_PAGE,
            search: debouncedSearchQuery || undefined,
            status: statusFilter !== "all" ? statusFilter : undefined,
            sortBy,
            sortOrder,
          }),
        );
      } else {
        const errorText = await response.text();
        console.error("❌ Gagal menghubungkan WhatsApp:", errorText);
        toast.error("Gagal menghubungkan WhatsApp. Silakan coba lagi.");
      }
    } catch (error) {
      console.error("❌ Terjadi kesalahan saat fetch ke backend:", error);
      toast.error("Terjadi kesalahan jaringan.");
    }
  };

  const handleConnectWhatsApp = () => {
    if (typeof window.FB === "undefined") {
      toast.error("Meta SDK belum dimuat. Silakan tunggu sebentar.");
      console.error("Meta SDK belum siap.");
      return;
    }

    console.log("Membuka pop-up Meta Embedded Signup...");
    window.FB.login(
      (response) => {
        if (response.authResponse && response.authResponse.code) {
          const code = response.authResponse.code;
          console.log("✅ Login berhasil! Mendapatkan auth code:", code);
          sendMetaCodeToBackend(code);
        } else {
          console.warn("⚠️ Login dibatalkan atau pop-up ditutup oleh user.", response);
          toast.error("Login Meta dibatalkan.");
        }
      },
      {
        config_id: "3086707608181836",
        response_type: "code",
        override_default_response_type: true,
      }
    );
  };

  const handleOpenCreate = () => {
    setSelectedPlatform(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (platform) => {
    setSelectedPlatform(platform);
    setIsModalOpen(true);
  };

  const handleOpenDeleteConfirm = (platform) => {
    setConfirmState({ isOpen: true, platform });
  };

  const handleCloseDeleteConfirm = () => {
    setConfirmState({ isOpen: false, platform: null });
  };

  const handleConfirmDelete = async () => {
    if (!confirmState.platform) return;
    const resultAction = await dispatch(deletePlatform(confirmState.platform.id));
    if (deletePlatform.fulfilled.match(resultAction)) {
      toast.success("Koneksi berhasil dihapus", { id: "platform-delete-success" });
      handleCloseDeleteConfirm();
      // Refetch platforms after deletion
      dispatch(
        getPlatforms({
          page: currentPage,
          limit: ITEMS_PER_PAGE,
          search: debouncedSearchQuery || undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
          sortBy,
          sortOrder,
        }),
      );
    }
  };

  const handleConnectFB = () => {
    if (!window.FB) {
      toast.error("Facebook SDK belum dimuat atau masih loading");
      return;
    }
    window.FB.login(
      (response) => {
        if (response.authResponse) {
          console.log("FB Login Success", response.authResponse);
          toast.success("Berhasil login FB Page!");
          // TODO: Send response.authResponse.code to your backend
        } else {
          toast.error("Login Facebook dibatalkan atau gagal");
        }
      },
      {
        config_id: "3086707608181836",
        response_type: "code",
        override_default_response_type: true,
        extras: {
          setup: {},
          featureType: "",
          sessionInfoVersion: "3",
        },
      }
    );
  };

  // Handler Create/Update
  const handleModalSubmit = async (formData) => {
    if (selectedPlatform) {
      const resultAction = await dispatch(
        updatePlatform({ id: selectedPlatform.id, platformData: formData }),
      );
      if (updatePlatform.fulfilled.match(resultAction)) {
        toast.success("Konfigurasi berhasil diperbarui", { id: "platform-update-success" });
      }
      return null;
    } else {
      const resultAction = await dispatch(createPlatform(formData));
      if (createPlatform.fulfilled.match(resultAction)) {
        const created = resultAction.payload.data;
        setSelectedPlatform(created);
        toast.success("Koneksi berhasil ditambahkan", { id: "platform-create-success" });
        // Refetch platforms after creation
        dispatch(
          getPlatforms({
            page: currentPage,
            limit: ITEMS_PER_PAGE,
            search: debouncedSearchQuery || undefined,
            status: statusFilter !== "all" ? statusFilter : undefined,
            sortBy,
            sortOrder,
          }),
        );
        return created;
      }
      return null;
    }
  };

  // Check if initial load
  const isInitialLoad = isLoading && platforms.length === 0;
  const isFiltering = isFilterLoading || (isLoading && platforms.length > 0);

  // Helper untuk Status Badge
  const getStatusBadge = (status) => {
    switch (status) {
      case "WORKING":
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-600 text-xs font-bold border border-green-100">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            CONNECTED
          </div>
        );
      case "SCANNING":
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-50 text-yellow-600 text-xs font-bold border border-yellow-100">
            <FaQrcode className="animate-pulse" /> SCAN QR
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--color-border)] text-[var(--color-text-muted)] text-xs font-bold border border-[var(--color-border)]">
            <FaExclamationTriangle /> {status}
          </div>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[var(--color-border)] pb-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[var(--color-text)] tracking-tight">
            Connected Platforms
          </h1>
          <p className="text-[var(--color-text-muted)] mt-1 text-sm">
            Kelola koneksi WhatsApp agar terhubung dengan AI Agent.
            {pagination?.total !== undefined && (
              <span className="ml-2 font-medium text-[var(--color-text)]">
                ({pagination.total} platform)
              </span>
            )}
          </p>
        </div>
        <div className="dropdown dropdown-end">
          <label
            tabIndex={0}
            className="btn btn-sm bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white border-none shadow-lg rounded-xl gap-2 px-4 h-9"
          >
            <FaPlus size={14} /> Koneksi Platform
          </label>
          <ul
            tabIndex={0}
            className="dropdown-content z-[1] menu p-2 shadow-lg bg-[var(--color-surface)] rounded-xl w-52 border border-[var(--color-border)] mt-2"
          >
            <li>
              <a
                onClick={handleConnectWhatsApp}
                className="gap-2 font-medium text-[var(--color-text)] hover:bg-[var(--color-bg)]"
              >
                <FaWhatsapp className="text-green-500 text-lg" /> Connect WhatsApp
              </a>
            </li>
            <li>
              <a
                onClick={handleConnectFB}
                className="gap-2 font-medium text-[var(--color-text)] hover:bg-[var(--color-bg)]"
              >
                <FaFacebook className="text-blue-500 text-lg" /> Connect FB Page (Embed Login)
              </a>
            </li>
            <li>
              <a
                onClick={() => toast.success("Fitur Instagram akan segera hadir!", { icon: "🚀" })}
                className="gap-2 font-medium text-[var(--color-text)] hover:bg-[var(--color-bg)]"
              >
                <FaInstagram className="text-pink-500 text-lg" /> Connect Instagram
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* FILTERS - Professional Design */}
      <PlatformListFilters
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
      />

      {/* CONTENT */}
      {isInitialLoad ? (
        <div className="py-8">
          <AgentListLoading type="grid" message="Memuat platform..." />
        </div>
      ) : platforms.length === 0 ? (
        // EMPTY STATE
        <div className="flex flex-col items-center justify-center py-20 bg-[var(--color-surface)] border-2 border-dashed border-[var(--color-border)] rounded-3xl text-center">
          <div className="w-20 h-20 bg-[var(--color-primary)]/20 text-[var(--color-primary)] rounded-full flex items-center justify-center mb-6">
            <FaWhatsapp size={40} />
          </div>
          <h3 className="text-xl font-bold text-[var(--color-text)]">
            {searchQuery || statusFilter !== "all"
              ? "Tidak ada platform yang sesuai filter"
              : "Belum ada Platform Terhubung"}
          </h3>
          <p className="text-[var(--color-text-muted)] mt-2 max-w-md text-sm">
            {searchQuery || statusFilter !== "all"
              ? "Coba ubah filter atau kata kunci pencarian Anda."
              : "Hubungkan platform anda dengan AI Agent untuk memulai bekerja."}
          </p>
          {(!searchQuery && statusFilter === "all") && (
            <div className="dropdown dropdown-center mt-6">
              <label
                tabIndex={0}
                className="btn btn-outline border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-border)]/30 rounded-xl px-8 gap-2"
              >
                <FaPlus size={14} /> Mulai Koneksi
              </label>
              <ul
                tabIndex={0}
                className="dropdown-content z-[1] menu p-2 shadow-lg bg-[var(--color-surface)] rounded-xl w-52 border border-[var(--color-border)] mt-2"
              >
                <li>
                  <a
                    onClick={handleConnectWhatsApp}
                    className="gap-2 font-medium text-[var(--color-text)] hover:bg-[var(--color-bg)]"
                  >
                    <FaWhatsapp className="text-green-500 text-lg" /> Connect WhatsApp
                  </a>
                </li>
                <li>
                  <a
                    onClick={handleConnectFB}
                    className="gap-2 font-medium text-[var(--color-text)] hover:bg-[var(--color-bg)]"
                  >
                    <FaFacebook className="text-blue-500 text-lg" /> Connect FB Page (Embed Login)
                  </a>
                </li>
                <li>
                  <a
                    onClick={() => toast.success("Fitur Instagram akan segera hadir!", { icon: "🚀" })}
                    className="gap-2 font-medium text-[var(--color-text)] hover:bg-[var(--color-bg)]"
                  >
                    <FaInstagram className="text-pink-500 text-lg" /> Connect Instagram
                  </a>
                </li>
              </ul>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* CARD GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {platforms.map((pf) => (
              <div
                key={pf.id}
                className="group relative bg-[var(--color-surface)] rounded-2xl p-6 border border-[var(--color-border)] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${pf.status === "WORKING"
                        ? "bg-gradient-to-br from-green-400 to-green-600 text-white"
                        : "bg-[var(--color-border)] text-[var(--color-text-muted)]"
                        }`}
                    >
                      <FaWhatsapp size={28} />
                    </div>
                    <div>
                      <h3 className="font-bold text-[var(--color-text)] truncate max-w-[150px]">{pf.name}</h3>
                      <div className="mt-1">{getStatusBadge(pf.status)}</div>
                    </div>
                  </div>

                  {/* Actions Dropdown */}
                  <div className="dropdown dropdown-end">
                    <label
                      tabIndex={0}
                      className="btn btn-ghost btn-xs btn-circle text-[var(--color-text-muted)] hover:bg-[var(--color-border)]"
                    >
                      <FaEllipsisV />
                    </label>
                    <ul
                      tabIndex={0}
                      className="dropdown-content z-[1] menu p-2 shadow-lg bg-[var(--color-surface)] rounded-xl w-40 border border-[var(--color-border)] mt-2"
                    >
                      <li>
                        <a
                          onClick={() => handleOpenEdit(pf)}
                          className="gap-2 font-medium text-[var(--color-text)]"
                        >
                          <FaPen className="text-xs" /> Edit
                        </a>
                      </li>
                      <li>
                        <a
                          onClick={() => handleOpenDeleteConfirm(pf)}
                          className="gap-2 text-red-600 hover:bg-red-50 font-medium"
                        >
                          <FaTrash className="text-xs" /> Hapus
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Card Body */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-border)] transition-colors group-hover:bg-[var(--color-primary)]/5 group-hover:border-[var(--color-primary)]/20">
                    <div className="flex items-center gap-2 text-[var(--color-text-muted)] text-sm">
                      <FaRobot className="text-[var(--color-primary)]" />
                      <span className="font-medium">AI Agent</span>
                    </div>
                    <span className="text-sm font-bold text-[var(--color-text)] truncate max-w-[120px]">
                      {pf.Agent ? (
                        pf.Agent.name
                      ) : (
                        <span className="text-red-400 text-xs italic">Belum Dipilih</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="mt-5 pt-4 border-t border-[var(--color-border)] flex justify-between items-center text-xs text-[var(--color-text-muted)]">
                  <span className="font-mono bg-[var(--color-bg)] px-2 py-1 rounded text-[10px]">
                    {pf.sessionId?.substring(0, 8)}...
                  </span>
                  {pf.status === "SCANNING" && (
                    <button
                      onClick={() => handleOpenEdit(pf)}
                      className="text-[var(--color-primary)] hover:underline font-bold cursor-pointer text-xs flex items-center gap-1"
                    >
                      Lanjut Scan <FaQrcode />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* PAGINATION */}
          {pagination && pagination.totalPages > 1 && (
            <PlatformListPagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              itemsPerPage={pagination.limit}
              onPageChange={setCurrentPage}
              isLoading={isFiltering}
            />
          )}
        </>
      )}

      {/* MODAL WIZARD */}
      <PlatformModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        initialData={selectedPlatform}
        agents={agents}
      />

      <ConfirmationModal
        isOpen={confirmState.isOpen}
        onClose={handleCloseDeleteConfirm}
        onConfirm={handleConfirmDelete}
        title="Hapus koneksi?"
        message={`Koneksi ${confirmState.platform?.name || "ini"} akan dihapus permanen. Lanjutkan?`}
        variant="danger"
        confirmText="Ya, Hapus"
        cancelText="Batal"
        isLoading={isLoading}
      />
    </div>
  );
};

export default ConnectedPlatforms;
