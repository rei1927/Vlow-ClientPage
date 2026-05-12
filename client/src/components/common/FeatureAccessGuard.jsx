import React from "react";
import { useSelector } from "react-redux";
import { FaLock } from "react-icons/fa";

/**
 * FeatureAccessGuard
 * Komponen pembungkus berteknologi Glassmorphism Premium untuk mengunci akses halaman fitur
 * jika admin tidak memberikan hak akses (mencentang checkbox fitur) kepada pengguna tersebut.
 */
const FeatureAccessGuard = ({ feature, children }) => {
  const { user } = useSelector((state) => state.auth);

  // Admin selalu bisa mengakses semua fitur
  if (user?.role === "admin") {
    return <>{children}</>;
  }

  // Cek apakah fitur diizinkan (default bernilai true jika belum diset untuk backwards-compatibility)
  const isFeatureAllowed = (() => {
    if (!user || !user.features) return true;
    return user.features[feature] !== false;
  })();

  if (isFeatureAllowed) {
    return <>{children}</>;
  }

  // Tampilan Terkunci (Premium Locked Overlay)
  return (
    <div className="relative w-full min-h-[calc(100vh-120px)] flex flex-col overflow-hidden rounded-2xl">
      {/* Konten Asli dengan Efek Blur & Disable Interaksi */}
      <div className="flex-1 w-full filter blur-[8px] opacity-40 pointer-events-none select-none transition-all duration-300">
        {children}
      </div>

      {/* Overlay Glassmorphism Berada di Atas */}
      <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/10 dark:bg-black/40 backdrop-blur-sm animate-[fadeIn_0.4s_ease-out]">
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/40 dark:border-white/10 p-8 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] max-w-md w-full text-center flex flex-col items-center transform transition-all hover:scale-[1.02]">
          {/* Glowing Animated Lock Icon */}
          <div className="relative mb-6">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full blur opacity-70 animate-pulse"></div>
            <div className="relative w-20 h-20 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white shadow-xl">
              <FaLock className="text-3xl animate-bounce" style={{ animationDuration: "2s" }} />
            </div>
          </div>

          {/* Judul & Pesan Premium */}
          <h3 className="text-xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-tight">
            Akses Fitur Terkunci
          </h3>
          
          <div className="w-12 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full mb-4"></div>

          <p className="text-sm font-medium text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
            Fitur ini belum terbuka, silahkan hubungi admin untuk mengaktifkan kapabilitas layanan ini pada akun Anda.
          </p>

          {/* Tombol Aksi Opsional */}
          <a
            href="https://wa.me/"
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              // Mencegah link kosong membuka tab baru
              e.preventDefault();
              alert("Silakan hubungi administrator sistem melalui jalur komunikasi resmi.");
            }}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all hover:shadow-lg"
          >
            Hubungi Administrator
          </a>
        </div>
      </div>
    </div>
  );
};

export default FeatureAccessGuard;
