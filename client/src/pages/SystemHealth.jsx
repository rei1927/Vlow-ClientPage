import { useState, useEffect, useCallback } from "react";
import axiosInstance from "../api/axiosInstance";
import {
  FaDatabase,
  FaHdd,
  FaEnvelope,
  FaSyncAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaServer,
  FaHeartbeat,
} from "react-icons/fa";

const statusConfig = {
  UP: {
    icon: FaCheckCircle,
    label: "Online",
    color: "text-green-500",
    bg: "bg-green-500/10 dark:bg-green-500/20",
    border: "border-green-500/30",
    dot: "bg-green-500",
    glow: "shadow-green-500/20",
  },
  DOWN: {
    icon: FaTimesCircle,
    label: "Offline",
    color: "text-red-500",
    bg: "bg-red-500/10 dark:bg-red-500/20",
    border: "border-red-500/30",
    dot: "bg-red-500",
    glow: "shadow-red-500/20",
  },
  NOT_CONFIGURED: {
    icon: FaExclamationTriangle,
    label: "Not Configured",
    color: "text-yellow-500",
    bg: "bg-yellow-500/10 dark:bg-yellow-500/20",
    border: "border-yellow-500/30",
    dot: "bg-yellow-500",
    glow: "shadow-yellow-500/20",
  },
};

const serviceDetails = {
  database: {
    name: "PostgreSQL Database",
    description: "Koneksi ke database utama aplikasi",
    icon: FaDatabase,
    iconColor: "text-blue-500",
    iconBg: "bg-blue-500/10 dark:bg-blue-500/20",
  },
  storage: {
    name: "MinIO Storage",
    description: "Layanan penyimpanan file & media",
    icon: FaHdd,
    iconColor: "text-purple-500",
    iconBg: "bg-purple-500/10 dark:bg-purple-500/20",
  },
  email: {
    name: "SMTP Email",
    description: "Layanan pengiriman email (reset password, notifikasi)",
    icon: FaEnvelope,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10 dark:bg-orange-500/20",
  },
};

const SystemHealth = () => {
  const [healthData, setHealthData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);
  const [error, setError] = useState(null);

  const fetchHealth = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const res = await axiosInstance.get("/health");
      setHealthData(res.data);
      setLastChecked(new Date());
    } catch (err) {
      setError("Gagal menghubungi server. Pastikan backend berjalan.");
      console.error("Health check error:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => fetchHealth(), 30000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  const getOverallStatus = () => {
    if (!healthData) return null;
    const services = ["database", "storage", "email"];
    const downCount = services.filter((s) => healthData[s] === "DOWN").length;
    if (downCount === 0) return "healthy";
    if (downCount < services.length) return "degraded";
    return "critical";
  };

  const overallStatus = getOverallStatus();

  const overallConfig = {
    healthy: {
      label: "All Systems Operational",
      color: "text-green-500",
      bg: "bg-gradient-to-r from-green-500/10 to-emerald-500/10 dark:from-green-500/20 dark:to-emerald-500/20",
      border: "border-green-500/30",
      icon: FaCheckCircle,
    },
    degraded: {
      label: "Partial System Outage",
      color: "text-yellow-500",
      bg: "bg-gradient-to-r from-yellow-500/10 to-orange-500/10 dark:from-yellow-500/20 dark:to-orange-500/20",
      border: "border-yellow-500/30",
      icon: FaExclamationTriangle,
    },
    critical: {
      label: "Major System Outage",
      color: "text-red-500",
      bg: "bg-gradient-to-r from-red-500/10 to-rose-500/10 dark:from-red-500/20 dark:to-rose-500/20",
      border: "border-red-500/30",
      icon: FaTimesCircle,
    },
  };

  return (
    <div className="w-full space-y-6 animate-[fadeIn_0.5s_ease-out]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-hover)] flex items-center justify-center shadow-lg shadow-[var(--color-primary)]/20">
            <FaHeartbeat className="text-white text-xl" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--color-text)]">
              System Status
            </h1>
            <p className="text-sm text-[var(--color-text-muted)]">
              Monitor kesehatan layanan Vlow
            </p>
          </div>
        </div>

        <button
          onClick={() => fetchHealth(true)}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-border)] transition-all text-sm font-medium shadow-sm disabled:opacity-50"
        >
          <FaSyncAlt className={`text-sm ${isRefreshing ? "animate-spin" : ""}`} />
          {isRefreshing ? "Checking..." : "Refresh"}
        </button>
      </div>

      {/* Overall Status Banner */}
      {isLoading ? (
        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-8 flex flex-col items-center justify-center">
          <FaSyncAlt className="text-3xl text-[var(--color-text-muted)] animate-spin mb-4" />
          <p className="text-[var(--color-text-muted)] font-medium">
            Memeriksa status sistem...
          </p>
        </div>
      ) : error ? (
        <div className="bg-red-500/10 dark:bg-red-500/20 rounded-2xl border border-red-500/30 p-6 flex items-center gap-4">
          <FaTimesCircle className="text-red-500 text-2xl flex-shrink-0" />
          <div>
            <h3 className="font-bold text-red-500 mb-1">Connection Error</h3>
            <p className="text-sm text-[var(--color-text-muted)]">{error}</p>
          </div>
        </div>
      ) : (
        <>
          {/* Overall Banner */}
          <div
            className={`rounded-2xl border ${overallConfig[overallStatus]?.border} ${overallConfig[overallStatus]?.bg} p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4`}
          >
            <div className="flex items-center gap-4">
              {overallStatus && (
                <>
                  {(() => {
                    const Icon = overallConfig[overallStatus].icon;
                    return (
                      <Icon
                        className={`text-3xl ${overallConfig[overallStatus].color}`}
                      />
                    );
                  })()}
                  <div>
                    <h2
                      className={`text-lg font-bold ${overallConfig[overallStatus].color}`}
                    >
                      {overallConfig[overallStatus].label}
                    </h2>
                    <p className="text-sm text-[var(--color-text-muted)]">
                      {lastChecked
                        ? `Terakhir dicek: ${lastChecked.toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}`
                        : ""}
                    </p>
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
              <FaServer className="text-sm" />
              <span>Auto-refresh setiap 30 detik</span>
            </div>
          </div>

          {/* Service Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {Object.entries(serviceDetails).map(([key, service]) => {
              const status = healthData?.[key] || "DOWN";
              const cfg = statusConfig[status] || statusConfig.DOWN;
              const StatusIcon = cfg.icon;
              const ServiceIcon = service.icon;

              return (
                <div
                  key={key}
                  className={`bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-6 hover:shadow-lg transition-all duration-300 group ${cfg.glow}`}
                >
                  {/* Service Header */}
                  <div className="flex items-start justify-between mb-5">
                    <div
                      className={`w-12 h-12 rounded-xl ${service.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform`}
                    >
                      <ServiceIcon className={`text-xl ${service.iconColor}`} />
                    </div>
                    <div
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color} border ${cfg.border}`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${cfg.dot} ${
                          status === "UP" ? "animate-pulse" : ""
                        }`}
                      />
                      {cfg.label}
                    </div>
                  </div>

                  {/* Service Info */}
                  <h3 className="font-bold text-[var(--color-text)] mb-1">
                    {service.name}
                  </h3>
                  <p className="text-sm text-[var(--color-text-muted)]">
                    {service.description}
                  </p>

                  {/* Status Bar */}
                  <div className="mt-5 pt-4 border-t border-[var(--color-border)]">
                    <div className="flex items-center gap-2">
                      <StatusIcon className={`text-lg ${cfg.color}`} />
                      <span
                        className={`text-sm font-semibold ${cfg.color}`}
                      >
                        {status === "UP"
                          ? "Beroperasi Normal"
                          : status === "NOT_CONFIGURED"
                          ? "Belum Dikonfigurasi"
                          : "Tidak Dapat Dijangkau"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default SystemHealth;
