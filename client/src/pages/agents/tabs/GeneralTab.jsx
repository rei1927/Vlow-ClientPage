import { useEffect, useState } from "react";
import { FaRobot, FaChevronDown, FaChevronUp, FaHistory, FaBrain, FaToggleOff } from "react-icons/fa";

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
  advancedConfig,
  setAdvancedConfig,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleAdvancedChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAdvancedConfig((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : type === "number" ? parseInt(value) || 0 : value,
    }));
  };

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

      {/* ADDITIONAL SETTINGS ACCORDION */}
      <section className="pt-4 border-t border-[var(--color-border)]">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            setShowAdvanced(!showAdvanced);
          }}
          className="flex items-center justify-center w-full gap-2 text-sm font-medium text-[#00bcd4] hover:text-[#0097a7] transition-colors py-2"
        >
          Additional Settings
          {showAdvanced ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
        </button>

        {showAdvanced && (
          <div className="mt-6 space-y-6 animate-[fadeIn_0.3s_ease-out]">
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6 shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <FaBrain className="text-8xl text-white" />
              </div>
              
              <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                <FaBrain className="text-purple-400" /> Advanced Settings
              </h3>
              <p className="text-gray-400 text-sm mb-6 max-w-2xl">
                Konfigurasi tingkat lanjut untuk mengontrol seberapa pintar dan responsif AI Agent Anda dalam berinteraksi.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* AI History Limit */}
                <div className="bg-gray-900/50 rounded-lg p-5 border border-gray-700/50">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-indigo-500/20 rounded-lg">
                      <FaHistory className="text-indigo-400" />
                    </div>
                    <label className="block text-sm font-medium text-gray-200">
                      AI History Limit
                    </label>
                  </div>
                  <p className="text-xs text-gray-400 mb-3">
                    Batas jumlah pesan terakhir (dari user dan AI) yang akan diingat oleh AI dalam satu sesi percakapan. Angka yang lebih kecil menghemat kuota Token.
                  </p>
                  <input
                    type="number"
                    name="aiHistoryLimit"
                    min="1"
                    max="200"
                    value={advancedConfig?.aiHistoryLimit || 50}
                    onChange={handleAdvancedChange}
                    className="w-full bg-gray-800 text-white rounded-lg border-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors p-2.5"
                    placeholder="Contoh: 50"
                  />
                </div>

                {/* Placeholder for future settings */}
                <div className="bg-gray-900/50 rounded-lg p-5 border border-gray-700/50 opacity-50 cursor-not-allowed">
                   <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-gray-500/20 rounded-lg">
                      <FaToggleOff className="text-gray-400" />
                    </div>
                    <label className="block text-sm font-medium text-gray-200">
                      Fitur Lainnya
                    </label>
                  </div>
                  <p className="text-xs text-gray-400 mb-3">
                    Fitur tingkat lanjut lainnya seperti AI Temperature, Message Await, dll akan segera hadir.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default GeneralTab;
