import { FaClock, FaToggleOff, FaLightbulb } from "react-icons/fa";
import { FiActivity, FiMessageSquare } from "react-icons/fi";
import RichTextEditor from "../../../components/common/RichTextEditor";

const FollowupTab = ({ config, setConfig }) => {
  const handleChange = (field, value) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
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

              <div className="mt-6 bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-border)] text-sm text-[var(--color-text)]">
                <div className="flex items-start gap-2">
                  <FaLightbulb className="mt-1 text-[var(--color-primary)] shrink-0" />
                  <p>
                    <strong>Tips:</strong> Jangan atur waktu terlalu cepat agar tidak dianggap spam.
                    Idealnya 15-30 menit untuk pesan follow-up.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: PROMPT EDITOR */}
          <div className="lg:col-span-2">
            <div className="bg-[var(--color-surface)] p-6 rounded-2xl shadow-sm border border-[var(--color-border)] h-full flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-[var(--color-text)] flex items-center gap-2">
                  <FiMessageSquare className="text-purple-500" /> Instruksi & Prompt
                </h4>
                <span className="badge badge-ghost text-xs">Text Only</span>
              </div>

              <div className="grow">
                <RichTextEditor
                  value={config.prompt}
                  onChange={(val) => handleChange("prompt", val)}
                  placeholder="Contoh: Halo Kak, apakah ada kendala saat pembayaran? Stok produk menipis lho..."
                  className="h-full min-h-50"
                />
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
