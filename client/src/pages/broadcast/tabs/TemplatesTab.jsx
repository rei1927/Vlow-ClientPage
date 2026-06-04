import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { FaTrash } from "react-icons/fa";
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
      if (templateData.buttons && templateData.buttons.length > 0) {
        data.append("buttons", JSON.stringify(templateData.buttons));
      }

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

  const handleDeleteTemplate = async (templateId, templateName) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus template "${templateName}" dari Meta? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }

    try {
      await axios.delete(`/api/broadcast/templates/${templateId}?name=${templateName}`, { withCredentials: true });
      toast.success(`Template ${templateName} berhasil dihapus`);
      setTemplates(prev => prev.filter(t => t.id !== templateId));
    } catch (error) {
      console.error("Error deleting template", error);
      toast.error(error.response?.data?.message || "Gagal menghapus template");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-semibold mb-1 text-[var(--color-text)]">Manajemen Template Meta</h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            Sinkronkan dan lihat template pesan yang disetujui dari Meta Business Manager Anda.
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-[var(--color-primary)] hover:opacity-80 text-white font-medium py-2 px-5 rounded-lg transition-colors"
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
        <div className="text-center p-8 border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)]">
          <p className="text-[var(--color-text-muted)]">Memuat template...</p>
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center p-8 border border-dashed border-[var(--color-border)] rounded-lg bg-[var(--color-surface)]">
          <p className="text-[var(--color-text-muted)]">Belum ada template tersinkronisasi. Klik "Sync dari Meta".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(t => (
            <div key={t.id} className="p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-[var(--color-text)] truncate max-w-[70%]" title={t.name}>{t.name}</h3>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${t.status === 'APPROVED' ? 'bg-green-500/20 text-green-600 dark:text-green-400' : 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400'}`}>
                    {t.status}
                  </span>
                  <button 
                    onClick={() => handleDeleteTemplate(t.id, t.name)}
                    className="text-red-500 hover:opacity-70 transition-colors p-1"
                    title="Hapus Template"
                  >
                    <FaTrash size={14} />
                  </button>
                </div>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mb-2">Bahasa: {t.language} | Kategori: {t.category}</p>
              <div className="text-sm text-[var(--color-text)] p-3 bg-[var(--color-bg)] rounded max-h-32 overflow-y-auto border border-[var(--color-border)]">
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
