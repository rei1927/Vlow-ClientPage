import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";

const RecipientsTab = () => {
  const [recipients, setRecipients] = useState("");

  useEffect(() => {
    const saved = window.localStorage.getItem("broadcast_recipients");
    if (saved) setRecipients(saved);
  }, []);

  const handleSave = () => {
    window.localStorage.setItem("broadcast_recipients", recipients);
    toast.success("Daftar penerima berhasil disimpan!");
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-white">Daftar Penerima</h2>
      <p className="text-sm text-white/70 mb-4">
        Masukkan nomor WhatsApp penerima, pisahkan dengan koma atau baris baru. (Gunakan kode negara, misal: 628123456789)
      </p>
      
      <textarea
        className="w-full bg-[var(--input-bg)] text-white border border-white/20 rounded-lg p-3 h-40 focus:outline-none focus:border-blue-500 transition-colors"
        placeholder="628123456789, 628987654321&#10;Atau pakai baris baru"
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
