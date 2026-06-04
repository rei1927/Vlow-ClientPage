import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const BroadcastTab = () => {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [loadingMsg, setLoadingMsg] = useState("");

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await axios.get("/api/broadcast/templates", { withCredentials: true });
        // Hanya template yang approved yang bisa dikirim
        setTemplates(res.data.filter(t => t.status === "APPROVED"));
      } catch (error) {
        console.error("Error fetching templates", error);
      }
    };
    fetchTemplates();
  }, []);

  const handleStartBroadcast = async () => {
    if (!selectedTemplate) {
      return toast.error("Silakan pilih template terlebih dahulu");
    }

    // Nanti daftar nomer diambil dari tab Recipients (via Redux atau LocalStorage atau parent state)
    // Untuk saat ini kita pakai placeholder input / mock demo
    // Karena RecipientsTab tidak menyimpan state global di versi awal, kita bisa tambahkan logika state lifting nanti, 
    // tapi sementara, sebagai testing, kita kirimkan payload request contoh:
    
    // Trik mendapatkan data dari tab sebelah yang menggunakan setState di window jika belum dikonfigurasi redux
    const recipientsRaw = window.localStorage.getItem("broadcast_recipients") || "";
    const recipientsList = recipientsRaw.split(/[\n,]/).map(r => r.trim()).filter(r => r.length > 5);

    if (recipientsList.length === 0) {
      return toast.error("Daftar penerima masih kosong. Silahkan isi data penerima di tab 'Recipients' dan simpan.");
    }

    setLoadingMsg("Memproses broadcast...");
    try {
      const res = await axios.post("/api/broadcast/send", {
        templateId: selectedTemplate,
        recipients: recipientsList
      }, { withCredentials: true });
      
      toast.success(res.data.message);
    } catch (error) {
      console.error("Error sending broadcast", error);
      toast.error(error.response?.data?.message || "Gagal memulai broadcast");
    } finally {
      setLoadingMsg("");
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-[var(--color-text)]">Mulai Siaran (Broadcast)</h2>
      <p className="text-sm text-[var(--color-text-muted)] mb-6">
        Konfigurasi dan mulai jalankan kampanye broadcast Anda ke semua penerima.
        Pastikan Anda telah menyimpan penerima Anda di tab "Recipients".
      </p>
      
      <div className="bg-[var(--color-surface)] p-5 rounded-lg border border-[var(--color-border)] mb-6">
        <div className="mb-4">
          <label className="block text-sm text-[var(--color-text-muted)] mb-2">Pilih Template Pesan Meta</label>
          <select 
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            className="w-full bg-[var(--color-bg)] text-[var(--color-text)] border border-[var(--color-border)] rounded-lg p-3 focus:outline-none focus:border-[var(--color-primary)]"
          >
            <option value="">-- Pilih Template --</option>
            {templates.map(t => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.language})
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-[var(--color-text-muted)] mt-4 bg-[var(--color-bg)] p-3 rounded">
          <p>Daftar tunggu pengiriman akan diproses secara masal ke kontak yang tersimpan.</p>
        </div>
      </div>
      
      <div className="flex justify-end">
        <button
          onClick={handleStartBroadcast}
          disabled={loadingMsg !== ""}
          className="bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-semibold py-3 px-8 rounded-xl shadow-sm border border-transparent transition-all"
        >
          {loadingMsg || "Kirim Broadcast Sekarang"}
        </button>
      </div>
    </div>
  );
};

export default BroadcastTab;
