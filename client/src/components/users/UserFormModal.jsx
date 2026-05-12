import { useState, useEffect } from "react";
import { FaTimes, FaUser, FaEnvelope, FaUserTag, FaCalendarAlt, FaLink, FaRedo, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import toast from "react-hot-toast";

/** Validasi bahwa value adalah URL yang valid (harus http/https) */
const isValidWebhookUrl = (value) => {
  if (!value || typeof value !== "string") return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const UserFormModal = ({ isOpen, onClose, onSubmit, initialData, isLoading }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "customer",
    isActive: true,
    subscriptionExpiry: "",
    maxConversations: 1000,
    maxAiResponses: 1000,
    maxPlatforms: 1,
    n8nWebhookUrl: "",
    n8nSimulatorWebhookUrl: "",
    metaCloudWebhookUrl: "",
    features: { chatbot: true, crm: true, broadcast: true },
  });

  const [webhookStatus, setWebhookStatus] = useState({
    n8nWebhookUrl: { status: 'idle' },
    metaCloudWebhookUrl: { status: 'idle' },
    n8nSimulatorWebhookUrl: { status: 'idle' },
  });

  const handleCheckWebhook = async (field, url) => {
    if (!url) {
      toast.error("URL Webhook tidak boleh kosong");
      return;
    }
    if (!isValidWebhookUrl(url)) {
      toast.error("Format URL tidak valid");
      return;
    }

    setWebhookStatus(prev => ({ ...prev, [field]: { status: 'loading' } }));
    
    try {
      // Menggunakan endpoint proxy di backend agar tidak kena issue CORS browser
      const res = await fetch("/api/health/check-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      });
      
      const data = await res.json();
      
      if (res.ok && data.status === "OK") {
        setWebhookStatus(prev => ({ ...prev, [field]: { status: 'success' } }));
        toast.success("Webhook aman dan terhubung!");
      } else {
        setWebhookStatus(prev => ({ ...prev, [field]: { status: 'error' } }));
        toast.error("Gagal terhubung ke Webhook.");
      }
    } catch (err) {
      setWebhookStatus(prev => ({ ...prev, [field]: { status: 'error' } }));
      toast.error("Terjadi kesalahan sistem saat mengecek webhook.");
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // For edit mode, subscriptionMonths is used to extend subscription
        // We don't calculate from expiry date, just leave it empty for admin to set extension
        setFormData({
          name: initialData.name,
          email: initialData.email,
          role: initialData.role,
          isActive: initialData.isActive,
          subscriptionExpiry: initialData.subscriptionExpiry ? new Date(initialData.subscriptionExpiry).toISOString().split('T')[0] : "", // Load existing date
          maxConversations: initialData.maxConversations || 1000,
          maxAiResponses: initialData.maxAiResponses || 1000,
          maxPlatforms: initialData.maxPlatforms || 1,
          n8nWebhookUrl: initialData.n8nWebhookUrl || "",
          n8nSimulatorWebhookUrl: initialData.n8nSimulatorWebhookUrl || "",
          metaCloudWebhookUrl: initialData.metaCloudWebhookUrl || "",
          features: initialData.features || { chatbot: true, crm: true, broadcast: true },
        });
      } else {
        setFormData({
          name: "",
          email: "",
          role: "customer",
          isActive: true,
          subscriptionExpiry: "",
          maxConversations: 1000,
          maxAiResponses: 1000,
          maxPlatforms: 1,
          n8nWebhookUrl: "",
          n8nSimulatorWebhookUrl: "",
          metaCloudWebhookUrl: "",
          features: { chatbot: true, crm: true, broadcast: true },
        });
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLoading) return;

    // Saat tambah user baru dengan role customer, URL webhook n8n wajib dan harus berupa URL valid
    if (!initialData && formData.role === "customer") {
      const url = (formData.n8nWebhookUrl || "").trim();
      if (!url) {
        toast.error("URL Webhook n8n wajib diisi untuk customer baru.");
        return;
      }
      if (!isValidWebhookUrl(url)) {
        toast.error("URL Webhook n8n harus berupa link URL yang valid (contoh: https://...).");
        return;
      }

      const simUrl = (formData.n8nSimulatorWebhookUrl || "").trim();
      if (!simUrl) {
        toast.error("URL Webhook Simulator n8n wajib diisi untuk customer baru.");
        return;
      }
      if (!isValidWebhookUrl(simUrl)) {
        toast.error("URL Webhook Simulator n8n harus berupa link URL yang valid (contoh: https://...).");
        return;
      }
    }

    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[var(--color-bg)] rounded-2xl shadow-2xl w-full max-w-lg max-h-[95vh] flex flex-col overflow-hidden animate-[fadeIn_0.3s_ease-out] border border-[var(--color-border)]">
        <div className="bg-[var(--color-primary)] px-6 py-4 flex justify-between items-center text-white shrink-0">
          <h3 className="font-bold text-lg">
            {initialData ? "Edit User" : "Tambah Customer Baru"}
          </h3>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="hover:text-white/80 disabled:opacity-50"
          >
            <FaTimes />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6 flex-1 custom-scrollbar">
          <form onSubmit={handleSubmit} className="space-y-4">
            <fieldset disabled={isLoading} className="space-y-4">
              {/* Nama */}
              <div className="form-control">
                <label className="label text-xs font-bold text-[var(--color-text-muted)] uppercase">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <div className="absolute z-10 inset-y-0 left-0 pl-3 flex items-center text-[var(--color-text-muted)]">
                    <FaUser />
                  </div>
                  <input
                    type="text"
                    className="input input-bordered w-full pl-10 rounded-xl bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-text)] placeholder-[var(--color-text-muted)]"
                    placeholder="Contoh: Budi Santoso"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="form-control">
                <label className="label text-xs font-bold text-[var(--color-text-muted)] uppercase">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute z-10 inset-y-0 left-0 pl-3 flex items-center text-[var(--color-text-muted)]">
                    <FaEnvelope />
                  </div>
                  <input
                    type="email"
                    className="input input-bordered w-full pl-10 rounded-xl bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-text)] placeholder-[var(--color-text-muted)]"
                    placeholder="email@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={!!initialData}
                    required
                  />
                </div>
                {!initialData && (
                  <span className="text-[10px] text-[var(--color-text-muted)] mt-1">
                    *Password sementara akan dikirim ke email ini.
                  </span>
                )}
              </div>

              {/* Role & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label text-xs font-bold text-[var(--color-text-muted)] uppercase">Role</label>
                  <div className="relative">
                    <div className="absolute z-10 inset-y-0 left-0 pl-3 flex items-center text-[var(--color-text-muted)]">
                      <FaUserTag />
                    </div>
                    <select
                      className="select select-bordered w-full pl-10 rounded-xl bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-text)]"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    >
                      <option value="customer">Customer</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>

                {initialData && (
                  <div className="form-control">
                    <label className="label text-xs font-bold text-[var(--color-text-muted)] uppercase">
                      Status Akun
                    </label>
                    <select
                      className={`select select-bordered w-full rounded-xl font-bold bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-text)] ${formData.isActive ? "text-green-600" : "text-red-500"
                        }`}
                      value={formData.isActive}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          isActive: e.target.value === "true",
                        })
                      }
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive / Suspend</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Subscription Validity - Only for Customer */}
              {formData.role === "customer" && (
                <div className="form-control">
                  <label className="label text-xs font-bold text-[var(--color-text-muted)] uppercase">
                    Berlaku Sampai Tanggal
                  </label>
                  <div className="relative">
                    <div className="absolute z-10 inset-y-0 left-0 pl-3 flex items-center text-[var(--color-text-muted)]">
                      <FaCalendarAlt />
                    </div>
                    <input
                      type="date"
                      className="input input-bordered w-full pl-10 rounded-xl bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-text)]"
                      value={formData.subscriptionExpiry}
                      onChange={(e) =>
                        setFormData({ ...formData, subscriptionExpiry: e.target.value })
                      }
                      required={formData.role === "customer"}
                    />
                  </div>
                  <span className="text-[10px] text-[var(--color-text-muted)] mt-1">
                    *Tentukan tanggal batas akhir langganan (Otomatis ditutup pada 23:59)
                  </span>
                </div>
              )}

              {/* Conversation Limits */}
              {formData.role === "customer" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="form-control">
                      <label className="label text-xs font-bold text-[var(--color-text-muted)] uppercase">
                        Batas Maksimal Conversation
                      </label>
                      <div className="relative">
                        <div className="absolute z-10 inset-y-0 left-0 pl-3 flex items-center text-[var(--color-text-muted)]">
                          <span className="font-bold">#</span>
                        </div>
                        <input
                          type="number"
                          min="1"
                          className="input input-bordered w-full pl-10 rounded-xl bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-text)]"
                          value={formData.maxConversations}
                          onChange={(e) =>
                            setFormData({ ...formData, maxConversations: parseInt(e.target.value) || 1 })
                          }
                        />
                      </div>
                    </div>

                    <div className="form-control">
                      <label className="label text-xs font-bold text-[var(--color-text-muted)] uppercase">
                        Batas Maksimal AI Responses
                      </label>
                      <div className="relative">
                        <div className="absolute z-10 inset-y-0 left-0 pl-3 flex items-center text-[var(--color-text-muted)]">
                          <span className="font-bold">#</span>
                        </div>
                        <input
                          type="number"
                          min="1"
                          className="input input-bordered w-full pl-10 rounded-xl bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-text)]"
                          value={formData.maxAiResponses}
                          onChange={(e) =>
                            setFormData({ ...formData, maxAiResponses: parseInt(e.target.value) || 1 })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tombol Reset Kuota (Hanya muncul jika mode Edit) */}
                  {initialData && (
                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm("Yakin ingin mereset kuota limit bulan ini menjadi 0 secara permanen?")) {
                            const updatedData = { ...formData, resetQuota: true };
                            setFormData(updatedData);
                            onSubmit(updatedData);
                          }
                        }}
                        className="btn btn-sm bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-800/50 text-red-600 dark:text-red-400 border-none font-bold rounded-lg shadow-sm w-full sm:w-auto"
                      >
                        <FaRedo className="mr-2" /> Reset Kuota Bulan Ini
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Max Platforms Limit - Only for Customer */}
              {formData.role === "customer" && (
                <div className="form-control">
                  <label className="label text-xs font-bold text-[var(--color-text-muted)] uppercase">
                    Batas Maksimal Sesi WhatsApp
                  </label>
                  <div className="relative">
                    <div className="absolute z-10 inset-y-0 left-0 pl-3 flex items-center text-[var(--color-text-muted)]">
                      <span className="font-bold">#</span>
                    </div>
                    <input
                      type="number"
                      min="1"
                      className="input input-bordered w-full pl-10 rounded-xl bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-text)]"
                      value={formData.maxPlatforms}
                      onChange={(e) =>
                        setFormData({ ...formData, maxPlatforms: parseInt(e.target.value) || 1 })
                      }
                      require={formData.role === "customer"}
                    />
                  </div>
                  <span className="text-[10px] text-[var(--color-text-muted)] mt-1">
                    *Berapa banyak nomor WA yang boleh dihubungkan oleh pengguna ini? (Default: 1)
                  </span>
                </div>
              )}

              {/* n8n Webhook URL - Only for Customer */}
              {formData.role === "customer" && (
                <div className="form-control">
                  <div className="label flex items-center justify-between pb-1">
                    <span className="text-xs font-bold text-[var(--color-text-muted)] uppercase">
                      URL Webhook WAHA N8N <span className="text-red-500">*</span>
                    </span>
                    <button 
                      type="button" 
                      onClick={() => handleCheckWebhook('n8nWebhookUrl', formData.n8nWebhookUrl)}
                      disabled={webhookStatus.n8nWebhookUrl.status === 'loading'}
                      className="btn btn-xs btn-outline rounded-full px-3 gap-1 hover:bg-[var(--color-primary)] hover:border-[var(--color-primary)]"
                    >
                      {webhookStatus.n8nWebhookUrl.status === 'loading' ? (
                        <span className="loading loading-spinner loading-xs"></span>
                      ) : webhookStatus.n8nWebhookUrl.status === 'success' ? (
                        <FaCheckCircle className="text-green-500" />
                      ) : webhookStatus.n8nWebhookUrl.status === 'error' ? (
                        <FaTimesCircle className="text-red-500" />
                      ) : null}
                      Cek URL
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute z-10 inset-y-0 left-0 pl-3 flex items-center text-[var(--color-text-muted)]">
                      <FaLink />
                    </div>
                    <input
                      type="url"
                      className="input input-bordered w-full pl-10 rounded-xl bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-text)] placeholder-[var(--color-text-muted)]"
                      placeholder="https://n8n.example.com/webhook/..."
                      value={formData.n8nWebhookUrl}
                      onChange={(e) => setFormData({ ...formData, n8nWebhookUrl: e.target.value })}
                      required={!initialData && formData.role === "customer"}
                      pattern="https?://.+"
                      title="Masukkan URL yang valid (contoh: https://n8n.example.com/webhook/...)"
                    />
                  </div>
                  <span className="text-[10px] text-[var(--color-text-muted)] mt-1">
                    *Wajib diisi. Harus berupa link URL (http atau https) untuk webhook WAHA n8n.
                  </span>
                </div>
              )}

              {/* Meta Cloud Webhook URL - Only for Customer */}
              {formData.role === "customer" && (
                <div className="form-control">
                  <div className="label flex items-center justify-between pb-1">
                    <span className="text-xs font-bold text-[var(--color-text-muted)] uppercase">
                      URL Webhook Meta Cloud <span className="text-red-500">*</span>
                    </span>
                    <button 
                      type="button" 
                      onClick={() => handleCheckWebhook('metaCloudWebhookUrl', formData.metaCloudWebhookUrl)}
                      disabled={webhookStatus.metaCloudWebhookUrl.status === 'loading'}
                      className="btn btn-xs btn-outline rounded-full px-3 gap-1 hover:bg-[var(--color-primary)] hover:border-[var(--color-primary)]"
                    >
                      {webhookStatus.metaCloudWebhookUrl.status === 'loading' ? (
                        <span className="loading loading-spinner loading-xs"></span>
                      ) : webhookStatus.metaCloudWebhookUrl.status === 'success' ? (
                        <FaCheckCircle className="text-green-500" />
                      ) : webhookStatus.metaCloudWebhookUrl.status === 'error' ? (
                        <FaTimesCircle className="text-red-500" />
                      ) : null}
                      Cek URL
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute z-10 inset-y-0 left-0 pl-3 flex items-center text-[var(--color-text-muted)]">
                      <FaLink />
                    </div>
                    <input
                      type="url"
                      className="input input-bordered w-full pl-10 rounded-xl bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-text)] placeholder-[var(--color-text-muted)]"
                      placeholder="https://n8n.example.com/webhook/meta-cloud-webhook"
                      value={formData.metaCloudWebhookUrl}
                      onChange={(e) => setFormData({ ...formData, metaCloudWebhookUrl: e.target.value })}
                      pattern="https?://.+"
                      title="Masukkan URL yang valid (contoh: https://n8n.example.com/webhook/meta-cloud-webhook)"
                    />
                  </div>
                  <span className="text-[10px] text-[var(--color-text-muted)] mt-1">
                    *URL webhook n8n untuk menerima pesan dari Meta Cloud API (WhatsApp Business).
                  </span>
                </div>
              )}

              {/* n8n Simulator Webhook URL - Only for Customer */}
              {formData.role === "customer" && (
                <div className="form-control">
                  <div className="label flex items-center justify-between pb-1">
                    <span className="text-xs font-bold text-[var(--color-text-muted)] uppercase">
                      URL Webhook Simulator n8n <span className="text-red-500">*</span>
                    </span>
                    <button 
                      type="button" 
                      onClick={() => handleCheckWebhook('n8nSimulatorWebhookUrl', formData.n8nSimulatorWebhookUrl)}
                      disabled={webhookStatus.n8nSimulatorWebhookUrl.status === 'loading'}
                      className="btn btn-xs btn-outline rounded-full px-3 gap-1 hover:bg-[var(--color-primary)] hover:border-[var(--color-primary)]"
                    >
                      {webhookStatus.n8nSimulatorWebhookUrl.status === 'loading' ? (
                        <span className="loading loading-spinner loading-xs"></span>
                      ) : webhookStatus.n8nSimulatorWebhookUrl.status === 'success' ? (
                        <FaCheckCircle className="text-green-500" />
                      ) : webhookStatus.n8nSimulatorWebhookUrl.status === 'error' ? (
                        <FaTimesCircle className="text-red-500" />
                      ) : null}
                      Cek URL
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute z-10 inset-y-0 left-0 pl-3 flex items-center text-[var(--color-text-muted)]">
                      <FaLink />
                    </div>
                    <input
                      type="url"
                      className="input input-bordered w-full pl-10 rounded-xl bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-text)] placeholder-[var(--color-text-muted)]"
                      placeholder="https://n8n.example.com/webhook-test/simulator-chat"
                      value={formData.n8nSimulatorWebhookUrl}
                      onChange={(e) => setFormData({ ...formData, n8nSimulatorWebhookUrl: e.target.value })}
                      required={!initialData && formData.role === "customer"}
                      pattern="https?://.+"
                      title="Masukkan URL yang valid (contoh: https://n8n.example.com/webhook-test/...)"
                    />
                  </div>
                  <span className="text-[10px] text-[var(--color-text-muted)] mt-1">
                    *Wajib diisi. Khusus untuk testing di AI Simulator Dashboard Vlow.
                  </span>
                </div>
              )}

              {/* Pengaturan Hak Akses Fitur */}
              <div className="border border-[var(--color-border)] rounded-xl p-4 bg-[var(--color-surface)] space-y-3">
                <label className="label text-xs font-bold text-[var(--color-text)] uppercase tracking-wider pb-0">
                  Pengaturan Hak Akses Fitur
                </label>
                <p className="text-[10px] text-[var(--color-text-muted)] mt-0">
                  Centang kapabilitas menu fitur yang diizinkan untuk digunakan oleh akun ini.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  {/* Chatbot */}
                  <label className="flex items-center gap-3 p-2.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-bg)] transition-colors cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm checkbox-primary rounded"
                      checked={formData.features?.chatbot !== false}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          features: {
                            ...formData.features,
                            chatbot: e.target.checked,
                          },
                        })
                      }
                    />
                    <span className="text-xs font-bold text-[var(--color-text)]">Chatbot AI</span>
                  </label>

                  {/* CRM */}
                  <label className="flex items-center gap-3 p-2.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-bg)] transition-colors cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm checkbox-primary rounded"
                      checked={formData.features?.crm !== false}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          features: {
                            ...formData.features,
                            crm: e.target.checked,
                          },
                        })
                      }
                    />
                    <span className="text-xs font-bold text-[var(--color-text)]">CRM Kontak</span>
                  </label>

                  {/* Broadcast */}
                  <label className="flex items-center gap-3 p-2.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-bg)] transition-colors cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm checkbox-primary rounded"
                      checked={formData.features?.broadcast !== false}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          features: {
                            ...formData.features,
                            broadcast: e.target.checked,
                          },
                        })
                      }
                    />
                    <span className="text-xs font-bold text-[var(--color-text)]">Broadcast WA</span>
                  </label>
                </div>
              </div>
            </fieldset>

            {/* Actions */}
            <div className="flex gap-3 pt-4 mt-2 border-t border-[var(--color-border)]">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="btn flex-1 bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-border)] normal-case disabled:opacity-50"
              >
                Batal
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="btn flex-1 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white border-none normal-case disabled:opacity-80"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="loading loading-spinner loading-sm"></span>
                    <span className="text-sm font-semibold">
                      {initialData ? "Menyimpan..." : "Memproses..."}
                    </span>
                  </span>
                ) : initialData ? (
                  "Simpan Perubahan"
                ) : (
                  "Tambah User"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserFormModal;
