import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import toast from "react-hot-toast";
import { FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import { logoutUser, reset } from "../features/auth/authSlice";

const ChangePassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const onSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      return toast.error("Konfirmasi password tidak cocok.");
    }
    if (password.length < 8) {
      return toast.error("Password minimal 8 karakter.");
    }

    setIsLoading(true);
    try {
      await axiosInstance.put("/auth/change-password", { password });

      toast.success("Password berhasil diperbarui! Silakan login ulang.");

      await dispatch(logoutUser());
      dispatch(reset());
      navigate("/login");
    } catch (error) {
      const msg = error.response?.data?.message || "Gagal mengubah password";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] p-6">
      <div className="w-full max-w-md bg-[var(--color-surface)] rounded-3xl shadow-xl p-10 border border-[var(--color-border)]">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[var(--color-primary)]/20 text-[var(--color-primary)] rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
            <FaLock />
          </div>
          <h2 className="text-2xl font-bold text-[var(--color-primary)]">Selamat Datang, {user?.name}</h2>
          <p className="text-[var(--color-text-muted)] mt-2 text-sm">
            Untuk keamanan akun, Anda wajib mengubah password sementara Anda sebelum melanjutkan.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="form-control">
            <label className="label text-xs font-bold text-[var(--color-text-muted)] uppercase">Password Baru</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="input input-bordered w-full rounded-xl pr-12 bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-text)]"
                placeholder="Minimal 8 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                disabled={isLoading}
                className="absolute inset-y-0 right-0 px-4 flex items-center text-[var(--color-text-muted)] hover:text-[var(--color-text)] disabled:opacity-50"
                tabIndex={-1}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <div className="form-control">
            <label className="label text-xs font-bold text-[var(--color-text-muted)] uppercase">
              Konfirmasi Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                className="input input-bordered w-full rounded-xl pr-12 bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-text)]"
                placeholder="Ulangi password baru"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                disabled={isLoading}
                className="absolute inset-y-0 right-0 px-4 flex items-center text-[var(--color-text-muted)] hover:text-[var(--color-text)] disabled:opacity-50"
                tabIndex={-1}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white border-none rounded-xl mt-4 disabled:opacity-80"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="loading loading-spinner loading-sm"></span>
                <span>Menyimpan...</span>
              </span>
            ) : (
              "Simpan & Lanjutkan"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;
