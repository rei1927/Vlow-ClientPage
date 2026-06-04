import { FaHistory, FaBrain, FaToggleOff } from "react-icons/fa";

const AdvancedSettingsTab = ({ config, setConfig }) => {
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setConfig((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : type === "number" ? parseInt(value) || 0 : value,
    }));
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <FaBrain className="text-8xl text-white" />
        </div>
        
        <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
          <FaBrain className="text-purple-400" /> Advanced Settings
        </h3>
        <p className="text-gray-400 text-sm mb-6 max-w-2xl">
          Konfigurasi tingkat lanjut untuk mengontrol seberapa pintar dan responsif AI Agent Anda dalam berinteraksi.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* AI History Limit */}
          <div className="bg-gray-900/50 rounded-lg p-5 border border-gray-700/50">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-500/20 rounded-lg">
                <FaHistory className="text-indigo-400" />
              </div>
              <label className="block text-sm font-medium text-gray-200">
                AI History Limit
              </label>
            </div>
            <p className="text-xs text-gray-400 mb-3">
              Batas jumlah pesan terakhir (dari user dan AI) yang akan diingat oleh AI dalam satu sesi percakapan. Angka yang lebih kecil menghemat kuota Token.
            </p>
            <input
              type="number"
              name="aiHistoryLimit"
              min="1"
              max="200"
              value={config.aiHistoryLimit || 50}
              onChange={handleChange}
              className="w-full bg-gray-800 text-white rounded-lg border-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors p-2.5"
              placeholder="Contoh: 50"
            />
          </div>

          {/* Placeholder for future settings */}
          <div className="bg-gray-900/50 rounded-lg p-5 border border-gray-700/50 opacity-50 cursor-not-allowed">
             <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gray-500/20 rounded-lg">
                <FaToggleOff className="text-gray-400" />
              </div>
              <label className="block text-sm font-medium text-gray-200">
                Fitur Lainnya
              </label>
            </div>
            <p className="text-xs text-gray-400 mb-3">
              Fitur tingkat lanjut lainnya seperti AI Temperature, Message Await, dll akan segera hadir.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedSettingsTab;
