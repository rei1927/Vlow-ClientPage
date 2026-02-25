import { useState, useRef } from "react";
import { useDispatch } from "react-redux";
import {
  addKnowledge,
  updateKnowledge,
  deleteKnowledge,
} from "../../../features/agents/agentSlice";
import { FaPlus, FaTrash, FaEdit, FaBook, FaSave, FaTimes, FaCloudUploadAlt, FaFilePdf, FaImage, FaDownload } from "react-icons/fa";
import toast from "react-hot-toast";
import RichTextEditor from "../../../components/common/RichTextEditor";
import ConfirmationModal from "../../../components/ConfirmationModal";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const KnowledgeTab = ({
  agentId,
  isEditMode,
  knowledgeSources,
  pendingKnowledge,
  onAddPending,
  onRemovePending,
}) => {
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);

  const [formState, setFormState] = useState({
    id: null,
    title: "",
    content: "",
    tempId: null,
    file: null,         // File object for upload
    existingFileUrl: null,
    existingFileName: null,
    existingFileType: null,
  });

  const [isUploading, setIsUploading] = useState(false);
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    item: null,
  });

  const resetForm = () => {
    setFormState({
      id: null, title: "", content: "", tempId: null,
      file: null, existingFileUrl: null, existingFileName: null, existingFileType: null,
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error("File terlalu besar! Maksimal 5MB.");
      e.target.value = "";
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      toast.error("Format tidak didukung! Upload gambar atau PDF saja.");
      e.target.value = "";
      return;
    }

    setFormState((prev) => ({ ...prev, file }));
  };

  const removeFile = () => {
    setFormState((prev) => ({
      ...prev,
      file: null,
      existingFileUrl: null,
      existingFileName: null,
      existingFileType: null,
    }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    const { title, content, file } = formState;

    if (!title.trim()) return toast.error("Judul Knowledge wajib diisi.");
    const textOnly = content.replace(/<[^>]*>/g, "").trim();
    if (!textOnly && !content.includes("<img")) return toast.error("Konten tidak boleh kosong.");

    setIsUploading(true);

    try {
      // Build FormData
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", content);
      if (file) {
        formData.append("file", file);
      }

      if (isEditMode) {
        if (formState.id) {
          // UPDATE existing knowledge
          await dispatch(
            updateKnowledge({
              knowledgeId: formState.id,
              knowledgeData: formData,
            }),
          ).unwrap();
          toast.success("Resource berhasil diperbarui!");
        } else {
          // ADD new knowledge
          await dispatch(
            addKnowledge({
              agentId: agentId,
              knowledgeData: formData,
            }),
          ).unwrap();
          toast.success("Resource baru disimpan!");
        }
      } else {
        // Pending queue (create agent mode)
        if (formState.tempId) {
          onRemovePending(formState.tempId);
        }
        onAddPending({
          tempId: Date.now(),
          title: title,
          description: content,
          file: file, // Keep file ref for later upload
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
      file: null,
      existingFileUrl: item.fileUrl || null,
      existingFileName: item.fileName || null,
      existingFileType: item.fileType || null,
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
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

  // Render file preview thumbnail
  const renderFilePreview = (fileUrl, fileName, fileType, isSmall = false) => {
    if (!fileUrl) return null;

    // Determine type safely
    let isImage = false;
    let isPdf = false;

    if (fileType) {
      isImage = fileType.startsWith("image/");
      isPdf = fileType === "application/pdf";
    } else if (fileName) {
      // Fallback to extension check if fileType is somehow missing
      const ext = fileName.split('.').pop()?.toLowerCase();
      isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(ext);
      isPdf = ext === "pdf";
    } else if (fileUrl) {
      // Last resort fallback using URL extension
      const ext = fileUrl.split('?')[0].split('.').pop()?.toLowerCase();
      isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(ext);
      isPdf = ext === "pdf";
    }

    const size = isSmall ? "w-12 h-12" : "w-20 h-20";

    return (
      <div className={`${size} rounded-lg overflow-hidden border border-[var(--color-border)] bg-[var(--color-bg)] flex items-center justify-center flex-shrink-0`}>
        {isImage ? (
          <img src={fileUrl} alt={fileName || "Knowledge Image"} className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/150?text=Image+Error'; }} />
        ) : isPdf ? (
          <FaFilePdf className="text-red-500" size={isSmall ? 20 : 28} />
        ) : (
          <span className="text-xs text-gray-400">File</span>
        )}
      </div>
    );
  };

  // Current file display in form (either selected or existing)
  const currentFile = formState.file;
  const hasExistingFile = formState.existingFileUrl && !currentFile;

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

          {/* === FILE UPLOAD === */}
          <div className="form-control">
            <label className="label-text text-xs font-bold text-[var(--color-text)] mb-1">
              Lampiran File <span className="text-[var(--color-text-muted)] font-normal">(Opsional — Gambar atau PDF, maks 5MB)</span>
            </label>

            {/* Upload area */}
            {!currentFile && !hasExistingFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[var(--color-border)] rounded-xl p-6 text-center cursor-pointer
                           hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 transition-all group"
              >
                <FaCloudUploadAlt className="mx-auto text-3xl text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)] mb-2 transition-colors" />
                <p className="text-sm text-[var(--color-text-muted)]">
                  Klik untuk upload atau <span className="text-[var(--color-primary)] font-semibold">browse file</span>
                </p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">
                  JPG, PNG, PDF • Maks 5MB
                </p>
              </div>
            ) : (
              // File Preview
              <div className="flex items-center gap-3 p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]">
                {currentFile ? (
                  <>
                    {/* New file preview */}
                    <div className="w-12 h-12 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-center flex-shrink-0">
                      {currentFile.type.startsWith("image/") ? (
                        <img src={URL.createObjectURL(currentFile)} alt="" className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <FaFilePdf className="text-red-500" size={22} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--color-text)] truncate">{currentFile.name}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {(currentFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </>
                ) : hasExistingFile ? (
                  <>
                    {renderFilePreview(formState.existingFileUrl, formState.existingFileName, formState.existingFileType, true)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--color-text)] truncate">{formState.existingFileName}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">File tersimpan</p>
                    </div>
                  </>
                ) : null}

                <div className="flex gap-1">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="btn btn-xs btn-ghost text-[var(--color-primary)]"
                    title="Ganti file"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={removeFile}
                    className="btn btn-xs btn-ghost text-red-500"
                    title="Hapus file"
                  >
                    <FaTimes />
                  </button>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileChange}
              className="hidden"
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
            {(knowledgeSources?.length || 0) + (pendingKnowledge?.length || 0)}
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
              <div className="flex gap-4">
                {/* File Thumbnail */}
                {item.fileUrl && (
                  <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" title={item.fileName}>
                    {renderFilePreview(item.fileUrl, item.fileName, item.fileType, false)}
                  </a>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-2">
                    <h5 className="font-bold text-[var(--color-text)] text-base">{item.title || "Untitled"}</h5>
                    <span className="text-[10px] font-mono text-[var(--color-text-muted)]">
                      ID: {item.id.substring(0, 6)}
                    </span>
                  </div>

                  <div
                    className="text-sm text-[var(--color-text-muted)] line-clamp-2 mb-2 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: item.description }}
                  />

                  {/* File info badge */}
                  {item.fileUrl && (
                    <div className="flex items-center gap-2 mb-2">
                      <a
                        href={item.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-colors"
                      >
                        {item.fileType?.startsWith("image/") ? <FaImage size={10} /> : <FaFilePdf size={10} />}
                        <span className="truncate max-w-[150px]">{item.fileName}</span>
                        <FaDownload size={9} />
                      </a>
                    </div>
                  )}

                  <div className="flex items-center gap-3 pt-2 border-t border-[var(--color-border)] mt-2">
                    <button
                      onClick={() => handleEdit(item, false)}
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
