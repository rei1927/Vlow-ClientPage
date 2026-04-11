import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import CreateTemplateModal from "../components/CreateTemplateModal";

const TemplatesTab = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/broadcast/templates", { withCredentials: true });
      setTemplates(res.data);
    } catch (error) {
      console.error("Error fetching templates", error);
      toast.error("Gagal mengambil data template");
    } finally {
      setLoading(false);
    }
  };

  const syncMetaTemplates = async () => {
    setSyncing(true);
    try {
      const res = await axios.post("/api/broadcast/templates/sync", {}, { withCredentials: true });
      toast.success(res.data.message || "Berhasil sinkronisasi dari Meta");
      fetchTemplates();
    } catch (error) {
      console.error("Error syncing", error);
      toast.error(error.response?.data?.message || "Gagal sinkronisasi data dari Meta");
    } finally {
      setSyncing(false);
    }
  };

  const handleCreateTemplate = async (templateData) => {
    setCreating(true);
    try {
      const data = new FormData();
      data.append("name", templateData.name);
      data.append("category", templateData.category);
      data.append("language", templateData.language);
      data.append("headerType", templateData.headerType);
      
      if (templateData.headerText) data.append("headerText", templateData.headerText);
      if (templateData.headerMedia) data.append("mediaFile", templateData.headerMedia);
      
      data.append("bodyText", templateData.bodyText);
      if (templateData.footerText) data.append("footerText", templateData.footerText);

      const res = await axios.post("/api/broadcast/templates", data, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" }
      });

      toast.success(res.data.message || "Template berhasil dibuat dan dikirim ke Meta untuk direview.");
      setIsCreateModalOpen(false);
      fetchTemplates(); // Refresh list to show the pending template
    } catch (error) {
      console.error("Error creating template", error);
      toast.error(error.response?.data?.message || "Gagal membuat template.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-semibold mb-1 text-white">Manajemen Template Meta</h2>
          <p className="text-sm text-white/70">
            Sinkronkan dan lihat template pesan yang disetujui dari Meta Business Manager Anda.
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 px-5 rounded-lg transition-colors"
          >
            Buat Template
          </button>
          <button 
            onClick={syncMetaTemplates}
            disabled={syncing}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium py-2 px-5 rounded-lg transition-colors flex items-center gap-2"
          >
            {syncing ? "Menyinkronkan..." : "Sync dari Meta"}
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="text-center p-8 border border-white/10 rounded-lg bg-[var(--sidebar-bg)]">
          <p className="text-white/50">Memuat template...</p>
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center p-8 border border-dashed border-white/20 rounded-lg bg-[var(--sidebar-bg)]">
          <p className="text-white/50">Belum ada template tersinkronisasi. Klik "Sync dari Meta".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(t => (
            <div key={t.id} className="p-4 bg-[var(--sidebar-bg)] border border-white/10 rounded-lg shadow">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-white">{t.name}</h3>
                <span className={`text-xs px-2 py-1 rounded-full ${t.status === 'APPROVED' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                  {t.status}
                </span>
              </div>
              <p className="text-xs text-white/50 mb-2">Bahasa: {t.language} | Kategori: {t.category}</p>
              <div className="text-sm text-white/80 p-3 bg-black/20 rounded max-h-32 overflow-y-auto">
                {/* Mencoba menampilkan body jika ada dalam komponen */}
                {t.components?.find(c => c.type === 'BODY')?.text || "Template detail tersembunyi."}
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateTemplateModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onSubmit={handleCreateTemplate} 
        submitting={creating} 
      />
    </div>
  );
};

export default TemplatesTab;
