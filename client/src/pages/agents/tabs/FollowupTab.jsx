import { useState, useEffect } from "react";
import { FaClock, FaToggleOff, FaLightbulb, FaSpinner, FaBrain } from "react-icons/fa";
import { FiActivity, FiMessageSquare, FiTag, FiRefreshCw } from "react-icons/fi";
import RichTextEditor from "../../../components/common/RichTextEditor";
import platformService from "../../../features/platforms/platformService";

const FollowupTab = ({ config, setConfig, platformId }) => {
  const [labels, setLabels] = useState([]);
  const [isLoadingLabels, setIsLoadingLabels] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (platformId && config.isEnabled) {
      fetchLabels();
    }
  }, [platformId, config.isEnabled]);

  const fetchLabels = async () => {
    setIsLoadingLabels(true);
    try {
      const res = await platformService.getPlatformLabels(platformId);
      if (res.success) {
        setLabels(res.data || []);
      }
    } catch (error) {
      console.error("Gagal menarik label:", error);
    } finally {
      setIsLoadingLabels(false);
    }
  };

  const handleRefreshLabels = async () => {
    setIsRefreshing(true);
    try {
      const res = await platformService.getPlatformLabels(platformId);
      if (res.success) {
        setLabels(res.data || []);
      }
    } catch (error) {
      console.error("Gagal refresh label:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleChange = (field, value) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const toggleTargetLabel = (labelId) => {
    const currentLabels = config.targetLabels || [];
    if (currentLabels.includes(labelId)) {
      handleChange("targetLabels", currentLabels.filter((id) => id !== labelId));
    } else {
      handleChange("targetLabels", [...currentLabels, labelId]);
    }
  };

  return (
    <div className="max-w-5xl mx-auto animate-fade-in space-y-6">
      {/* --- HEADER & MASTER SWITCH --- */}
      <div className="bg-[var(--color-surface)] p-6 rounded-2xl shadow-sm border border-[var(--color-border)] flex flex-col md:flex-row justify-between items-center gap-4 transition-all hover:shadow-md">
        <div className="flex items-center gap-4">
          <div
            className={`p-3 rounded-xl ${config.isEnabled ? "bg-green-500/10 dark:bg-green-500/20 text-green-600 dark:text-green-400" : "bg-[var(--color-border)] text-[var(--color-text-muted)]"}`}
          >
            <FiActivity size={24} />
          </div>
          <div>
            <h3 className="font-bold text-[var(--color-text)] text-lg">Follow-up Automation</h3>
            <p className="text-sm text-[var(--color-text-muted)]">
              Otomatis menyapa kembali customer yang tidak merespon pesan.
            </p>
          </div>
        </div>

        <label className="cursor-pointer flex items-center gap-3 bg-[var(--color-bg)] px-4 py-2 rounded-full border border-[var(--color-border)] hover:bg-[var(--color-border)] transition-colors">
          <span
            className={`text-sm font-semibold ${config.isEnabled ? "text-green-600 dark:text-green-400" : "text-[var(--color-text-muted)]"}`}
          >
            {config.isEnabled ? "Active" : "Disabled"}
          </span>
          <input
            type="checkbox"
            className="toggle toggle-success"
            checked={config.isEnabled}
            onChange={(e) => handleChange("isEnabled", e.target.checked)}
          />
        </label>
      </div>

      {/* --- CONFIGURATION PANEL (Only if Active) --- */}
      {config.isEnabled ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up">
          {/* LEFT: SETTINGS */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-[var(--color-surface)] p-6 rounded-2xl shadow-sm border border-[var(--color-border)] h-full">
              <h4 className="font-bold text-[var(--color-text)] mb-4 flex items-center gap-2">
                <FaClock className="text-orange-500" /> Timing Settings
              </h4>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium text-[var(--color-text-muted)]">
                    Jeda Waktu (Idle Time)
                  </span>
                </label>
                <div className="join w-full">
                  <input
                    type="number"
                    min="1"
                    className="input input-bordered join-item w-full bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
                    value={config.delay}
                    onChange={(e) => handleChange("delay", parseInt(e.target.value) || 15)}
                  />
                  <select
                    className="select select-bordered join-item bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
                    value={config.unit}
                    onChange={(e) => handleChange("unit", e.target.value)}
                  >
                    <option value="minutes">Menit</option>
                    <option value="hours">Jam</option>
                  </select>
                </div>
                <label className="label">
                  <span className="text-xs text-[var(--color-text-muted)] italic">
                    *) Dihitung setelah respon terakhir AI Agent.
                  </span>
                </label>
              </div>

              <div className="form-control w-full mt-4">
                <label className="label">
                  <span className="label-text font-medium text-[var(--color-text-muted)] flex items-center gap-2">
                    Maksimal Follow-up
                  </span>
                </label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full">
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="1"
                      className="input input-bordered w-20 bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
                      value={config.maxCount || 1}
                      onChange={(e) => handleChange("maxCount", parseInt(e.target.value) || 1)}
                    />
                    <span className="text-sm text-[var(--color-text-muted)] whitespace-nowrap">kali dalam</span>
                  </div>
                  <div className="join flex-1">
                    <input
                      type="number"
                      min="1"
                      className="input input-bordered join-item w-full bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
                      value={config.maxPeriod || 24}
                      onChange={(e) => handleChange("maxPeriod", parseInt(e.target.value) || 24)}
                    />
                    <select
                      className="select select-bordered join-item bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
                      value={config.maxPeriodUnit || "hours"}
                      onChange={(e) => handleChange("maxPeriodUnit", e.target.value)}
                    >
                      <option value="minutes">Menit</option>
                      <option value="hours">Jam</option>
                      <option value="days">Hari</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="mt-6 bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-border)] text-sm text-[var(--color-text)]">
                <div className="flex items-start gap-2">
                  <FaLightbulb className="mt-1 text-[var(--color-primary)] shrink-0" />
                  <p>
                    <strong>Tips:</strong> Jangan atur waktu terlalu cepat agar tidak dianggap spam.
                    Idealnya 15-30 menit untuk pesan follow-up.
                  </p>
                </div>
              </div>
              
              <div className="mt-6">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-bold text-[var(--color-text)] flex items-center gap-2 text-sm">
                    <FiTag className="text-blue-500" /> Target Label
                  </h4>
                  {platformId && !isLoadingLabels && (
                    <button
                      type="button"
                      onClick={handleRefreshLabels}
                      disabled={isRefreshing}
                      className="btn btn-xs btn-outline btn-info gap-1"
                      title="Refresh label dari WhatsApp"
                    >
                      <FiRefreshCw className={`${isRefreshing ? "animate-spin" : ""}`} size={12} />
                      {isRefreshing ? "Memuat..." : "Refresh Label"}
                    </button>
                  )}
                </div>
                {!platformId ? (
                  <div className="text-xs text-orange-500 bg-orange-50 dark:bg-orange-900/20 p-2 rounded-lg border border-orange-200">
                    Simpan agent dan hubungkan WhatsApp untuk menarik label.
                  </div>
                ) : isLoadingLabels ? (
                  <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] p-2">
                    <FaSpinner className="animate-spin" /> Menarik label...
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)] mb-3">
                      Pilih label mana saja yang akan difollow-up. Jika dikosongkan, semua kontak akan difollow-up.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {labels.map((lbl) => {
                        const isSelected = (config.targetLabels || []).includes(lbl.id);
                        return (
                          <button
                            key={lbl.id}
                            type="button"
                            onClick={() => toggleTargetLabel(lbl.id)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                              isSelected
                                ? "bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300"
                                : "bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-blue-300"
                            }`}
                          >
                            {lbl.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: PROMPT EDITOR */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[var(--color-surface)] p-6 rounded-2xl shadow-sm border border-[var(--color-border)] flex flex-col sm:flex-row justify-between items-center gap-4">
              <div>
                <h4 className="font-bold text-[var(--color-text)] flex items-center gap-2 text-lg">
                  <FaBrain className="text-purple-500" /> Advanced Contextual Follow-up
                </h4>
                <p className="text-sm text-[var(--color-text-muted)]">
                  Gunakan AI untuk merangkai pesan follow-up berdasarkan riwayat percakapan secara dinamis.
                </p>
              </div>
              <label className="cursor-pointer flex items-center gap-3 bg-[var(--color-bg)] px-4 py-2 rounded-full border border-[var(--color-border)] hover:bg-[var(--color-border)] transition-colors">
                <span className={`text-sm font-semibold ${config.isAdvancedFollowup ? "text-purple-600 dark:text-purple-400" : "text-[var(--color-text-muted)]"}`}>
                  {config.isAdvancedFollowup ? "ON" : "OFF"}
                </span>
                <input
                  type="checkbox"
                  className="toggle toggle-secondary"
                  checked={config.isAdvancedFollowup || false}
                  onChange={(e) => handleChange("isAdvancedFollowup", e.target.checked)}
                />
              </label>
            </div>

            <div className="bg-[var(--color-surface)] p-6 rounded-2xl shadow-sm border border-[var(--color-border)] h-[400px] flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-[var(--color-text)] flex items-center gap-2">
                  <FiMessageSquare className={config.isAdvancedFollowup ? "text-purple-500" : "text-blue-500"} /> 
                  {config.isAdvancedFollowup ? "System Prompt Follow-up" : "Instruksi & Prompt"}
                </h4>
                <span className={`badge text-xs ${config.isAdvancedFollowup ? "badge-secondary" : "badge-ghost"}`}>
                  {config.isAdvancedFollowup ? "AI System Prompt" : "Static Text"}
                </span>
              </div>

              <div className="grow">
                {config.isAdvancedFollowup ? (
                  <textarea
                    className="textarea textarea-bordered w-full h-full bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] resize-none font-mono text-sm leading-relaxed"
                    placeholder="Contoh: Berikan sapaan ramah ke user. Jika obrolan terakhir membahas produk tertentu, sebutkan produk tersebut dan tanyakan apakah ada kendala. Jangan gunakan bahasa kaku."
                    value={config.prompt}
                    onChange={(e) => handleChange("prompt", e.target.value)}
                  />
                ) : (
                  <RichTextEditor
                    value={config.prompt}
                    onChange={(val) => handleChange("prompt", val)}
                    placeholder="Contoh: Halo Kak, apakah ada kendala saat pembayaran? Stok produk menipis lho..."
                    className="h-full min-h-50"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        // --- EMPTY STATE ---
        <div className="text-center py-16 bg-[var(--color-bg)] rounded-2xl border-2 border-dashed border-[var(--color-border)] opacity-60">
          <div className="w-16 h-16 bg-[var(--color-border)] rounded-full flex items-center justify-center mx-auto mb-4 text-[var(--color-text-muted)]">
            <FaToggleOff size={28} />
          </div>
          <h3 className="font-bold text-[var(--color-text-muted)] text-lg">Fitur Non-aktif</h3>
          <p className="text-[var(--color-text-muted)] max-w-md mx-auto mt-2">
            Aktifkan toggle di atas untuk mulai mengatur pesan follow-up otomatis kepada pelanggan
            Anda.
          </p>
        </div>
      )}
    </div>
  );
};

export default FollowupTab;
