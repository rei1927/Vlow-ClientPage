import { useEffect, useRef, useState } from "react";
import { FaRobot, FaCommentDots, FaExchangeAlt, FaImage, FaCloudUploadAlt, FaTimes } from "react-icons/fa";

// Helper Component untuk Character Counter
const CharCount = ({ current, max }) => (
  <span className={`text-xs ${current > max ? "text-red-500 font-bold" : "text-[var(--color-text-muted)]"}`}>
    {current || 0} / {max} chars
  </span>
);

// Terima prop baru: previewImage, handoffConfig
const GeneralTab = ({
  formData,
  handleChange,
  handleFileChange,
  previewImage,
  handoffConfig,
  setHandoffConfig,
  onRemoveImage,
}) => {
  const updateHandoffConfig = (updates) => {
    setHandoffConfig((prev) => ({ ...prev, ...updates }));
  };

  const [keywordInput, setKeywordInput] = useState("");
  const isEditingKeywordsRef = useRef(false);

  const parseKeywords = (value) => {
    const raw = value.trim();
    let keywords = raw
      .split(/[,|\n]+/)
      .map((item) => item.trim())
      .filter(Boolean);

    // Jika user tidak pakai koma, izinkan pemisah spasi
    if (keywords.length <= 1 && raw.includes(" ")) {
      keywords = raw.split(/\s+/).map((item) => item.trim()).filter(Boolean);
    }
    return keywords;
  };

  const handleKeywordInputChange = (value) => {
    isEditingKeywordsRef.current = true;
    setKeywordInput(value);
    updateHandoffConfig({ keywords: parseKeywords(value) });
  };

  const handleKeywordInputBlur = () => {
    isEditingKeywordsRef.current = false;
    setKeywordInput((handoffConfig?.keywords || []).join(", "));
  };

  useEffect(() => {
    if (!isEditingKeywordsRef.current) {
      setKeywordInput((handoffConfig?.keywords || []).join(", "));
    }
  }, [handoffConfig?.keywords]);

  const isHandoffEnabled = !!handoffConfig?.enabled;
  const isKeywordInvalid = isHandoffEnabled && (handoffConfig?.keywords || []).length < 1;

  return (
    <div className="space-y-8 animate-[fadeIn_0.3s_ease-out] max-w-4xl mx-auto">
      {/* 1. IDENTITY SECTION (Tetap Sama) */}
      <section className="p-1">
        <h3 className="text-sm font-bold text-[var(--color-text)] uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-[var(--color-border)] pb-2">
          <FaRobot className="text-[var(--color-primary)]" /> Identitas & Behavior
        </h3>
        <div className="grid grid-cols-1 gap-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="form-control">
              <label className="label-text font-semibold text-[var(--color-text)] mb-1">
                Nama Agent <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input input-bordered w-full rounded-lg bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-text)] focus:ring-1 focus:ring-[var(--color-primary)]"
                placeholder="Ex: CS Toko Batik"
              />
            </div>
            <div className="form-control">
              <label className="label-text font-semibold text-[var(--color-text)] mb-1">
                Deskripsi Internal
              </label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="input input-bordered w-full rounded-lg bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-text)] focus:ring-1 focus:ring-[var(--color-primary)]"
                placeholder="Catatan untuk admin..."
              />
            </div>
          </div>

          <div className="form-control">
            <div className="flex justify-between items-center mb-1">
              <label className="label-text font-semibold text-[var(--color-text)]">
                AI Agent Behavior (System Prompt)
              </label>
              <CharCount current={formData.systemInstruction?.length} max={15000} />
            </div>
            <textarea
              name="systemInstruction"
              value={formData.systemInstruction}
              onChange={handleChange}
              maxLength={15000}
              className="textarea textarea-bordered w-full rounded-lg h-64 font-mono text-sm leading-relaxed bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-text)] focus:ring-1 focus:ring-[var(--color-primary)]"
              placeholder="Anda adalah asisten virtual..."
            />
          </div>
        </div>
      </section>

      {/* 2. GREETING SECTION (Updated Preview) */}
      <section>
        <h3 className="text-sm font-bold text-[var(--color-text)] uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-[var(--color-border)] pb-2">
          <FaCommentDots className="text-[var(--color-primary)]" /> Sapaan (Greeting)
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Text Greeting */}
          <div className="lg:col-span-2 form-control">
            <div className="flex justify-between items-center mb-1">
              <label className="label-text font-semibold text-[var(--color-text)]">Welcome Message</label>
              <CharCount current={formData.welcomeMessage?.length} max={5000} />
            </div>
            <textarea
              name="welcomeMessage"
              value={formData.welcomeMessage}
              onChange={handleChange}
              maxLength={5000}
              className="textarea textarea-bordered w-full rounded-lg h-40 bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:ring-1 focus:ring-[var(--color-primary)]"
              placeholder="Halo! Ada yang bisa saya bantu hari ini?"
            />
          </div>

          {/* Image Upload dengan PREVIEW LANGSUNG */}
          <div className="form-control">
            <label className="label-text font-semibold text-[var(--color-text)] mb-1">
              Gambar Sapaan (Opsional)
            </label>

            {previewImage ? (
              // TAMPILKAN PREVIEW JIKA ADA GAMBAR
              <div className="relative group rounded-xl overflow-hidden border border-[var(--color-border)] h-40 bg-[var(--color-bg)] flex items-center justify-center">
                <img
                  src={previewImage}
                  alt="Preview Welcome"
                  className="w-full h-full object-cover"
                />
                {/* Delete Button - Always Visible with higher z-index */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.nativeEvent.stopImmediatePropagation();
                    console.log("Delete button clicked, onRemoveImage:", onRemoveImage);
                    if (onRemoveImage && typeof onRemoveImage === "function") {
                      onRemoveImage(e);
                    }
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white rounded-lg shadow-lg transition-all z-50 flex items-center justify-center cursor-pointer"
                  title="Hapus Gambar"
                >
                  <FaTimes size={12} />
                </button>
                {/* Overlay ganti gambar */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer z-10 pointer-events-none">
                  <FaCloudUploadAlt size={24} />
                  <span className="text-xs font-medium mt-1">Ganti Gambar</span>
                </div>
                <input
                  type="file"
                  name="welcomeImage"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                  onClick={(e) => {
                    // Don't trigger if clicking delete button
                    const target = e.target;
                    if (target.closest('button[title="Hapus Gambar"]')) {
                      e.preventDefault();
                      e.stopPropagation();
                      return false;
                    }
                  }}
                />
              </div>
            ) : (
              // TAMPILKAN UPLOAD BOX JIKA KOSONG
              <div className="border-2 border-dashed border-[var(--color-border)] rounded-xl h-40 flex flex-col items-center justify-center bg-[var(--color-bg)] hover:border-[var(--color-primary)] transition-all relative cursor-pointer group">
                <input
                  type="file"
                  name="welcomeImage"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)] transition-colors flex flex-col items-center">
                  <FaImage size={24} className="mb-2" />
                  <span className="text-xs font-medium">Upload Image</span>
                </div>
              </div>
            )}

            <p className="text-[10px] text-[var(--color-text-muted)] mt-2">
              Gambar ini akan dikirim bersamaan dengan pesan sambutan saat user pertama kali chat.
            </p>
          </div>
        </div>
      </section>

      {/* 3. HANDOFF SECTION (Updated) */}
      <section>
        <h3 className="text-sm font-bold text-[var(--color-text)] uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-[var(--color-border)] pb-2">
          <FaExchangeAlt className="text-[var(--color-primary)]" /> Human Handoff
        </h3>
        <div className="bg-[var(--color-bg)]/60 border border-[var(--color-border)] rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-[var(--color-text)]">Aktifkan Human Handoff</h4>
              <p className="text-xs text-[var(--color-text-muted)]">
                Jika aktif, AI akan mengeskalasi ke manusia saat kondisi terpenuhi.
              </p>
            </div>
            <input
              type="checkbox"
              className="toggle toggle-sm toggle-success"
              checked={!!handoffConfig?.enabled}
              onChange={(e) => updateHandoffConfig({ enabled: e.target.checked })}
            />
          </div>

          {handoffConfig?.enabled && (
            <div className="grid grid-cols-1 gap-4">
              <div className="form-control">
                <label className="label-text font-semibold text-[var(--color-text)] mb-1">
                  Kata Kunci Pemicu (pisahkan dengan koma)
                </label>
                <input
                  type="text"
                  value={keywordInput}
                  onChange={(e) => handleKeywordInputChange(e.target.value)}
                  onBlur={handleKeywordInputBlur}
                  className={`input input-bordered w-full rounded-lg bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:ring-1 focus:ring-[var(--color-primary)] ${
                    isKeywordInvalid ? "border-red-300 focus:ring-red-400" : ""
                  }`}
                  placeholder="contoh: admin, cs, operator, manusia"
                />
                {isKeywordInvalid && (
                  <p className="text-xs text-red-500 mt-1">
                    Minimal 1 kata kunci diperlukan saat human handoff aktif.
                  </p>
                )}
              </div>

              <div className="form-control">
                <div className="flex justify-between items-center mb-1">
                  <label className="label-text font-semibold text-[var(--color-text)]">
                    Kondisi Handoff (aturan tambahan)
                  </label>
                  <CharCount current={handoffConfig?.conditionText?.length} max={750} />
                </div>
                <textarea
                  value={handoffConfig?.conditionText || ""}
                  onChange={(e) => updateHandoffConfig({ conditionText: e.target.value })}
                  maxLength={750}
                  className="textarea textarea-bordered w-full rounded-lg h-24 bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:ring-1 focus:ring-[var(--color-primary)]"
                  placeholder="Contoh: Jika user meminta berbicara dengan manusia atau kasus sensitif."
                />
              </div>

              <div className="form-control">
                <div className="flex justify-between items-center mb-1">
                  <label className="label-text font-semibold text-[var(--color-text)]">
                    Pesan Saat Dialihkan (Opsional)
                  </label>
                  <CharCount current={handoffConfig?.responseMessage?.length} max={300} />
                </div>
                <textarea
                  value={handoffConfig?.responseMessage || ""}
                  onChange={(e) => updateHandoffConfig({ responseMessage: e.target.value })}
                  maxLength={300}
                  className="textarea textarea-bordered w-full rounded-lg h-20 bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:ring-1 focus:ring-[var(--color-primary)]"
                  placeholder="Contoh: Baik, saya hubungkan Anda ke tim kami."
                />
              </div>

              {/* <div className="text-xs text-gray-500 bg-white border border-gray-100 rounded-xl p-3">
                Integrasi n8n: AI akan menambahkan JSON{" "}
                <span className="font-mono">{`{"escalate": true}`}</span> saat handoff. Workflow
                Anda sudah bisa menangkap sinyal ini tanpa perubahan besar.
              </div> */}

            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default GeneralTab;
