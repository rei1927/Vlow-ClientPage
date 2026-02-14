import { useEffect, useState, useCallback } from "react"; // 1. Import useCallback
import { useDispatch, useSelector } from "react-redux";
import {
  fetchUsers,
  createNewUser,
  updateExistingUser,
  removeUser,
  resetUserState,
} from "../features/users/userSlice";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaCheckCircle,
  FaBan,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaCalendarTimes,
  FaExclamationTriangle,
} from "react-icons/fa";
import toast from "react-hot-toast";
import { updateUserSession } from "../features/auth/authSlice";

// Import Komponen Modular
import Loader from "../components/Loader";
import ConfirmationModal from "../components/ConfirmationModal";
import TableSearch from "../components/TableSearch";
import TableFilter from "../components/TableFilter";
import Pagination from "../components/Pagination";
import UserFormModal from "../components/users/UserFormModal";

const UserList = () => {
  const dispatch = useDispatch();
  const { users, pagination, isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.users,
  );
  const { user: currentUser } = useSelector((state) => state.auth);

  // State Params
  const [params, setParams] = useState({
    page: 1,
    limit: 10,
    search: "",
    role: "",
    sortBy: "createdAt",
    order: "DESC",
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Fetch Data
  useEffect(() => {
    dispatch(fetchUsers(params));
  }, [dispatch, params]);

  // Handle Notifications
  useEffect(() => {
    if (isError && message) {
      toast.error(message);
      dispatch(resetUserState());
    }
    if (isSuccess && message) {
      toast.success(message);
      dispatch(resetUserState());
      setIsFormOpen(false);
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
    }
  }, [isError, isSuccess, message, dispatch]);

  // --- HANDLERS (DIBUNGKUS useCallback) ---
  // Gunakan useCallback agar fungsi tidak dire-create setiap render
  // Ini mencegah TableSearch memicu loop useEffect

  const handleSearch = useCallback((term) => {
    setParams((prev) => {
      // Cek agar tidak set state jika value sama (Optional optimization)
      if (prev.search === term) return prev;
      return { ...prev, search: term, page: 1 };
    });
  }, []);

  const handleFilterRole = useCallback((role) => {
    setParams((prev) => ({ ...prev, role: role, page: 1 }));
  }, []);

  const handlePageChange = useCallback((newPage) => {
    setParams((prev) => ({ ...prev, page: newPage }));
  }, []);

  const handleSort = useCallback((field) => {
    setParams((prev) => ({
      ...prev,
      sortBy: field,
      order: prev.sortBy === field && prev.order === "ASC" ? "DESC" : "ASC",
    }));
  }, []);

  // Helper Icon Sort
  const getSortIcon = (field) => {
    if (params.sortBy !== field) return <FaSort className="text-[var(--color-text-muted)]" />;
    return params.order === "ASC" ? (
      <FaSortUp className="text-[var(--color-primary)]" />
    ) : (
      <FaSortDown className="text-[var(--color-primary)]" />
    );
  };

  // CRUD Actions
  const handleCreate = (data) => dispatch(createNewUser(data));
  const handleUpdate = (data) => {
    // Gunakan .unwrap() agar kita bisa menjalankan kode TEPAT setelah sukses
    dispatch(updateExistingUser({ id: selectedUser.id, userData: data }))
      .unwrap()
      .then((updatedUserPayload) => {
        // updatedUserPayload biasanya berisi response full: { success: true, data: { ... } }
        // Sesuaikan dengan struktur return backend Anda.

        const updatedData = updatedUserPayload.data || updatedUserPayload; // Safety check

        // CEK: Apakah User yang diedit == User yang sedang login?
        if (currentUser && currentUser.id === selectedUser.id) {
          // Update Session & LocalStorage
          dispatch(updateUserSession(updatedData));
        }

        // Tutup modal & reset state (sudah ditangani useEffect isSuccess, tapi bisa juga disini)
        setIsFormOpen(false);
        setSelectedUser(null);
      })
      .catch((err) => {
        // Error handled by useEffect toast
        console.error("Gagal update:", err);
      });
  };
  const handleDelete = () => dispatch(removeUser(selectedUser.id));

  return (
    <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">User Management</h1>
          <p className="text-[var(--color-text-muted)] text-sm">Kelola akses sistem secara terpusat.</p>
        </div>
        <button
          onClick={() => {
            setSelectedUser(null);
            setIsFormOpen(true);
          }}
          className="btn bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white border-none rounded-xl normal-case gap-2 shadow-lg"
        >
          <FaPlus /> Tambah User
        </button>
      </div>

      <div className="bg-[var(--color-surface)] p-4 rounded-2xl shadow-sm border border-[var(--color-border)] flex flex-col md:flex-row gap-4">
        <TableSearch onSearch={handleSearch} placeholder="Cari nama atau email..." />
        <TableFilter
          label="Semua Role"
          value={params.role}
          onChange={handleFilterRole}
          options={[
            { value: "admin", label: "Admin" },
            { value: "customer", label: "Customer" },
          ]}
        />
      </div>

      <div className="bg-[var(--color-surface)] rounded-2xl shadow-sm border border-[var(--color-border)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full min-w-175">
            <thead className="bg-[var(--color-bg)] text-[var(--color-text-muted)] font-bold uppercase text-xs border-b border-[var(--color-border)]">
              <tr>
                <th
                  className="py-4 pl-6 cursor-pointer hover:bg-[var(--color-border)]/50 transition-colors"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center gap-2">User Info {getSortIcon("name")}</div>
                </th>
                <th
                  className="cursor-pointer hover:bg-[var(--color-border)]/50 transition-colors"
                  onClick={() => handleSort("role")}
                >
                  <div className="flex items-center gap-2">Role {getSortIcon("role")}</div>
                </th>
                <th>Status</th>
                <th
                  className="cursor-pointer hover:bg-[var(--color-border)]/50 transition-colors"
                  onClick={() => handleSort("createdAt")}
                >
                  <div className="flex items-center gap-2">
                    Bergabung {getSortIcon("createdAt")}
                  </div>
                </th>
                <th
                  className="cursor-pointer hover:bg-[var(--color-border)]/50 transition-colors"
                  onClick={() => handleSort("subscriptionExpiry")}
                >
                  <div className="flex items-center gap-2">
                    Masa Berlaku {getSortIcon("subscriptionExpiry")}
                  </div>
                </th>
                <th className="text-center pr-6">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="py-12">
                    <Loader type="block" text="Sedang memuat data users..." />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-[var(--color-text-muted)] italic">
                    Tidak ada data user yang ditemukan.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-[var(--color-border)] hover:bg-[var(--color-border)]/30 transition-colors"
                  >
                    <td className="py-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="avatar placeholder">
                          <div className="bg-[var(--color-primary)]/20 text-[var(--color-primary)] rounded-full w-10 h-10 flex items-center justify-center font-bold text-sm">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div>
                          <div className="font-bold text-[var(--color-text)]">{user.name}</div>
                          <div className="text-xs text-[var(--color-text-muted)]">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`badge border-none font-bold capitalize py-3 ${user.role === "admin" ? "bg-purple-100 text-purple-600" : "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"}`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td>
                      {user.isActive ? (
                        <div className="flex items-center gap-1 text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded-lg w-fit">
                          <FaCheckCircle /> Active
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-red-500 text-xs font-bold bg-red-50 px-2 py-1 rounded-lg w-fit">
                          <FaBan /> Inactive
                        </div>
                      )}
                    </td>
                    <td className="text-sm text-[var(--color-text-muted)]">
                      {new Date(user.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td>
                      {user.role === "customer" ? (
                        user.subscriptionExpiry ? (
                          (() => {
                            const expiryDate = new Date(user.subscriptionExpiry);
                            const now = new Date();
                            const isExpired = expiryDate < now;
                            const daysUntilExpiry = Math.ceil(
                              (expiryDate - now) / (1000 * 60 * 60 * 24),
                            );

                            return (
                              <div className="flex flex-col gap-1">
                                <div
                                  className={`text-xs font-semibold ${
                                    isExpired ? "text-red-600" : daysUntilExpiry <= 7 ? "text-yellow-600" : "text-green-600"
                                  }`}
                                >
                                  {expiryDate.toLocaleDateString("id-ID", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </div>
                                <div
                                  className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded w-fit ${
                                    isExpired
                                      ? "bg-red-50 text-red-600"
                                      : daysUntilExpiry <= 7
                                        ? "bg-yellow-50 text-yellow-600"
                                        : "bg-green-50 text-green-600"
                                  }`}
                                >
                                  {isExpired ? (
                                    <>
                                      <FaExclamationTriangle /> Habis
                                    </>
                                  ) : daysUntilExpiry <= 7 ? (
                                    <>
                                      <FaCalendarTimes /> {daysUntilExpiry} hari lagi
                                    </>
                                  ) : (
                                    <>
                                      <FaCheckCircle /> Aktif
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })()
                        ) : (
                          <div className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded w-fit">
                            <FaExclamationTriangle /> Belum Diaktifkan
                          </div>
                        )
                      ) : (
                        <span className="text-xs text-[var(--color-text-muted)] italic">-</span>
                      )}
                    </td>
                    <td className="pr-6">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setIsFormOpen(true);
                          }}
                          className="btn btn-sm btn-square btn-ghost text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setIsDeleteModalOpen(true);
                          }}
                          className="btn btn-sm btn-square btn-ghost text-gray-500 hover:text-red-500 hover:bg-red-50"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {!isLoading && users.length > 0 && pagination && (
          <Pagination
            currentPage={pagination?.currentPage || 1}
            totalPages={pagination?.totalPages || 1}
            totalData={pagination?.totalItems || 0}
            onPageChange={handlePageChange}
          />
        )}
      </div>

      {/* --- MODALS --- */}
      <UserFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={selectedUser ? handleUpdate : handleCreate}
        initialData={selectedUser}
        isLoading={isLoading}
      />

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Hapus User?"
        message={`Apakah Anda yakin ingin menghapus user "${selectedUser?.name}"? Data yang dihapus tidak dapat dikembalikan.`}
        variant="danger" // Merah (Visual)
        confirmText="Hapus" // Teks Tombol Khusus Delete
        cancelText="Batal"
        isLoading={isLoading}
      />
    </div>
  );
};

export default UserList;
