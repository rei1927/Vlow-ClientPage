import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getPlatformQR, getPlatformStatus, clearQR } from "../../features/platforms/platformSlice";
import { FaTimes, FaRobot, FaCheckCircle, FaSync } from "react-icons/fa";

const PlatformModal = ({ isOpen, onClose, onSubmit, initialData, agents }) => {
  const dispatch = useDispatch();
  const { currentQrCode, connectionStatus } = useSelector((state) => state.platforms);

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ name: "", agentId: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [qrLoading, setQrLoading] = useState(false); // State lokal untuk loading QR
  const [statusMessage, setStatusMessage] = useState("Menunggu WhatsApp...");
  const [activePlatformId, setActivePlatformId] = useState(null);

  // Refs untuk interval agar bisa di-clear dengan aman
  const statusIntervalRef = useRef(null);
  const qrIntervalRef = useRef(null);

  // --- RESET STATE SAAT MODAL DIBUKA/TUTUP ---
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          name: initialData.name,
          agentId: initialData.agentId || "",
        });
        setActivePlatformId(initialData.id);
        // Jika sedang scanning, langsung masuk step 2
        if (initialData.status === "SCANNING") {
          setStep(2);
          startScanningProcess(initialData.id);
        } else {
          setStep(1);
        }
      } else {
        setStep(1);
        setFormData({ name: "", agentId: "" });
        setActivePlatformId(null);
      }
    } else {
      stopAllPolling();
      dispatch(clearQR());
      setStep(1);
      setQrLoading(false);
      setActivePlatformId(null);
    }
  }, [isOpen, initialData, dispatch]);

  const stopAllPolling = () => {
    if (statusIntervalRef.current) clearInterval(statusIntervalRef.current);
    if (qrIntervalRef.current) clearInterval(qrIntervalRef.current);
  };

  // --- LOGIC SUBMIT FORM (Step 1) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Submit ke parent (Create/Update)
    const result = await onSubmit({
      name: formData.name,
      agentId: formData.agentId || null,
    });

    setIsSubmitting(false);

    // Jika Create Sukses -> Pindah ke Step 2
    if (result && !initialData) {
      setStep(2);
      setActivePlatformId(result.id);
      startScanningProcess(result.id);
    } else if (initialData && step === 1 && initialData.status !== "SCANNING") {
      onClose(); // Kalau cuma edit nama/agent, langsung tutup
    }
  };

  // --- LOGIC STEP 2 (SCANNING) ---
  const startScanningProcess = (platformId) => {
    setStatusMessage("Menyiapkan Browser WhatsApp...");
    setQrLoading(true); // Set loading awal

    // 1. Polling Status Koneksi (WORKING / SCANNING)
    statusIntervalRef.current = setInterval(() => {
      dispatch(getPlatformStatus(platformId)).then((res) => {
        const status = res.payload?.status;
        if (status === "WORKING") {
          stopAllPolling();
          // Delay sedikit biar user lihat status connected
          setTimeout(() => onClose(), 2000);
        }
      });
    }, 3000);

    // 2. Polling QR Code (Auto-Retry sampai dapat gambar valid)
    fetchQRLoop(platformId);
  };

  const fetchQRLoop = (platformId) => {
    // Fungsi untuk memanggil QR
    const fetchIt = () => {
      dispatch(getPlatformQR(platformId)).then((action) => {
        // Cek apakah kita dapat gambar valid di payload
        if (action.payload?.qr) {
          setQrLoading(false);
          setStatusMessage("Scan QR Code ini");
          // Jika sudah dapat QR, kita bisa stop polling QR (hemat resource),
          // ATAU biarkan polling lambat jika QR berubah (dynamic).
          // Disini kita biarkan interval tapi perlambat, atau stop jika mau refresh manual.
          // Untuk WAHA, QR statis biasanya cukup refresh manual jika expire.
          if (qrIntervalRef.current) clearInterval(qrIntervalRef.current);
        }
      });
    };

    // Panggil pertama kali langsung
    fetchIt();

    // Loop setiap 3 detik jika belum dapat QR
    qrIntervalRef.current = setInterval(fetchIt, 3000);
  };

  // --- MANUAL REFRESH ---
  const handleRefreshQR = () => {
    const id = activePlatformId || initialData?.id; // Ambil ID yang tersedia
    if (!id) return;

    // Reset UI ke state loading
    dispatch(clearQR());
    setQrLoading(true);
    setStatusMessage("Mereload QR Code...");

    // Restart Polling QR
    if (qrIntervalRef.current) clearInterval(qrIntervalRef.current);
    fetchQRLoop(id);
  };

  // Cleanup saat unmount
  useEffect(() => {
    return () => stopAllPolling();
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 transition-all">
      {/* Ubah ukuran modal berdasarkan Step.
         Step 1 (Form): Ukuran sedang.
         Step 2 (QR): Ukuran besar/Full agar QR jelas.
      */}
      <div
        className={`bg-[var(--color-bg)] rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300 border border-[var(--color-border)] ${step === 2 ? "w-full max-w-4xl h-[90vh]" : "w-full max-w-lg"}`}
      >
        <div className="bg-[var(--color-surface)] px-6 py-4 border-b border-[var(--color-border)] flex justify-between items-center">
          <div>
            <h3 className="font-bold text-lg text-[var(--color-text)]">
              {step === 1 ? (initialData ? "Edit Connection" : "Setup WhatsApp") : "Scan QR Code"}
            </h3>
          </div>
          <button onClick={onClose} className="btn btn-circle btn-sm btn-ghost text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
            <FaTimes size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-[var(--color-surface)]/50 p-6 relative">
          {step === 1 && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="form-control">
                <label className="label font-semibold text-[var(--color-text)]">Nama Label</label>
                <input
                  type="text"
                  className="input input-bordered w-full rounded-xl bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)]"
                  placeholder="Contoh: CS Sales 01"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-control">
                <label className="label font-semibold text-[var(--color-text)]">Hubungkan ke AI Agent</label>
                <div className="relative">
                  <select
                    className="select select-bordered w-full rounded-xl pl-10 bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
                    value={formData.agentId}
                    onChange={(e) => setFormData({ ...formData, agentId: e.target.value })}
                    required
                  >
                    <option value="" disabled>
                      -- Pilih Agent --
                    </option>
                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name}
                      </option>
                    ))}
                  </select>
                  <FaRobot className="absolute left-3 top-3.5 text-[var(--color-text-muted)]" />
                </div>
              </div>

              <div className="modal-action mt-8">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-ghost text-[var(--color-text-muted)] hover:text-[var(--color-text)] rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white border-none rounded-xl px-8"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <span className="loading loading-dots"></span> : "Lanjut"}
                </button>
              </div>
            </form>
          )}

          {/* --- STEP 2: QR CODE FULL PREVIEW --- */}
          {step === 2 && (
            <div className="h-full flex flex-col items-center justify-center">
              {connectionStatus === "WORKING" ? (
                <div className="text-center animate-fade-in-up">
                  <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaCheckCircle className="text-6xl" />
                  </div>
                  <h2 className="text-3xl font-bold text-[var(--color-text)]">Connected!</h2>
                  <p className="text-[var(--color-text-muted)] mt-2">WhatsApp berhasil terhubung.</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center w-full h-full space-y-6">
                  <div className="relative bg-[var(--color-surface)] p-4 rounded-xl shadow-sm border border-[var(--color-border)] flex items-center justify-center min-h-75 min-w-75">
                    {!qrLoading && currentQrCode ? (
                      <img
                        src={currentQrCode}
                        alt="Scan QR"
                        className="w-full h-full object-contain"
                        style={{ imageRendering: "pixelated" }}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-4">
                        <span className="loading loading-spinner loading-lg text-[var(--color-primary)] scale-150"></span>
                        <p className="text-sm text-[var(--color-text-muted)] mt-2">Mohon tunggu...</p>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleRefreshQR}
                    disabled={qrLoading}
                    className="btn btn-outline border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-border)] gap-2 rounded-xl px-6"
                  >
                    <FaSync className={qrLoading ? "animate-spin" : ""} />
                    {qrLoading ? "Memuat..." : "Refresh QR Code"}
                  </button>

                  <p className="text-sm text-[var(--color-text-muted)]">
                    Buka WhatsApp di HP {">"} Pengaturan {">"} Klik Ikon QR Code pada Profile {">"} Scan QR Code diatas
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlatformModal;
