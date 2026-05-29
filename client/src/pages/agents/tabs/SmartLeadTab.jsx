import { useState, useEffect } from "react";
import { FaToggleOff, FaTimes, FaPlus, FaSpinner, FaThermometerHalf, FaSnowflake, FaFire, FaSun } from "react-icons/fa";
import platformService from "../../../features/platforms/platformService";
import toast from "react-hot-toast";

const SmartLeadTab = ({ config, setConfig, platformId }) => {
    const [labels, setLabels] = useState([]);
    const [isLoadingLabels, setIsLoadingLabels] = useState(false);
    const [isCreatingLabel, setIsCreatingLabel] = useState(false);

    useEffect(() => {
        if (platformId && config?.enabled) {
            fetchLabels();
        }
    }, [platformId, config?.enabled]);

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

    const handleCreateLabel = async (targetField, defaultColor = 1) => {
        const name = window.prompt("Masukkan nama label baru:");
        if (!name || !name.trim()) return;

        setIsCreatingLabel(true);
        try {
            const res = await platformService.createPlatformLabel({ id: platformId, name: name.trim(), color: defaultColor });
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

    return (
        <div className="max-w-5xl mx-auto animate-fade-in space-y-6">
            {/* --- HEADER & MASTER SWITCH --- */}
            <div className="bg-[var(--color-surface)] p-6 rounded-2xl shadow-sm border border-[var(--color-border)] flex flex-col md:flex-row justify-between items-center gap-4 transition-all hover:shadow-md">
                <div className="flex items-center gap-4">
                    <div
                        className={`p-3 rounded-xl ${config?.enabled ? "bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400" : "bg-[var(--color-border)] text-[var(--color-text-muted)]"}`}
                    >
                        <FaThermometerHalf size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-[var(--color-text)] text-lg">Smart Lead Qualification</h3>
                        <p className="text-sm text-[var(--color-text-muted)]">
                            Otomatis mendeteksi suhu minat prospek (Cold, Warm, Hot) dan mengambil alih obrolan saat Hot.
                        </p>
                    </div>
                </div>

                <label className="cursor-pointer flex items-center gap-3 bg-[var(--color-bg)] px-4 py-2 rounded-full border border-[var(--color-border)] hover:bg-[var(--color-border)] transition-colors">
                    <span
                        className={`text-sm font-semibold ${config?.enabled ? "text-red-600 dark:text-red-400" : "text-[var(--color-text-muted)]"}`}
                    >
                        {config?.enabled ? "Active" : "Disabled"}
                    </span>
                    <input
                        type="checkbox"
                        className="toggle toggle-error"
                        checked={config?.enabled || false}
                        onChange={(e) => handleChange("enabled", e.target.checked)}
                    />
                </label>
            </div>

            {/* --- CONFIGURATION PANEL (Only if Active) --- */}
            {config?.enabled ? (
                <div className="space-y-6 animate-slide-up">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        
                        {/* Label Cold */}
                        <div className="bg-[var(--color-surface)] p-5 rounded-2xl shadow-sm border border-[var(--color-border)]">
                            <h4 className="font-bold text-[var(--color-text)] mb-3 flex items-center gap-2 text-sm">
                                <FaSnowflake className="text-blue-500" /> Label Cold
                            </h4>
                            <p className="text-[10px] text-[var(--color-text-muted)] mb-3 leading-relaxed">
                                Diterapkan saat prospek baru menyapa atau tanya hal dasar.
                            </p>
                            
                            {!platformId ? (
                                <div className="text-xs text-orange-500 bg-orange-50 p-2 rounded-lg border border-orange-200">
                                    Simpan agent untuk menarik label.
                                </div>
                            ) : isLoadingLabels ? (
                                <div className="flex items-center gap-2 text-xs p-2">
                                    <FaSpinner className="animate-spin" /> Menarik label...
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <select
                                        className="select select-bordered select-sm w-full bg-[var(--color-bg)] text-[var(--color-text)]"
                                        value={config.coldLabelId || ""}
                                        onChange={(e) => handleChange("coldLabelId", e.target.value || null)}
                                    >
                                        <option value="">-- Pilih Label --</option>
                                        {labels.map((lbl) => (
                                            <option key={lbl.id} value={lbl.id}>{lbl.name}</option>
                                        ))}
                                    </select>
                                    <button 
                                        type="button"
                                        onClick={() => handleCreateLabel("coldLabelId", 1)}
                                        disabled={isCreatingLabel}
                                        className="btn btn-xs btn-outline btn-block text-[var(--color-text-muted)]"
                                    >
                                        <FaPlus size={10} /> Buat Label Baru
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Label Warm */}
                        <div className="bg-[var(--color-surface)] p-5 rounded-2xl shadow-sm border border-[var(--color-border)]">
                            <h4 className="font-bold text-[var(--color-text)] mb-3 flex items-center gap-2 text-sm">
                                <FaSun className="text-orange-500" /> Label Warm
                            </h4>
                            <p className="text-[10px] text-[var(--color-text-muted)] mb-3 leading-relaxed">
                                Diterapkan saat prospek mulai tanya spesifikasi/harga.
                            </p>
                            
                            {!platformId ? (
                                <div className="text-xs text-orange-500 bg-orange-50 p-2 rounded-lg border border-orange-200">
                                    Simpan agent untuk menarik label.
                                </div>
                            ) : isLoadingLabels ? (
                                <div className="flex items-center gap-2 text-xs p-2">
                                    <FaSpinner className="animate-spin" /> Menarik label...
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <select
                                        className="select select-bordered select-sm w-full bg-[var(--color-bg)] text-[var(--color-text)]"
                                        value={config.warmLabelId || ""}
                                        onChange={(e) => handleChange("warmLabelId", e.target.value || null)}
                                    >
                                        <option value="">-- Pilih Label --</option>
                                        {labels.map((lbl) => (
                                            <option key={lbl.id} value={lbl.id}>{lbl.name}</option>
                                        ))}
                                    </select>
                                    <button 
                                        type="button"
                                        onClick={() => handleCreateLabel("warmLabelId", 2)}
                                        disabled={isCreatingLabel}
                                        className="btn btn-xs btn-outline btn-block text-[var(--color-text-muted)]"
                                    >
                                        <FaPlus size={10} /> Buat Label Baru
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Label Hot */}
                        <div className="bg-[var(--color-surface)] p-5 rounded-2xl shadow-sm border-red-200 dark:border-red-900/30">
                            <h4 className="font-bold text-red-600 mb-3 flex items-center gap-2 text-sm">
                                <FaFire className="text-red-500" /> Label Hot (Takeover)
                            </h4>
                            <p className="text-[10px] text-[var(--color-text-muted)] mb-3 leading-relaxed">
                                AI berhenti membalas dan mengalihkan chat ke Admin.
                            </p>
                            
                            {!platformId ? (
                                <div className="text-xs text-orange-500 bg-orange-50 p-2 rounded-lg border border-orange-200">
                                    Simpan agent untuk menarik label.
                                </div>
                            ) : isLoadingLabels ? (
                                <div className="flex items-center gap-2 text-xs p-2">
                                    <FaSpinner className="animate-spin" /> Menarik label...
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <select
                                        className="select select-bordered select-sm w-full bg-[var(--color-bg)] text-[var(--color-text)] border-red-300"
                                        value={config.hotLabelId || ""}
                                        onChange={(e) => handleChange("hotLabelId", e.target.value || null)}
                                    >
                                        <option value="">-- Pilih Label --</option>
                                        {labels.map((lbl) => (
                                            <option key={lbl.id} value={lbl.id}>{lbl.name}</option>
                                        ))}
                                    </select>
                                    <button 
                                        type="button"
                                        onClick={() => handleCreateLabel("hotLabelId", 3)}
                                        disabled={isCreatingLabel}
                                        className="btn btn-xs btn-outline btn-block text-[var(--color-text-muted)]"
                                    >
                                        <FaPlus size={10} /> Buat Label Baru
                                    </button>
                                </div>
                            )}
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
                        Aktifkan toggle di atas untuk mulai membedakan minat prospek secara otomatis.
                    </p>
                </div>
            )}
        </div>
    );
};

export default SmartLeadTab;
