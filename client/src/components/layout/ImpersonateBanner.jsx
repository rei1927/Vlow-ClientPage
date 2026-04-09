import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { stopImpersonateUser, reset } from "../../features/auth/authSlice";
import { FaSignOutAlt, FaEye } from "react-icons/fa";
import toast from "react-hot-toast";

const ImpersonateBanner = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isImpersonating, user, originalAdmin } = useSelector((state) => state.auth);

  if (!isImpersonating || !originalAdmin) return null;

  const handleStopImpersonating = async () => {
    try {
      await dispatch(stopImpersonateUser(originalAdmin.id)).unwrap();
      dispatch(reset());
      toast.success("Kembali ke akun Admin.");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err || "Gagal kembali ke akun admin.");
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg">
      <div className="flex items-center justify-between px-4 py-2 max-w-screen-2xl mx-auto">
        <div className="flex items-center gap-2 text-sm font-medium">
          <FaEye className="text-white/80" />
          <span>
            Anda sedang melihat dashboard sebagai{" "}
            <strong className="font-bold">{user?.name}</strong>
            <span className="opacity-75 ml-1">({user?.email})</span>
          </span>
        </div>
        <button
          onClick={handleStopImpersonating}
          className="flex items-center gap-2 px-4 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-semibold transition-all duration-200 backdrop-blur-sm border border-white/30"
        >
          <FaSignOutAlt />
          Kembali ke Admin
        </button>
      </div>
    </div>
  );
};

export default ImpersonateBanner;
