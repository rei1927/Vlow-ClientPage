import { useState } from "react";
import { FaToggleOff, FaLightbulb, FaTimes, FaPlus, FaBrain } from "react-icons/fa";
import { FiShield, FiClock, FiTag, FiMessageSquare, FiAlertTriangle } from "react-icons/fi";

const HandoverTab = ({ config, setConfig }) => {
    const [keywordInput, setKeywordInput] = useState("");

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
                            Otomatis alihkan percakapan ke manusia berdasarkan kata kunci tertentu.
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up">
                    {/* LEFT: KEYWORDS */}
                    <div className="space-y-6">
                        {/* Keyword Input */}
                        <div className="bg-[var(--color-surface)] p-6 rounded-2xl shadow-sm border border-[var(--color-border)]">
                            <h4 className="font-bold text-[var(--color-text)] mb-4 flex items-center gap-2">
                                <FiTag className="text-blue-500" /> Kata Kunci Trigger
                            </h4>
                            <p className="text-xs text-[var(--color-text-muted)] mb-4">
                                Jika customer mengirim pesan yang mengandung salah satu kata kunci ini, AI akan berhenti dan chat dialihkan ke manusia.
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

                            {/* Keywords Tags */}
                            <div className="flex flex-wrap gap-2 min-h-10">
                                {(config.keywords || []).length === 0 ? (
                                    <span className="text-xs text-[var(--color-text-muted)] italic">
                                        Belum ada kata kunci. Tambahkan di atas.
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

                        {/* Auto-Release & Label Settings */}
                        <div className="bg-[var(--color-surface)] p-6 rounded-2xl shadow-sm border border-[var(--color-border)]">
                            <h4 className="font-bold text-[var(--color-text)] mb-4 flex items-center gap-2">
                                <FiClock className="text-green-500" /> Auto-Release Timer
                            </h4>
                            <p className="text-xs text-[var(--color-text-muted)] mb-4">
                                AI akan otomatis aktif kembali jika admin tidak membalas dalam waktu tertentu.
                            </p>

                            <div className="form-control w-full">
                                <label className="label">
                                    <span className="label-text font-medium text-[var(--color-text-muted)]">
                                        Durasi (menit)
                                    </span>
                                </label>
                                <input
                                    type="number"
                                    min="5"
                                    max="1440"
                                    className="input input-bordered w-full bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
                                    value={config.autoReleaseMinutes || 30}
                                    onChange={(e) => handleChange("autoReleaseMinutes", parseInt(e.target.value) || 30)}
                                />
                                <label className="label">
                                    <span className="text-xs text-[var(--color-text-muted)] italic">
                                        *) Minimum 5 menit, maksimum 1440 menit (24 jam).
                                    </span>
                                </label>
                            </div>

                            {/* WA Label IDs */}
                            <div className="divider text-xs text-[var(--color-text-muted)]">Label WhatsApp</div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text text-xs font-medium text-[var(--color-text-muted)]">
                                            🤖 Label AI
                                        </span>
                                    </label>
                                    <input
                                        type="text"
                                        className="input input-bordered input-sm bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
                                        placeholder="Label ID"
                                        value={config.aiLabelId || ""}
                                        onChange={(e) => handleChange("aiLabelId", e.target.value || null)}
                                    />
                                </div>
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text text-xs font-medium text-[var(--color-text-muted)]">
                                            👤 Label Human
                                        </span>
                                    </label>
                                    <input
                                        type="text"
                                        className="input input-bordered input-sm bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
                                        placeholder="Label ID"
                                        value={config.handoverLabelId || ""}
                                        onChange={(e) => handleChange("handoverLabelId", e.target.value || null)}
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-[var(--color-text-muted)] mt-2">
                                Masukkan ID label dari WhatsApp Business. Bisa dilihat di menu Chat → Label.
                            </p>
                        </div>
                    </div>

                    {/* RIGHT: RESPONSE MESSAGE */}
                    <div className="space-y-6">
                        <div className="bg-[var(--color-surface)] p-6 rounded-2xl shadow-sm border border-[var(--color-border)] h-full flex flex-col">
                            <h4 className="font-bold text-[var(--color-text)] mb-2 flex items-center gap-2">
                                <FiMessageSquare className="text-purple-500" /> Pesan Saat Handover
                            </h4>
                            <p className="text-xs text-[var(--color-text-muted)] mb-4">
                                Pesan ini akan dikirim secara otomatis ke customer saat percakapan dialihkan ke manusia.
                            </p>

                            <textarea
                                className="textarea textarea-bordered w-full h-32 bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] resize-none"
                                placeholder="Contoh: Baik, saya akan menghubungkan Anda dengan tim kami. Mohon tunggu sebentar."
                                value={config.responseMessage || ""}
                                onChange={(e) => handleChange("responseMessage", e.target.value)}
                            />

                            <div className="mt-6 bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-border)] text-sm text-[var(--color-text)]">
                                <div className="flex items-start gap-2">
                                    <FaLightbulb className="mt-1 text-[var(--color-primary)] shrink-0" />
                                    <div>
                                        <p className="font-semibold mb-1">Cara Kerja Human Handover:</p>
                                        <ol className="list-decimal list-inside space-y-1 text-xs text-[var(--color-text-muted)]">
                                            <li>Customer kirim pesan yang mengandung kata kunci</li>
                                            <li>AI otomatis berhenti dan mengirim pesan handover</li>
                                            <li>Label WhatsApp berubah ke mode <strong>Human</strong></li>
                                            <li>Admin bisa balas dari WhatsApp atau Dashboard</li>
                                            <li>Admin tekan "Release to AI" atau auto-release setelah timer habis</li>
                                        </ol>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl border border-orange-200 dark:border-orange-800 text-sm">
                                <div className="flex items-start gap-2">
                                    <FiShield className="mt-0.5 text-orange-500 shrink-0" />
                                    <div>
                                        <p className="font-semibold text-orange-700 dark:text-orange-300 mb-1">Trigger Manual</p>
                                        <p className="text-xs text-orange-600 dark:text-orange-400">
                                            Selain kata kunci, Anda juga bisa menekan tombol <strong>"Take Over"</strong> di Chat Dashboard untuk mengambil alih percakapan secara manual.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* AI ESCALATION PROMPT */}
                        <div className="bg-[var(--color-surface)] p-6 rounded-2xl shadow-sm border border-[var(--color-border)]">
                            <h4 className="font-bold text-[var(--color-text)] mb-2 flex items-center gap-2">
                                <FiAlertTriangle className="text-red-500" /> Instruksi Escalation AI
                            </h4>
                            <p className="text-xs text-[var(--color-text-muted)] mb-4">
                                Tentukan kondisi di mana AI harus otomatis mengalihkan ke manusia. Instruksi ini akan ditambahkan ke system prompt AI.
                            </p>

                            <textarea
                                className="textarea textarea-bordered w-full h-40 bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] resize-none text-sm"
                                placeholder={"Contoh:\n- Jika customer menunjukkan emosi marah atau frustasi berulang kali\n- Jika ada pertanyaan yang tidak bisa dijawab dari knowledge yang tersedia\n- Jika customer meminta berbicara dengan manusia\n- Jika situasi memerlukan keputusan manusia (refund, pembatalan, dll)"}
                                value={config.escalationPrompt || ""}
                                onChange={(e) => handleChange("escalationPrompt", e.target.value)}
                            />

                            <div className="mt-3 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl border border-blue-200 dark:border-blue-800">
                                <div className="flex items-start gap-2">
                                    <FaBrain className="mt-0.5 text-blue-500 shrink-0" size={14} />
                                    <p className="text-xs text-blue-700 dark:text-blue-300">
                                        AI akan menganalisis setiap pesan dan jika memenuhi kondisi di atas, otomatis mengalihkan ke manusia <strong>tanpa perlu kata kunci spesifik</strong>.
                                    </p>
                                </div>
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
                        Aktifkan toggle di atas untuk mengatur Human Handover — alihkan chat ke manusia berdasarkan kata kunci tertentu.
                    </p>
                </div>
            )}
        </div>
    );
};

export default HandoverTab;
