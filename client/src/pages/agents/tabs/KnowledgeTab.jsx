import { useState } from "react";
import { useDispatch } from "react-redux";
// Import updateKnowledge
import {
  addKnowledge,
  updateKnowledge,
  deleteKnowledge,
} from "../../../features/agents/agentSlice";
import { FaPlus, FaTrash, FaEdit, FaBook, FaSave, FaTimes, FaLink } from "react-icons/fa";
import toast from "react-hot-toast";
import RichTextEditor from "../../../components/common/RichTextEditor";
import ConfirmationModal from "../../../components/ConfirmationModal";

const KnowledgeTab = ({
  agentId,
  isEditMode,
  knowledgeSources,
  pendingKnowledge,
  onAddPending,
  onRemovePending,
}) => {
  const dispatch = useDispatch();

  const [formState, setFormState] = useState({
    id: null,
    title: "",
    content: "",
    tempId: null,
  });

  const [isUploading, setIsUploading] = useState(false);
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    item: null,
  });

  const resetForm = () => {
    setFormState({ id: null, title: "", content: "", tempId: null });
    // Helper untuk clear state RichTextEditor jika perlu (opsional)
  };

  const handleSubmit = async () => {
    const { title, content } = formState;

    if (!title.trim()) return toast.error("Judul Knowledge wajib diisi.");
    const textOnly = content.replace(/<[^>]*>/g, "").trim();
    if (!textOnly && !content.includes("<img")) return toast.error("Konten tidak boleh kosong.");

    setIsUploading(true);

    try {
      // A. JIKA AGENT SUDAH ADA DI SERVER (Edit Mode Agent)
      if (isEditMode) {
        // PERBAIKAN: Gunakan Object biasa (JSON), JANGAN pakai new FormData()
        const payload = {
          title: title,
          description: content, // Ini string HTML panjang
        };

        // 1. UPDATE EXISTING RESOURCE
        if (formState.id) {
          await dispatch(
            updateKnowledge({
              knowledgeId: formState.id,
              knowledgeData: payload,
            }),
          ).unwrap();
          toast.success("Resource berhasil diperbarui!");
        }
        // 2. ADD NEW RESOURCE
        else {
          await dispatch(
            addKnowledge({
              agentId: agentId,
              knowledgeData: payload,
            }),
          ).unwrap();
          toast.success("Resource baru disimpan!");
        }
      }

      // B. JIKA SEDANG MEMBUAT AGENT BARU (Pending Queue)
      else {
        if (formState.tempId) {
          onRemovePending(formState.tempId);
        }
        onAddPending({
          tempId: Date.now(),
          title: title,
          description: content,
        });
        toast.success(
          formState.tempId ? "Resource diupdate di antrian!" : "Ditambahkan ke antrian.",
        );
      }

      resetForm();
    } catch (err) {
      console.error(err);
      toast.error("Gagal menyimpan data.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleEdit = (item, isPending = false) => {
    setFormState({
      id: isPending ? null : item.id,
      tempId: isPending ? item.tempId : null,
      title: item.title || "",
      content: item.description || "",
    });
    window.scrollTo({ top: 150, behavior: "smooth" });
  };

  const openDeleteConfirm = (item) => {
    setConfirmState({ isOpen: true, item });
  };

  const closeDeleteConfirm = () => {
    setConfirmState({ isOpen: false, item: null });
  };

  const handleConfirmDelete = async () => {
    if (!confirmState.item) return;
    try {
      await dispatch(deleteKnowledge(confirmState.item.id)).unwrap();
      toast.success("Resource berhasil dihapus.", { id: "knowledge-delete" });
    } catch (err) {
      console.error(err);
      toast.error("Gagal menghapus resource.", { id: "knowledge-delete" });
    } finally {
      closeDeleteConfirm();
    }
  };

  return (
    <div className="space-y-8 animate-fade-in w-full">
      {/* === FORM INPUT === */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-sm overflow-hidden">
        {/* Header Form */}
        <div
          className={`px-6 py-4 border-b flex justify-between items-center ${formState.id || formState.tempId ? "bg-[var(--color-surface)] border-amber-200 dark:border-amber-800" : "bg-[var(--color-surface)] border-emerald-200 dark:border-emerald-800"} border-[var(--color-border)]`}
        >
          <div
            className={`flex items-center gap-2 ${formState.id || formState.tempId ? "text-amber-700 dark:text-amber-300" : "text-emerald-700 dark:text-emerald-300"}`}
          >
            {formState.id || formState.tempId ? <FaEdit /> : <FaBook />}
            <h3 className="font-bold text-sm">
              {formState.id || formState.tempId ? "Mode Edit Resource" : "Tambah Resource Baru"}
            </h3>
          </div>
          {(formState.id || formState.tempId) && (
            <button
              onClick={resetForm}
              className="text-xs text-red-500 hover:underline flex items-center gap-1 font-semibold"
            >
              <FaTimes /> Batal
            </button>
          )}
        </div>

        <div className="p-6 space-y-5">
          {/* Input Judul */}
          <div className="form-control">
            <label className="label-text text-xs font-bold text-[var(--color-text)] mb-1">
              Judul Topik <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="input input-bordered w-full rounded-lg bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
              placeholder="Contoh: Prosedur Pengembalian Barang..."
              value={formState.title}
              onChange={(e) => setFormState((prev) => ({ ...prev, title: e.target.value }))}
            />
          </div>

          {/* Rich Text Editor */}
          <div className="form-control">
            <div className="flex justify-between mb-1">
              <label className="label-text text-xs font-bold text-[var(--color-text)]">
                Konten Pengetahuan
              </label>
            </div>

            <RichTextEditor
              value={formState.content}
              onChange={(val) => setFormState((prev) => ({ ...prev, content: val }))}
              placeholder="Tulis informasi detail di sini. Sisipkan gambar jika perlu..."
            />
          </div>

          {/* Button Simpan */}
          <div className="flex justify-end pt-2">
            <button
              onClick={handleSubmit}
              disabled={isUploading}
              className={`btn btn-sm text-white border-none rounded-lg px-8 gap-2
                        ${formState.id || formState.tempId ? "bg-orange-500 hover:bg-orange-600" : "bg-[#059669] hover:bg-[#047857]"}
                    `}
            >
              {isUploading ? (
                <span className="loading loading-spinner loading-xs"></span>
              ) : (
                <FaSave />
              )}
              {formState.id || formState.tempId ? "Update Resource" : "Simpan Resource"}
            </button>
          </div>
        </div>
      </div>

      {/* === LIST DATA === */}
      <div className="space-y-4">
        <h4 className="font-bold text-[var(--color-text)] text-sm flex items-center gap-2 border-b border-[var(--color-border)] pb-2">
          <span className="badge badge-neutral badge-sm">
            {knowledgeSources?.length + pendingKnowledge?.length || 0}
          </span>
          Daftar Knowledge Resources
        </h4>

        <div className="grid grid-cols-1 gap-4">
          {/* A. Pending Items */}
          {pendingKnowledge?.map((item) => (
            <div
              key={item.tempId}
              className="group relative bg-[var(--color-surface)] border border-amber-200 dark:border-amber-700 rounded-xl p-5 hover:shadow-md transition-all"
            >
              <div className="badge badge-warning text-[10px] absolute top-3 right-3 font-bold">
                Pending
              </div>
              <h5 className="font-bold text-[var(--color-text)] mb-2">{item.title}</h5>
              <div
                className="text-sm text-[var(--color-text-muted)] line-clamp-2 mb-4"
                dangerouslySetInnerHTML={{ __html: item.description }}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(item, true)}
                  className="btn btn-xs btn-outline btn-warning gap-1"
                >
                  <FaEdit /> Edit
                </button>
                <button
                  onClick={() => onRemovePending(item.tempId)}
                  className="btn btn-xs btn-ghost text-red-500"
                >
                  <FaTrash /> Hapus
                </button>
              </div>
            </div>
          ))}

          {/* B. Server Items */}
          {knowledgeSources?.map((item) => (
            <div
              key={item.id}
              className="group bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5 hover:border-[var(--color-primary)] hover:shadow-md transition-all"
            >
              <div className="flex justify-between items-start mb-2">
                <h5 className="font-bold text-[var(--color-text)] text-base">{item.title || "Untitled"}</h5>
                <span className="text-[10px] font-mono text-[var(--color-text-muted)]">
                  ID: {item.id.substring(0, 6)}
                </span>
              </div>
              <div
                className="text-sm text-[var(--color-text-muted)] line-clamp-2 mb-4 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: item.description }}
              />

              <div className="flex items-center gap-3 pt-2 border-t border-[var(--color-border)] mt-2">
                <button
                  onClick={() => handleEdit(item, false)} // False = Server item
                  className="flex items-center gap-1 text-xs font-semibold text-[var(--color-primary)] hover:opacity-80 hover:underline"
                >
                  <FaEdit /> Edit
                </button>
                <span className="text-[var(--color-border)]">|</span>
                <button
                  onClick={() => openDeleteConfirm(item)}
                  className="flex items-center gap-1 text-xs font-semibold text-[var(--color-text-muted)] hover:text-red-500 hover:underline"
                >
                  <FaTrash /> Hapus Permanen
                </button>
              </div>
            </div>
          ))}

          {!knowledgeSources?.length && !pendingKnowledge?.length && (
            <div className="text-center py-10 bg-[var(--color-surface)] rounded-xl border border-dashed border-[var(--color-border)] text-[var(--color-text-muted)]">
              <p>Belum ada data knowledge.</p>
            </div>
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={confirmState.isOpen}
        onClose={closeDeleteConfirm}
        onConfirm={handleConfirmDelete}
        title="Hapus Knowledge?"
        message={
          confirmState.item?.title
            ? `Kamu yakin ingin menghapus "${confirmState.item.title}"?`
            : "Kamu yakin ingin menghapus resource ini?"
        }
        variant="danger"
        confirmText="Hapus"
        cancelText="Batal"
      />
    </div>
  );
};

export default KnowledgeTab;
