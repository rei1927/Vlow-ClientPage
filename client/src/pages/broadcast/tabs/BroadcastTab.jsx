import React from "react";

const BroadcastTab = () => {
  const handleStartBroadcast = () => {
    console.log("Memulai broadcast...");
    // Nanti panggil backend API
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-white">Mulai Siaran (Broadcast)</h2>
      <p className="text-sm text-white/70 mb-6">
        Konfigurasi dan mulai jalankan kampanye broadcast Anda ke semua penerima.
      </p>
      
      <div className="bg-[var(--sidebar-bg)] p-5 rounded-lg border border-white/10 mb-6">
        <div className="mb-4">
          <label className="block text-sm text-white/70 mb-2">Pilih Template Pesan Meta</label>
          <select className="w-full bg-[var(--input-bg)] text-white border border-white/20 rounded-lg p-3 focus:outline-none focus:border-blue-500">
            <option value="">-- Pilih Template --</option>
            {/* Dinamis nanti */}
          </select>
        </div>
      </div>
      
      <div className="flex justify-end">
        <button
          onClick={handleStartBroadcast}
          className="bg-[var(--gradient-btn-start)] hover:bg-[var(--gradient-btn-end)] text-white font-semibold py-3 px-8 rounded-xl shadow-lg border border-white/20 transition-all hover:scale-105"
          style={{ background: 'linear-gradient(135deg, #FF6B6B 0%, #C0392B 100%)' }}
        >
          Kirim Broadcast Sekarang
        </button>
      </div>
    </div>
  );
};

export default BroadcastTab;
