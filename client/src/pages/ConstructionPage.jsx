import { FaTools, FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const ConstructionPage = ({ title = "Fitur Dalam Pengembangan" }) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 animate-[fadeIn_0.5s_ease-out]">
      <div className="w-20 h-20 bg-blue-50 text-[#1C4D8D] rounded-full flex items-center justify-center mb-6 shadow-sm">
        <FaTools size={32} />
      </div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">{title}</h2>
      <p className="text-gray-500 max-w-md mb-8">
        Halaman ini sedang disiapkan oleh tim developer kami. Nantikan update fitur terbaru dalam
        waktu dekat.
      </p>
      <button
        onClick={() => navigate(-1)}
        className="btn btn-outline border-gray-300 text-gray-600 hover:bg-[#1C4D8D] hover:text-white hover:border-[#1C4D8D] normal-case gap-2"
      >
        <FaArrowLeft /> Kembali
      </button>
    </div>
  );
};

export default ConstructionPage;
