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
      <h2 className="text-xl font-semibold mb-4 text-[var(--color-text)]">Daftar Penerima</h2>
      <p className="text-sm text-[var(--color-text-muted)] mb-4">
        Masukkan nomor WhatsApp penerima, pisahkan dengan koma atau baris baru. (Gunakan kode negara, misal: 628123456789)
      </p>
      
      <textarea
        className="w-full bg-[var(--color-bg)] text-[var(--color-text)] border border-[var(--color-border)] rounded-lg p-3 h-40 focus:outline-none focus:border-[var(--color-primary)] transition-colors"
        placeholder="628123456789, 628987654321&#10;Atau pakai baris baru"
        value={recipients}
        onChange={(e) => setRecipients(e.target.value)}
      ></textarea>
      
      <div className="mt-4 flex justify-end">
        <button
          className="bg-[var(--color-primary)] hover:opacity-80 text-white font-medium py-2 px-5 rounded-lg transition-colors"
          onClick={handleSave}
        >
          Simpan Data Penerima
        </button>
      </div>
    </div>
  );
};

export default RecipientsTab;
