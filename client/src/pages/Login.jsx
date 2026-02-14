import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { loginUser, reset } from "../features/auth/authSlice";
import toast from "react-hot-toast";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaArrowRight, FaCircleNotch } from "react-icons/fa";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  // State untuk Efek Animasi (Fade In)
  const [isVisible, setIsVisible] = useState(false);

  const { email, password } = formData;
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, isLoading, isError, isSuccess, message } = useSelector((state) => state.auth);

  // Trigger Animasi saat halaman dimuat
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Handle Auth Response
  useEffect(() => {
    if (isError) {
      toast.error(message);
      dispatch(reset()); // Reset agar error tidak nyangkut
    }

    // Cek jika login sukses ATAU user sudah ada di state
    if (isSuccess || user) {
      // PENTING: Cek flag isFirstLogin
      if (user?.isFirstLogin) {
        navigate("/change-password");
      } else {
        navigate("/dashboard");
      }
      dispatch(reset());
    }
  }, [user, isError, isSuccess, message, navigate, dispatch]);

  const onChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Email dan password wajib diisi!.");
      return;
    }
    dispatch(loginUser(formData));
  };

  return (
    <div className="min-h-screen flex bg-[var(--color-bg)] overflow-hidden font-sans">
      {/* --- KIRI: Branding (Desktop) --- */}
      <div
        className={`hidden lg:flex w-5/12 bg-[var(--color-primary)] relative flex-col justify-between p-12 text-white transition-all duration-1000 ease-out transform ${isVisible ? "translate-x-0 opacity-100" : "-translate-x-10 opacity-0"}`}
      >
        {/* Abstract Shapes (Tailwind only) */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-white opacity-10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-[#4988C4] opacity-30 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold tracking-wide flex items-center gap-2">
            Sapaku<span className="text-[#BDE8F5]">.ai</span>
          </h1>
        </div>

        <div className="relative z-10 mb-10">
          <h2 className="text-5xl font-bold leading-tight mb-6">
            Intelligent <br /> <span className="text-[#BDE8F5]">Management.</span>
          </h2>
          <p className="text-lg text-white/80 max-w-sm border-l-4 border-[#BDE8F5] pl-4 py-1">
            Platform terintegrasi untuk mengelola AI Agents dan performa bisnis Anda secara
            real-time.
          </p>
        </div>

        <div className="relative z-10 text-xs text-white/40">
          © {new Date().getFullYear()} Sapaku.ai Technology.
        </div>
      </div>

      {/* --- KANAN: Login Form --- */}
      <div className="w-full lg:w-7/12 flex items-center justify-center p-6 bg-[var(--color-surface)]">
        <div
          className={`w-full max-w-md bg-[var(--color-bg)] p-8 md:p-10 rounded-3xl shadow-lg border border-[var(--color-border)] transition-all duration-1000 delay-300 ease-out transform ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
        >
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-3xl font-extrabold text-[var(--color-primary)]">
              Sapaku<span className="opacity-80">.ai</span>
            </h1>
          </div>

          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-[var(--color-primary)]">Selamat Datang</h2>
            <p className="text-[var(--color-text-muted)] text-sm mt-2">Silakan masuk menggunakan akun terdaftar.</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            {/* Input Email */}
            <div className="form-control">
              <label className="label text-xs font-bold text-[var(--color-text-muted)] uppercase">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute z-10 inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[var(--color-text-muted)] group-focus-within:text-[var(--color-primary)] transition-colors">
                  <FaEnvelope />
                </div>
                <input
                  type="email"
                  name="email"
                  value={email}
                  onChange={onChange}
                  placeholder="name@company.com"
                  className="input input-bordered w-full pl-11 bg-[var(--color-surface)] focus:bg-[var(--color-bg)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 rounded-xl transition-all h-12 border-[var(--color-border)] text-[var(--color-text)]"
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label flex justify-between">
                <span className="text-xs font-bold text-[var(--color-text-muted)] uppercase">Password</span>
              </label>
              <div className="relative group">
                <div className="absolute z-10 inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[var(--color-text-muted)] group-focus-within:text-[var(--color-primary)] transition-colors">
                  <FaLock />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={password}
                  onChange={onChange}
                  placeholder="**********"
                  className="input input-bordered w-full pl-11 pr-12 bg-[var(--color-surface)] focus:bg-[var(--color-bg)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 rounded-xl transition-all h-12 border-[var(--color-border)] text-[var(--color-text)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-[var(--color-text-muted)] hover:text-[var(--color-primary)] cursor-pointer transition-colors"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>

              <div className="flex w-full justify-end items-center mt-1.5">
                <Link
                  to="/forgot-password"
                  className="text-sm font-semibold text-[var(--color-primary)] hover:underline transition-colors"
                >
                  Lupa Password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              className="btn w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white border-none shadow-lg normal-case text-lg font-bold h-12 rounded-xl mt-1 transition-transform active:scale-95"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <FaCircleNotch className="animate-spin" /> Loading...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Masuk <FaArrowRight size={14} />
                </span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
