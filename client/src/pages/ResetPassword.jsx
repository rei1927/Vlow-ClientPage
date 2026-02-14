import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { resetPasswordUser, reset } from "../features/auth/authSlice";
import toast from "react-hot-toast";
import { FaLock, FaEye, FaEyeSlash, FaArrowRight, FaCircleNotch } from "react-icons/fa";
import InfoModal from "../components/InfoModal";

const ResetPassword = () => {
  const { resetToken } = useParams(); // Ambil token dari URL
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isLoading, isError, isSuccess, message } = useSelector((state) => state.auth);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    dispatch(reset());
  }, [dispatch]);

  useEffect(() => {
    if (isError) {
      toast.error(message);
      dispatch(reset());
    }

    // --- UPDATE LOGIC SUKSES ---
    if (isSuccess) {
      // Opsi A: Langsung Toast & Redirect
      // toast.success("Password berhasil diubah. Silakan login.");
      // navigate("/login");

      // Opsi B (Lebih User Friendly): Tampilkan Modal dulu
      setShowSuccessModal(true);
      dispatch(reset());
    }
  }, [isError, isSuccess, message, dispatch]);

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    navigate("/login"); // Redirect ke login saat user klik OK di modal
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      toast.error("Mohon isi password baru.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Konfirmasi password tidak cocok.");
      return;
    }
    if (password.length < 8) {
      toast.error("Password minimal 8 karakter.");
      return;
    }
    dispatch(resetPasswordUser({ token: resetToken, password }));
  };

  return (
    <div className="min-h-screen flex bg-[var(--color-bg)] font-sans overflow-hidden">
      <InfoModal
        isOpen={showSuccessModal}
        onClose={handleSuccessClose}
        title="Password Berhasil Diubah"
        message="Keamanan akun Anda telah diperbarui. Silakan login kembali menggunakan password baru Anda."
        type="success"
      />
      {/* --- KIRI: Branding --- */}
      <div className="hidden lg:flex w-5/12 bg-[var(--color-primary)] relative flex-col justify-between p-12 text-white">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-125 h-125 bg-[#4988C4]/40 rounded-full blur-3xl"></div>
        </div>
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold tracking-wide flex items-center gap-2">
            Sapaku<span className="text-[#BDE8F5]">.ai</span>
          </h1>
        </div>
        <div className="relative z-10 mb-20">
          <h2 className="text-4xl font-bold leading-tight mb-4">
            Keamanan Akun <br /> <span className="text-[#BDE8F5]">Prioritas Utama.</span>
          </h2>
          <p className="text-lg text-white/80 max-w-sm border-l-4 border-[#BDE8F5] pl-4 py-1">
            Buat password baru yang kuat untuk melindungi data dan agen AI Anda.
          </p>
        </div>
        <div className="relative z-10 text-xs text-white/40">
          © {new Date().getFullYear()} Sapaku.ai Technology.
        </div>
      </div>
      {/* --- KANAN: Form --- */}
      <div className="w-full lg:w-7/12 flex items-center justify-center p-6 md:p-12 bg-[var(--color-surface)]">
        <div className="w-full max-w-md bg-[var(--color-bg)] p-10 rounded-3xl shadow-xl border border-[var(--color-border)] animate-[fadeInUp_0.8s_ease-out]">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-[var(--color-primary)]">Password Baru</h2>
            <p className="text-[var(--color-text-muted)] mt-2">Silakan masukkan password baru untuk akun Anda.</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-6">
            <div className="form-control group">
              <label className="label text-xs font-bold text-[var(--color-text-muted)] uppercase">
                Password Baru
              </label>
              <div className="relative">
                <div className="absolute z-10 inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[var(--color-text-muted)] group-focus-within:text-[var(--color-primary)] transition-colors">
                  <FaLock />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input input-bordered w-full pl-12 pr-12 py-6 bg-[var(--color-surface)] focus:bg-[var(--color-bg)] focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10 rounded-xl transition-all border-[var(--color-border)] text-[var(--color-text)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-[var(--color-text-muted)] hover:text-[var(--color-primary)] cursor-pointer"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div className="form-control group">
              <label className="label text-xs font-bold text-[var(--color-text-muted)] uppercase">
                Konfirmasi Password
              </label>
              <div className="relative">
                <div className="absolute z-10 inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[var(--color-text-muted)] group-focus-within:text-[var(--color-primary)] transition-colors">
                  <FaLock />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input input-bordered w-full pl-12 pr-12 py-6 bg-[var(--color-surface)] focus:bg-[var(--color-bg)] focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10 rounded-xl transition-all border-[var(--color-border)] text-[var(--color-text)]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white border-none shadow-lg normal-case text-lg font-bold py-3 rounded-xl transition-all disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <FaCircleNotch className="animate-spin" /> Loading...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Ubah Password <FaArrowRight size={14} />
                </span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
