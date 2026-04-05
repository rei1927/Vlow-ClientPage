import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import toast from "react-hot-toast";
import { FaUser, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import { logoutUser, reset } from "../features/auth/authSlice";

const Profile = () => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const onSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      return toast.error("Konfirmasi password baru tidak cocok.");
    }

    setIsLoading(true);
    try {
      await axiosInstance.put("/auth/profile/password", {
        oldPassword,
        newPassword,
      });

      toast.success("Password berhasil diperbarui! Silakan sign in ulang dengan password baru.");

      // Clean state & log out user after password change
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      await dispatch(logoutUser());
      dispatch(reset());
      navigate("/login");
    } catch (error) {
      const msg = error.response?.data?.message || "Gagal memperbarui password";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-[var(--color-primary)] to-purple-600 bg-clip-text text-transparent">
          Profil Pengguna
        </h1>
        <p className="text-[var(--color-text-muted)] text-sm mt-1">
          Informasi akun dan pengaturan keamanan.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Info Pengguna */}
        <div className="lg:col-span-1 border border-[var(--color-border)] rounded-2xl bg-[var(--color-surface)] shadow-sm overflow-hidden flex flex-col items-center p-6 space-y-4 h-fit">
          <div className="w-24 h-24 bg-[var(--color-primary)]/20 text-[var(--color-primary)] rounded-full flex items-center justify-center text-4xl shadow-sm ring-4 ring-[var(--color-bg)]">
            {user?.name?.charAt(0).toUpperCase() || <FaUser />}
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-[var(--color-text)]">{user?.name}</h2>
            <p className="text-[var(--color-text-muted)] text-sm">{user?.email}</p>
            <span className="inline-block mt-3 text-[10px] uppercase font-bold tracking-wider text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-3 py-1 rounded-full border border-[var(--color-primary)]/20">
              {user?.role}
            </span>
          </div>
        </div>

        {/* Kolom Ganti Password */}
        <div className="lg:col-span-2 border border-[var(--color-border)] rounded-2xl bg-[var(--color-surface)] shadow-sm p-6 lg:p-8 relative overflow-hidden">
          {/* Latar Belakang dekoratif */}
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-[var(--color-primary)] opacity-5 rounded-full blur-2xl"></div>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[var(--color-primary)]/10 text-[var(--color-primary)] rounded-xl flex items-center justify-center">
              <FaLock />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--color-text)]">Ganti Password</h2>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                Pastikan kombinasi password Anda kuat (Minimal 8 karakter, huruf besar, huruf kecil, angka, dan simbol).
              </p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-5 relative z-10 w-full max-w-lg">
            <div className="form-control">
              <label className="label text-xs font-bold text-[var(--color-text-muted)] uppercase">Password Lama</label>
              <div className="relative">
                <input
                  type={showOldPassword ? "text" : "password"}
                  className="input input-bordered w-full rounded-xl pr-12 bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-text)] text-sm focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]/20 focus:ring-4 transition-all"
                  placeholder="Masukkan password saat ini"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword((prev) => !prev)}
                  disabled={isLoading}
                  className="absolute inset-y-0 right-0 px-4 flex items-center text-[var(--color-text-muted)] hover:text-[var(--color-text)] disabled:opacity-50"
                  tabIndex={-1}
                >
                  {showOldPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div className="form-control">
              <label className="label text-xs font-bold text-[var(--color-text-muted)] uppercase">Password Baru</label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  className="input input-bordered w-full rounded-xl pr-12 bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-text)] text-sm focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]/20 focus:ring-4 transition-all"
                  placeholder="Minimal 8 karakter (Huruf besar, angka, simbol)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  disabled={isLoading}
                  className="absolute inset-y-0 right-0 px-4 flex items-center text-[var(--color-text-muted)] hover:text-[var(--color-text)] disabled:opacity-50"
                  tabIndex={-1}
                >
                  {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div className="form-control">
              <label className="label text-xs font-bold text-[var(--color-text-muted)] uppercase">
                Konfirmasi Password Baru
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className="input input-bordered w-full rounded-xl pr-12 bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-text)] text-sm focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]/20 focus:ring-4 transition-all"
                  placeholder="Ulangi password baru Anda"
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

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading || !oldPassword || !newPassword || !confirmPassword}
                className="btn bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white border-none rounded-xl disabled:opacity-80 disabled:cursor-not-allowed shadow-[0_4px_12px_var(--color-primary-glow)] px-6"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="loading loading-spinner loading-sm"></span>
                    <span>Menyimpan...</span>
                  </span>
                ) : (
                  "Simpan Password Baru"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
