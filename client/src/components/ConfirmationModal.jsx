import { FaExclamationTriangle, FaInfoCircle } from "react-icons/fa";
import { IoIosAlert } from "react-icons/io";

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  variant = "danger", // Mengatur Warna & Icon (danger | warning | info)
  confirmText = "Konfirmasi", // Default Text (Bisa di-override)
  cancelText = "Batal", // Default Text (Bisa di-override)
  isLoading = false,
}) => {
  if (!isOpen) return null;

  // Konfigurasi Visual (Hanya Icon & Warna Background)
  const configs = {
    danger: {
      icon: <IoIosAlert />, // Atau icon lain jika perlu, tapi Trash default untuk danger
      iconBg: "bg-red-100 text-red-600",
      btnColor: "bg-red-600 hover:bg-red-700",
      focusRing: "focus:ring-red-500",
    },
    warning: {
      icon: <FaExclamationTriangle />,
      iconBg: "bg-yellow-100 text-yellow-600",
      btnColor: "bg-yellow-500 hover:bg-yellow-600",
      focusRing: "focus:ring-yellow-500",
    },
    info: {
      icon: <FaInfoCircle />,
      iconBg: "bg-blue-100 text-blue-600",
      btnColor: "bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]",
      focusRing: "focus:ring-[var(--color-primary)]",
    },
  };

  const config = configs[variant] || configs.info;

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-[var(--color-bg)] rounded-2xl shadow-2xl w-full max-w-sm p-6 m-4 transform transition-all scale-100 animate-[scaleIn_0.2s_ease-out] border border-[var(--color-border)]">
        <div className="flex flex-col items-center text-center">
          {/* Icon Header */}
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 text-2xl ${config.iconBg}`}
          >
            {config.icon}
          </div>

          <h3 className="text-xl font-bold text-[var(--color-text)] mb-2">{title}</h3>
          <p className="text-[var(--color-text-muted)] text-sm leading-relaxed mb-6">{message}</p>

          <div className="flex gap-3 w-full">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 rounded-xl text-[var(--color-text)] font-medium hover:bg-[var(--color-border)] border border-[var(--color-border)] transition-colors disabled:opacity-50"
            >
              {cancelText}
            </button>

            {/* Tombol Confirm (Text Dinamis dari Props) */}
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex-1 px-4 py-2.5 rounded-xl text-white font-medium shadow-lg transition-all flex justify-center items-center gap-2 disabled:opacity-70 ${config.btnColor}`}
            >
              {isLoading ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                </>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
