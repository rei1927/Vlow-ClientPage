import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom"; // Tambah useNavigate
import { forgotPasswordUser, reset } from "../features/auth/authSlice";
import toast from "react-hot-toast";
import { FaEnvelope, FaArrowLeft, FaCircleNotch, FaPaperPlane } from "react-icons/fa";
import InfoModal from "../components/InfoModal";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [showModal, setShowModal] = useState(false);

  const navigate = useNavigate(); // Init hook
  const dispatch = useDispatch();
  const { isLoading, isError, isSuccess, message } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(reset());
  }, [dispatch]);

  useEffect(() => {
    if (isError) {
      toast.error(message);
      dispatch(reset());
    }
    if (isSuccess && message) {
      setShowModal(true);
      dispatch(reset());
    }
  }, [isError, isSuccess, message, dispatch]);

  const onSubmit = (e) => {
    e.preventDefault();
    if (!email) {
      toast.error("Mohon masukkan email Anda.");
      return;
    }
    dispatch(forgotPasswordUser(email));
  };

  // --- LOGIC BARU: Handle Tutup Modal -> Redirect Login ---
  const handleCloseModal = () => {
    setShowModal(false);
    navigate("/login"); // Arahkan user ke login agar tidak bingung
  };

  return (
    <div className="min-h-screen flex bg-[var(--color-bg)] font-sans overflow-hidden">
      {/* Update onClose disini */}
      <InfoModal
        isOpen={showModal}
        onClose={handleCloseModal}
        title="Email Terkirim"
        message={`Kami telah mengirimkan instruksi reset password ke ${email}. Silakan cek kotak masuk atau folder spam email Anda, lalu login kembali.`}
        type="success"
      />

      {/* ... SISA KODE TAMPILAN SAMA PERSIS SEPERTI SEBELUMNYA ... */}
      <div className="hidden lg:flex w-5/12 bg-[var(--color-primary)] relative flex-col justify-between p-12 text-white">
        {/* ... Branding ... */}
        <div className="relative z-10">
          <Link
            to="/login"
            className="text-3xl font-extrabold tracking-wide flex items-center gap-2"
          >
            Sapaku<span className="text-[#BDE8F5]">.ai</span>
          </Link>
        </div>
        {/* ... Content Kiri ... */}
        <div className="relative z-10 mb-20">
          <h2 className="text-4xl font-bold leading-tight mb-4">
            Lupa Password? <br /> <span className="text-[#BDE8F5]">Jangan Khawatir.</span>
          </h2>
          <p className="text-lg text-white/80 max-w-sm border-l-4 border-[#BDE8F5] pl-4 py-1">
            Kami akan membantu mengembalikan akses akun Anda dalam beberapa langkah mudah.
          </p>
        </div>
        <div className="relative z-10 text-xs text-white/40">
          © {new Date().getFullYear()} Sapaku.ai Technology.
        </div>
      </div>

      <div className="w-full lg:w-7/12 flex items-center justify-center p-6 md:p-12 bg-[var(--color-surface)]">
        <div className="w-full max-w-md bg-[var(--color-bg)] p-10 rounded-3xl shadow-xl border border-[var(--color-border)] animate-[fadeInUp_0.8s_ease-out]">
          <Link
            to="/login"
            className="inline-flex items-center text-sm text-[var(--color-text-muted)] hover:text-[var(--color-primary)] mb-6 transition-colors"
          >
            <FaArrowLeft className="mr-2" /> Kembali ke Login
          </Link>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-[var(--color-primary)]">Reset Password</h2>
            <p className="text-[var(--color-text-muted)] mt-2">
              Masukkan email yang terdaftar untuk menerima link reset.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-6">
            <div className="form-control group">
              <label className="label text-xs font-bold text-[var(--color-text-muted)] uppercase">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute z-10 inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[var(--color-text-muted)] group-focus-within:text-[var(--color-primary)] transition-colors">
                  <FaEnvelope size={18} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="input input-bordered w-full pl-12 py-6 bg-[var(--color-surface)] focus:bg-[var(--color-bg)] focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10 rounded-xl transition-all border-[var(--color-border)] text-[var(--color-text)]"
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
                  <FaCircleNotch className="animate-spin" /> Mengirim...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Kirim Link Reset <FaPaperPlane size={14} />
                </span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
