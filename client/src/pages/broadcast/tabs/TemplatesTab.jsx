import React from "react";

const TemplatesTab = () => {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-white">Manajemen Template Meta</h2>
      <p className="text-sm text-white/70 mb-4">
        Di sini Anda dapat melakukan sinkronisasi dan melihat template WhatsApp yang disetujui dari Meta Business Manager.
      </p>
      
      <div className="text-center p-8 border border-dashed border-white/20 rounded-lg bg-[var(--sidebar-bg)]">
        <p className="text-white/50 mb-4">Belum ada template tersinkronisasi.</p>
        <button className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-5 rounded-lg transition-colors">
          Sync dari Meta
        </button>
      </div>
      
      {/* Nanti render daftar template yang tersedia di sini */}
    </div>
  );
};

export default TemplatesTab;
