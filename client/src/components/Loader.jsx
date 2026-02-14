import { FaCircleNotch } from "react-icons/fa";

const Loader = ({ type = "block", text = "Memuat data..." }) => {
  if (type === "fullscreen") {
    return (
      <div className="fixed inset-0 z-9999 bg-[var(--color-bg)]/90 backdrop-blur-sm flex flex-col items-center justify-center animate-[fadeIn_0.3s]">
        <div className="w-16 h-16 border-4 border-[var(--color-border)] border-t-[var(--color-primary)] rounded-full animate-spin"></div>
        <p className="mt-4 text-[var(--color-primary)] font-bold animate-pulse">{text}</p>
      </div>
    );
  }

  // Type: block (untuk di dalam tabel/card)
  return (
    <div className="w-full h-40 flex flex-col items-center justify-center text-[var(--color-text-muted)]">
      <FaCircleNotch className="animate-spin text-3xl mb-3 text-[var(--color-primary)]" />
      <p className="text-sm font-medium text-[var(--color-text)]">{text}</p>
    </div>
  );
};

export default Loader;
