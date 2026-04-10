import React, { useState } from "react";

const RecipientsTab = () => {
  const [recipients, setRecipients] = useState("");

  const handleSave = () => {
    // Nanti disimpan di state global atau DB
    console.log("Recipients saved", recipients.split(","));
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-white">Daftar Penerima</h2>
      <p className="text-sm text-white/70 mb-4">
        Masukkan nomor WhatsApp penerima, pisahkan dengan koma atau baris baru. (Gunakan kode negara, misal: 628123456789)
      </p>
      
      <textarea
        className="w-full bg-[var(--input-bg)] text-white border border-white/20 rounded-lg p-3 h-40 focus:outline-none focus:border-blue-500 transition-colors"
        placeholder="628123..., 628987..."
        value={recipients}
        onChange={(e) => setRecipients(e.target.value)}
      ></textarea>
      
      <div className="mt-4 flex justify-end">
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-5 rounded-lg transition-colors"
          onClick={handleSave}
        >
          Simpan Data Penerima
        </button>
      </div>
    </div>
  );
};

export default RecipientsTab;
