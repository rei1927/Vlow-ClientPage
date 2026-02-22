import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { forgotPasswordUser, reset } from "../features/auth/authSlice";
import toast from "react-hot-toast";
import { FaEnvelope, FaCircleNotch } from "react-icons/fa";
import InfoModal from "../components/InfoModal";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isLoading, isError, isSuccess, message } = useSelector((state) => state.auth);

  useEffect(() => {
    setIsVisible(true);
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

  const handleCloseModal = () => {
    setShowModal(false);
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#4facfe] to-[#4481eb] p-6 relative overflow-hidden font-sans">

      <InfoModal
        isOpen={showModal}
        onClose={handleCloseModal}
        title="Email Terkirim"
        message={`Kami telah mengirimkan instruksi reset password ke ${email}. Silakan cek kotak masuk atau folder spam email Anda, lalu login kembali.`}
        type="success"
      />

      {/* Background Shapes */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[15%] -left-[10%] w-[500px] h-[500px] opacity-10 flex items-center justify-center">
          <div className="w-[80%] h-[80%] border-[40px] border-white rounded-full"></div>
          <div className="absolute w-[40%] h-[40%] bg-white rounded-full"></div>
        </div>
        <div className="absolute -bottom-[20%] right-0 w-[600px] h-[600px] opacity-10 flex items-center justify-center">
          <div className="w-[70%] h-[70%] border-[30px] border-white rounded-[100px] rotate-45"></div>
        </div>
        <div className="absolute bottom-[5%] -left-[5%] w-[100px] h-[300px] bg-white opacity-10 rounded-full"></div>
      </div>

      <div className={`w-full max-w-md bg-white p-8 md:p-10 rounded-2xl shadow-2xl relative z-10 transition-all duration-1000 ease-out transform ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}>

        {/* Logo Area */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-extrabold text-[#4481eb] flex items-center justify-center gap-2">
            <img src="/vlow-icon.png" alt="Vlow Logo" className="h-12 w-auto" />
            Vlow<span className="text-[#4facfe]">.ai</span>
          </h1>
        </div>

        <div className="mb-8 text-center mt-2">
          <h2 className="text-2xl font-bold text-gray-800">Forgot Password</h2>
          <p className="text-gray-400 text-sm mt-1">To continue, please enter your email first</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">

          <div className="form-control">
            <div className="relative flex items-center bg-[#F3F6FB] rounded-xl border border-transparent focus-within:border-[#82b4ff] transition-all px-4 py-1 h-12">
              <FaEnvelope className="text-gray-400 mr-3 text-sm" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="bg-transparent w-full text-sm text-gray-700 outline-none placeholder-gray-400"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-[#7bacff] hover:bg-[#689fff] text-white font-semibold text-sm h-12 rounded-xl mt-6 transition-colors shadow-none flex items-center justify-center gap-2 active:scale-[0.98]"
            disabled={isLoading}
            style={{ marginTop: '24px' }}
          >
            {isLoading ? (
              <><FaCircleNotch className="animate-spin" /> Mengirim...</>
            ) : (
              "Submit"
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-600">
          Remembered your password?{" "}
          <Link
            to="/login"
            className="font-semibold text-[#689fff] hover:underline transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>

      <div className={`mt-10 text-center max-w-xl relative z-10 px-4 transition-all duration-1000 delay-300 ease-out transform ${isVisible ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"}`}>
        <p className="text-white/90 text-sm leading-relaxed drop-shadow-sm font-medium">
          Serve your customers 24/7 with AI agents that work on autopilot. Boost sales, improve support, and grow your business faster. All in one powerful AI + Omnichannel CRM platform.
        </p>
      </div>

    </div>
  );
};

export default ForgotPassword;
