import { useState, useEffect } from "react";
import { FaToggleOff, FaTimes, FaPlus, FaBrain, FaSpinner } from "react-icons/fa";
import { FiShield, FiClock, FiTag, FiMessageSquare, FiAlertTriangle } from "react-icons/fi";
import platformService from "../../../features/platforms/platformService";
import toast from "react-hot-toast";

const HandoverTab = ({ config, setConfig, platformId }) => {
    const [keywordInput, setKeywordInput] = useState("");
    const [labels, setLabels] = useState([]);
    const [isLoadingLabels, setIsLoadingLabels] = useState(false);
    const [isCreatingLabel, setIsCreatingLabel] = useState(false);

    useEffect(() => {
        if (platformId && config.enabled) {
            fetchLabels();
        }
    }, [platformId, config.enabled]);

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

    const handleCreateLabel = async (targetField) => {
        const name = window.prompt("Masukkan nama label baru:");
        if (!name || !name.trim()) return;

        setIsCreatingLabel(true);
        try {
            const res = await platformService.createPlatformLabel({ id: platformId, name: name.trim(), color: 1 });
            if (res.success && res.data) {
                toast.success("Label berhasil dibuat!");
                setLabels(prev => [...prev, res.data]);
                handleChange(targetField, res.data.id);
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || "Gagal membuat label");
        } finally {
            setIsCreatingLabel(false);
        }
    };

    const handleChange = (field, value) => {
        setConfig((prev) => ({ ...prev, [field]: value }));
    };

    const handleAddKeyword = () => {
        const keyword = keywordInput.trim();
        if (!keyword) return;
        if (config.keywords?.includes(keyword)) return;
        handleChange("keywords", [...(config.keywords || []), keyword]);
        setKeywordInput("");
    };

    const handleRemoveKeyword = (kw) => {
        handleChange("keywords", (config.keywords || []).filter((k) => k !== kw));
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleAddKeyword();
        }
    };

    return (
        <div className="max-w-5xl mx-auto animate-fade-in space-y-6">
            {/* --- HEADER & MASTER SWITCH --- */}
            <div className="bg-[var(--color-surface)] p-6 rounded-2xl shadow-sm border border-[var(--color-border)] flex flex-col md:flex-row justify-between items-center gap-4 transition-all hover:shadow-md">
                <div className="flex items-center gap-4">
                    <div
                        className={`p-3 rounded-xl ${config.enabled ? "bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400" : "bg-[var(--color-border)] text-[var(--color-text-muted)]"}`}
                    >
                        <FiShield size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-[var(--color-text)] text-lg">Human Handover</h3>
                        <p className="text-sm text-[var(--color-text-muted)]">
                            Otomatis alihkan percakapan ke manusia berdasarkan kata kunci atau deteksi AI.
                        </p>
                    </div>
                </div>

                <label className="cursor-pointer flex items-center gap-3 bg-[var(--color-bg)] px-4 py-2 rounded-full border border-[var(--color-border)] hover:bg-[var(--color-border)] transition-colors">
                    <span
                        className={`text-sm font-semibold ${config.enabled ? "text-orange-600 dark:text-orange-400" : "text-[var(--color-text-muted)]"}`}
                    >
                        {config.enabled ? "Active" : "Disabled"}
                    </span>
                    <input
                        type="checkbox"
                        className="toggle toggle-warning"
                        checked={config.enabled || false}
                        onChange={(e) => handleChange("enabled", e.target.checked)}
                    />
                </label>
            </div>

            {/* --- CONFIGURATION PANEL (Only if Active) --- */}
            {config.enabled ? (
                <div className="space-y-6 animate-slide-up">
                    {/* ROW 1: Keywords + Response Message */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* LEFT: Keyword Input */}
                        <div className="bg-[var(--color-surface)] p-6 rounded-2xl shadow-sm border border-[var(--color-border)]">
                            <h4 className="font-bold text-[var(--color-text)] mb-3 flex items-center gap-2">
                                <FiTag className="text-blue-500" /> Kata Kunci Trigger
                            </h4>
                            <p className="text-xs text-[var(--color-text-muted)] mb-3">
                                Jika customer mengirim pesan yang mengandung salah satu kata kunci ini, chat dialihkan ke manusia.
                            </p>

                            <div className="join w-full mb-3">
                                <input
                                    type="text"
                                    className="input input-bordered join-item w-full bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
                                    placeholder="Ketik kata kunci, lalu Enter..."
                                    value={keywordInput}
                                    onChange={(e) => setKeywordInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                />
                                <button
                                    type="button"
                                    className="btn btn-square join-item bg-[var(--color-primary)] text-white border-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]"
                                    onClick={handleAddKeyword}
                                >
                                    <FaPlus />
                                </button>
                            </div>

                            <div className="flex flex-wrap gap-2 min-h-8">
                                {(config.keywords || []).length === 0 ? (
                                    <span className="text-xs text-[var(--color-text-muted)] italic">
                                        Belum ada kata kunci.
                                    </span>
                                ) : (
                                    (config.keywords || []).map((kw, idx) => (
                                        <span
                                            key={idx}
                                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-sm font-medium"
                                        >
                                            {kw}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveKeyword(kw)}
                                                className="hover:bg-orange-200 dark:hover:bg-orange-800/50 rounded-full p-0.5 transition-colors"
                                            >
                                                <FaTimes size={10} />
                                            </button>
                                        </span>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* RIGHT: Response Message */}
                        <div className="bg-[var(--color-surface)] p-6 rounded-2xl shadow-sm border border-[var(--color-border)]">
                            <h4 className="font-bold text-[var(--color-text)] mb-3 flex items-center gap-2">
                                <FiMessageSquare className="text-purple-500" /> Pesan Saat Handover
                            </h4>
                            <p className="text-xs text-[var(--color-text-muted)] mb-3">
                                Pesan otomatis ke customer saat percakapan dialihkan ke manusia.
                            </p>

                            <textarea
                                className="textarea textarea-bordered w-full h-28 bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] resize-none"
                                placeholder="Contoh: Baik, saya akan menghubungkan Anda dengan tim kami. Mohon tunggu sebentar."
                                value={config.responseMessage || ""}
                                onChange={(e) => handleChange("responseMessage", e.target.value)}
                            />
                        </div>
                    </div>

                    {/* ROW 2: Escalation AI Prompt (full width) */}
                    <div className="bg-[var(--color-surface)] p-6 rounded-2xl shadow-sm border border-[var(--color-border)]">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="font-bold text-[var(--color-text)] flex items-center gap-2">
                                <FiAlertTriangle className="text-red-500" /> Instruksi Escalation AI
                            </h4>
                            <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-full border border-blue-200 dark:border-blue-800">
                                <FaBrain className="text-blue-500" size={12} />
                                <span className="text-xs text-blue-700 dark:text-blue-300 font-medium">Tanpa kata kunci — AI deteksi otomatis</span>
                            </div>
                        </div>
                        <p className="text-xs text-[var(--color-text-muted)] mb-3">
                            Tentukan kondisi di mana AI harus otomatis mengalihkan ke manusia berdasarkan analisis percakapan.
                        </p>

                        <textarea
                            className="textarea textarea-bordered w-full h-28 bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] resize-none text-sm"
                            placeholder={"Contoh:\n- Jika customer menunjukkan emosi marah atau frustasi berulang kali\n- Jika ada pertanyaan yang tidak bisa dijawab dari knowledge yang tersedia\n- Jika customer meminta berbicara dengan manusia\n- Jika situasi memerlukan keputusan manusia (refund, pembatalan, dll)"}
                            value={config.escalationPrompt || ""}
                            onChange={(e) => handleChange("escalationPrompt", e.target.value)}
                        />
                    </div>

                    {/* ROW 3: Auto-Release + Labels (compact row) */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Auto-Release Timer */}
                        <div className="bg-[var(--color-surface)] p-5 rounded-2xl shadow-sm border border-[var(--color-border)]">
                            <h4 className="font-bold text-[var(--color-text)] mb-3 flex items-center gap-2 text-sm">
                                <FiClock className="text-green-500" /> Auto-Release Timer
                            </h4>
                            <div className="form-control w-full">
                                <label className="label py-1">
                                    <span className="label-text text-xs font-medium text-[var(--color-text-muted)]">
                                        Durasi (menit)
                                    </span>
                                </label>
                                <input
                                    type="number"
                                    min="5"
                                    max="1440"
                                    className="input input-bordered input-sm w-full bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
                                    value={config.autoReleaseMinutes || 30}
                                    onChange={(e) => handleChange("autoReleaseMinutes", parseInt(e.target.value) || 30)}
                                />
                                <span className="text-[10px] text-[var(--color-text-muted)] mt-1">Min 5, Max 1440 (24 jam)</span>
                            </div>
                        </div>

                        {/* Label AI */}
                        <div className="bg-[var(--color-surface)] p-5 rounded-2xl shadow-sm border border-[var(--color-border)]">
                            <h4 className="font-bold text-[var(--color-text)] mb-3 flex items-center justify-between text-sm">
                                <span className="flex items-center gap-2">🤖 Label AI</span>
                            </h4>
                            
                            {!platformId ? (
                                <div className="text-xs text-orange-500 bg-orange-50 dark:bg-orange-900/20 p-2 rounded-lg border border-orange-200">
                                    Simpan agent dan hubungkan WhatsApp untuk menarik label.
                                </div>
                            ) : isLoadingLabels ? (
                                <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] p-2">
                                    <FaSpinner className="animate-spin" /> Menarik label dari WhatsApp...
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <select
                                        className="select select-bordered select-sm w-full bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
                                        value={config.aiLabelId || ""}
                                        onChange={(e) => handleChange("aiLabelId", e.target.value || null)}
                                    >
                                        <option value="">-- Pilih Label --</option>
                                        {labels.map((lbl) => (
                                            <option key={lbl.id} value={lbl.id}>{lbl.name}</option>
                                        ))}
                                    </select>
                                    <button 
                                        type="button"
                                        onClick={() => handleCreateLabel("aiLabelId")}
                                        disabled={isCreatingLabel}
                                        className="btn btn-xs btn-outline btn-block text-[var(--color-text-muted)] border-[var(--color-border)] hover:bg-[var(--color-border)]"
                                    >
                                        <FaPlus size={10} /> Buat Label Baru
                                    </button>
                                </div>
                            )}
                            <span className="text-[10px] text-[var(--color-text-muted)] mt-2 block">Diterapkan saat AI mengambil alih.</span>
                        </div>

                        {/* Label Human */}
                        <div className="bg-[var(--color-surface)] p-5 rounded-2xl shadow-sm border border-[var(--color-border)]">
                            <h4 className="font-bold text-[var(--color-text)] mb-3 flex items-center justify-between text-sm">
                                <span className="flex items-center gap-2">👤 Label Human</span>
                            </h4>
                            
                            {!platformId ? (
                                <div className="text-xs text-orange-500 bg-orange-50 dark:bg-orange-900/20 p-2 rounded-lg border border-orange-200">
                                    Simpan agent dan hubungkan WhatsApp untuk menarik label.
                                </div>
                            ) : isLoadingLabels ? (
                                <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] p-2">
                                    <FaSpinner className="animate-spin" /> Menarik label dari WhatsApp...
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <select
                                        className="select select-bordered select-sm w-full bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
                                        value={config.handoverLabelId || ""}
                                        onChange={(e) => handleChange("handoverLabelId", e.target.value || null)}
                                    >
                                        <option value="">-- Pilih Label --</option>
                                        {labels.map((lbl) => (
                                            <option key={lbl.id} value={lbl.id}>{lbl.name}</option>
                                        ))}
                                    </select>
                                    <button 
                                        type="button"
                                        onClick={() => handleCreateLabel("handoverLabelId")}
                                        disabled={isCreatingLabel}
                                        className="btn btn-xs btn-outline btn-block text-[var(--color-text-muted)] border-[var(--color-border)] hover:bg-[var(--color-border)]"
                                    >
                                        <FaPlus size={10} /> Buat Label Baru
                                    </button>
                                </div>
                            )}
                            <span className="text-[10px] text-[var(--color-text-muted)] mt-2 block">Diterapkan saat Manusia mengambil alih.</span>
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
                        Aktifkan toggle di atas untuk mengatur Human Handover.
                    </p>
                </div>
            )}
        </div>
    );
};

export default HandoverTab;
