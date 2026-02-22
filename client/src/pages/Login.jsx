import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { loginUser, reset } from "../features/auth/authSlice";
import toast from "react-hot-toast";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaCircleNotch } from "react-icons/fa";

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#4facfe] to-[#4481eb] p-6 relative overflow-hidden font-sans">

      {/* Background Shapes / Watermarks for aesthetics */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        {/* Top Left Pattern */}
        <div className="absolute -top-[15%] -left-[10%] w-[500px] h-[500px] opacity-10 flex items-center justify-center">
          <div className="w-[80%] h-[80%] border-[40px] border-white rounded-full"></div>
          <div className="absolute w-[40%] h-[40%] bg-white rounded-full"></div>
        </div>

        {/* Bottom Right Pattern */}
        <div className="absolute -bottom-[20%] right-0 w-[600px] h-[600px] opacity-10 flex items-center justify-center">
          <div className="w-[70%] h-[70%] border-[30px] border-white rounded-[100px] rotate-45"></div>
        </div>

        {/* Bottom Left Pattern */}
        <div className="absolute bottom-[5%] -left-[5%] w-[100px] h-[300px] bg-white opacity-10 rounded-full"></div>
      </div>

      <div className={`w-full max-w-md bg-white p-8 md:p-10 rounded-2xl shadow-2xl relative z-10 transition-all duration-1000 ease-out transform ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}>

        {/* Logo Area */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-extrabold text-[#4481eb] flex items-center justify-center gap-1">
            <span className="bg-[#4481eb] text-white px-2 py-0.5 rounded-full text-xl mr-1">V</span>
            Vlow<span className="text-[#4facfe]">.ai</span>
          </h1>
        </div>

        <div className="mb-8 text-center mt-2">
          <h2 className="text-2xl font-bold text-gray-800">Welcome Back</h2>
          <p className="text-gray-400 text-sm mt-1">Login to your account</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">

          {/* Input Email */}
          <div className="form-control">
            <div className="relative flex items-center bg-[#F3F6FB] rounded-xl border border-transparent focus-within:border-[#82b4ff] transition-all px-4 py-1 h-12">
              <FaEnvelope className="text-gray-400 mr-3 text-sm" />
              <input
                type="email"
                name="email"
                value={email}
                onChange={onChange}
                placeholder="Email"
                className="bg-transparent w-full text-sm text-gray-700 outline-none placeholder-gray-400"
              />
            </div>
          </div>

          {/* Input Password */}
          <div className="form-control">
            <div className="relative flex items-center bg-[#F3F6FB] rounded-xl border border-transparent focus-within:border-[#82b4ff] transition-all px-4 py-1 h-12">
              <FaLock className="text-gray-400 mr-3 text-sm" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={password}
                onChange={onChange}
                placeholder="Password"
                className="bg-transparent w-full text-sm text-gray-700 outline-none placeholder-gray-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none transition-colors ml-2"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-[#7bacff] hover:bg-[#689fff] text-white font-semibold text-sm h-12 rounded-xl mt-6 transition-colors shadow-none flex items-center justify-center gap-2 active:scale-[0.98]"
            disabled={isLoading}
            style={{ marginTop: '24px' }}
          >
            {isLoading ? (
              <><FaCircleNotch className="animate-spin" /> Sedang Masuk...</>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm">
          <Link
            to="/forgot-password"
            className="font-semibold text-[#689fff] hover:underline transition-colors"
          >
            Forgot your password?
          </Link>
        </div>

        <div className="mt-8 text-center text-xs text-gray-400">
          <p>Don't have an account yet?</p>
          <Link to="#" className="text-[#689fff] font-semibold hover:underline mt-1 inline-block">
            Create an Account
          </Link>
        </div>
      </div>

      {/* Footer Text */}
      <div className={`mt-10 text-center max-w-xl relative z-10 px-4 transition-all duration-1000 delay-300 ease-out transform ${isVisible ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"}`}>
        <p className="text-white/90 text-sm leading-relaxed drop-shadow-sm font-medium">
          Serve your customers 24/7 with AI agents that work on autopilot. Boost sales, improve support, and grow your business faster. All in one powerful AI + Omnichannel CRM platform.
        </p>
      </div>

    </div>
  );
};

export default Login;
