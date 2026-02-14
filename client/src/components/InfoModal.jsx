import { FaCheckCircle, FaInfoCircle } from "react-icons/fa";

const InfoModal = ({ isOpen, onClose, title, message, type = "success" }) => {
  if (!isOpen) return null;

  const isSuccess = type === "success";

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-all duration-300">
      <div className="bg-[var(--color-bg)] rounded-2xl shadow-2xl w-full max-w-sm p-6 relative transform transition-all duration-300 scale-100 opacity-100 animate-[fadeIn_0.3s_ease-out] border border-[var(--color-border)]">
        <div className="flex flex-col items-center text-center mt-2">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 text-3xl ${isSuccess ? "bg-green-100 text-green-600" : "bg-[var(--color-primary)]/20 text-[var(--color-primary)]"}`}
          >
            {isSuccess ? <FaCheckCircle /> : <FaInfoCircle />}
          </div>

          <h3 className="text-xl font-bold text-[var(--color-primary)] mb-2">{title}</h3>
          <p className="text-[var(--color-text-muted)] text-sm mb-6 leading-relaxed">{message}</p>

          <button
            onClick={onClose}
            className="btn w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white border-none normal-case font-bold rounded-xl"
          >
            Mengerti
          </button>
        </div>
      </div>
    </div>
  );
};

export default InfoModal;
