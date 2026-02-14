import { useEffect, useState, useMemo } from "react";
import { useSelector } from "react-redux";
import {
  FaChartBar,
  FaSmile,
  FaHistory,
  FaSpinner,
  FaUsers,
  FaComment,
  FaCheckCircle,
  FaExclamationTriangle,
} from "react-icons/fa";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import agentService from "../../../features/agents/agentService";
import toast from "react-hot-toast";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const EvaluationTab = ({ agentId }) => {
  const themeMode = useSelector((state) => state.theme?.mode) || "light";
  const isDark = themeMode === "dark";
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState("month");

  useEffect(() => {
    if (agentId) {
      fetchAnalytics();
    } else {
      // Jika tidak ada agentId (create mode), langsung set loading false
      setIsLoading(false);
      setAnalytics(null);
    }
  }, [agentId, period]);

  const fetchAnalytics = async () => {
    if (!agentId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const response = await agentService.getAgentAnalytics(agentId, period);
      setAnalytics(response.data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast.error("Gagal memuat data analitik");
      setAnalytics(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Chart data untuk daily stats
  const chartData = analytics?.dailyStats
    ? {
        labels: analytics.dailyStats.map((d) => {
          const date = new Date(d.date);
          return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
        }),
        datasets: [
          {
            label: "Percakapan",
            data: analytics.dailyStats.map((d) => d.count),
            borderColor: "rgb(28, 77, 141)",
            backgroundColor: "rgba(28, 77, 141, 0.1)",
            tension: 0.4,
            fill: true,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: "rgb(28, 77, 141)",
            pointBorderColor: "#fff",
            pointBorderWidth: 2,
          },
          {
            label: "Handoff",
            data: analytics.dailyStats.map((d) => d.handoffs),
            borderColor: "rgb(249, 115, 22)",
            backgroundColor: "rgba(249, 115, 22, 0.1)",
            tension: 0.4,
            fill: true,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: "rgb(249, 115, 22)",
            pointBorderColor: "#fff",
            pointBorderWidth: 2,
          },
        ],
      }
    : null;

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top",
          labels: {
            usePointStyle: true,
            padding: 15,
            color: isDark ? "#94a3b8" : "#374151",
            font: { size: 12, weight: "500" },
          },
        },
        tooltip: {
          mode: "index",
          intersect: false,
          backgroundColor: isDark ? "rgba(15, 23, 42, 0.95)" : "rgba(0, 0, 0, 0.8)",
          titleColor: isDark ? "#e5e7eb" : "#fff",
          bodyColor: isDark ? "#e5e7eb" : "#fff",
          padding: 12,
          titleFont: { size: 13, weight: "600" },
          bodyFont: { size: 12 },
          cornerRadius: 8,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
            color: isDark ? "#94a3b8" : "#374151",
            font: { size: 11 },
          },
          grid: { color: isDark ? "rgba(148, 163, 184, 0.2)" : "rgba(0, 0, 0, 0.05)" },
        },
        x: {
          ticks: {
            color: isDark ? "#94a3b8" : "#374151",
            font: { size: 11 },
          },
          grid: { display: false },
        },
      },
    }),
    [isDark],
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="relative">
          <FaSpinner className="animate-spin text-5xl text-[var(--color-primary)]" />
          <div className="absolute inset-0 animate-ping opacity-20">
            <FaSpinner className="text-5xl text-[var(--color-primary)]" />
          </div>
        </div>
        <p className="mt-4 text-[var(--color-text-muted)] text-sm font-medium">Memuat data analitik...</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="animate-fade-in space-y-6">
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4 flex items-start gap-3 shadow-sm">
          <div className="p-2 bg-[var(--color-primary)]/10 rounded-lg">
            <FaChartBar className="text-[var(--color-primary)]" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-[var(--color-text)] mb-1">Menunggu Data</p>
            <p className="text-xs text-[var(--color-text-muted)]">
              Data analitik akan tersedia setelah AI Agent mulai berinteraksi dengan pengguna nyata.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 opacity-60">
          <div className="bg-[var(--color-surface)] rounded-xl p-5 border border-[var(--color-border)]">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-[var(--color-primary)]/10 rounded-lg shadow-sm">
                <FaComment className="text-[var(--color-primary)] text-lg" />
              </div>
            </div>
            <div className="text-3xl font-bold text-[var(--color-primary)] mb-1">0</div>
            <div className="text-sm font-medium text-[var(--color-text-muted)]">Total Percakapan</div>
          </div>

          <div className="bg-[var(--color-surface)] rounded-xl p-5 border border-[var(--color-border)]">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-green-500/10 rounded-lg shadow-sm">
                <FaSmile className="text-green-600 dark:text-green-400 text-lg" />
              </div>
            </div>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">0%</div>
            <div className="text-sm font-medium text-[var(--color-text-muted)]">Sentiment Score</div>
          </div>

          <div className="bg-[var(--color-surface)] rounded-xl p-5 border border-[var(--color-border)]">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-orange-500/10 rounded-lg shadow-sm">
                <FaHistory className="text-orange-500 dark:text-orange-400 text-lg" />
              </div>
            </div>
            <div className="text-3xl font-bold text-orange-500 dark:text-orange-400 mb-1">0%</div>
            <div className="text-sm font-medium text-[var(--color-text-muted)]">Handover Rate</div>
          </div>
        </div>
      </div>
    );
  }

  const getSentimentBadge = (score) => {
    if (score >= 70) {
      return {
        label: "Baik",
        color: "badge-success",
        icon: <FaCheckCircle className="text-xs" />,
      };
    } else if (score >= 50) {
      return {
        label: "Cukup",
        color: "badge-warning",
        icon: <FaExclamationTriangle className="text-xs" />,
      };
    } else {
      return {
        label: "Perlu Perbaikan",
        color: "badge-error",
        icon: <FaExclamationTriangle className="text-xs" />,
      };
    }
  };

  const sentimentBadge = getSentimentBadge(analytics.sentimentScore);

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-[var(--color-border)]">
        <div>
          <h3 className="text-md sm:text-xl font-bold text-[var(--color-text)] flex items-center gap-2 mb-1">
            <div className="p-2 bg-[var(--color-primary)] rounded-lg text-white">
              <FaChartBar />
            </div>
            Evaluasi Performa
          </h3>
          <p className="text-xs sm:text-sm text-[var(--color-text-muted)]">
            Analitik dan metrik performa AI Agent Anda
          </p>
        </div>
        <div className="flex gap-2 bg-[var(--color-bg)] p-1 rounded-lg border border-[var(--color-border)]">
          <button
            onClick={() => setPeriod("day")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              period === "day"
                ? "bg-[var(--color-primary)] text-white shadow-md"
                : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-primary)]"
            }`}
          >
            Hari Ini
          </button>
          <button
            onClick={() => setPeriod("week")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              period === "week"
                ? "bg-[var(--color-primary)] text-white shadow-md"
                : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-primary)]"
            }`}
          >
            7 Hari
          </button>
          <button
            onClick={() => setPeriod("month")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              period === "month"
                ? "bg-[var(--color-primary)] text-white shadow-md"
                : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-primary)]"
            }`}
          >
            Bulan Ini
          </button>
        </div>
      </div>

      {/* KPI Cards - Enhanced */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        {/* Total Conversations */}
        <div className="group bg-[var(--color-surface)] rounded-2xl p-6 shadow-lg border border-[var(--color-border)] hover:shadow-xl hover:scale-[1.01] transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-[var(--color-primary)]/10 rounded-xl shadow-md group-hover:scale-110 transition-transform">
              <FaComment className="text-[var(--color-primary)] text-xl" />
            </div>
            <div className="badge badge-primary badge-sm font-semibold shadow-sm">Total</div>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <div className="text-4xl font-bold text-[var(--color-primary)]">
              {analytics.totalConversations.toLocaleString("id-ID")}
            </div>
          </div>
          <div className="text-sm font-semibold text-[var(--color-text)] mb-2">Total Percakapan</div>
          <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] bg-[var(--color-bg)] rounded-lg px-2 py-1">
            <FaUsers className="text-[var(--color-primary)]" />
            <span className="font-medium">{analytics.uniqueChats} chat unik</span>
          </div>
        </div>

        {/* Sentiment Score */}
        <div className="group bg-[var(--color-surface)] rounded-2xl p-6 shadow-lg border border-[var(--color-border)] hover:shadow-xl hover:scale-[1.01] transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-500/10 rounded-xl shadow-md group-hover:scale-110 transition-transform">
              <FaSmile className="text-green-600 dark:text-green-400 text-xl" />
            </div>
            <div className={`badge badge-sm font-semibold shadow-sm flex items-center gap-1 ${sentimentBadge.color}`}>
              {sentimentBadge.icon}
              {sentimentBadge.label}
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <div className="text-4xl font-bold text-green-600 dark:text-green-400">
              {analytics.sentimentScore.toFixed(1)}%
            </div>
          </div>
          <div className="text-sm font-semibold text-[var(--color-text)] mb-2">Sentiment Score</div>
          <div className="text-xs font-semibold text-[var(--color-text-muted)] py-1">
            Kepuasan User
          </div>
        </div>

        {/* Handover Rate */}
        <div className="group bg-[var(--color-surface)] rounded-2xl p-6 shadow-lg border border-[var(--color-border)] hover:shadow-xl hover:scale-[1.01] transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-500/10 rounded-xl shadow-md group-hover:scale-110 transition-transform">
              <FaHistory className="text-orange-500 dark:text-orange-400 text-xl" />
            </div>
            <div className="badge badge-warning badge-sm font-semibold shadow-sm">Handoff</div>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <div className="text-4xl font-bold text-orange-500 dark:text-orange-400">
              {analytics.handoverRate.toFixed(1)}%
            </div>
          </div>
          <div className="text-sm font-semibold text-[var(--color-text)] mb-2">Handover Rate</div>
          <div className="text-xs font-semibold text-[var(--color-text-muted)] py-1">
            Transfer ke Manusia
          </div>
        </div>
      </div>

      {/* Chart - Enhanced */}
      {chartData && analytics.dailyStats.some((d) => d.count > 0) && (
        <div className="bg-[var(--color-surface)] rounded-2xl p-6 shadow-lg border border-[var(--color-border)] hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-lg font-bold text-[var(--color-text)] flex items-center gap-2">
              <div className="p-1.5 bg-[var(--color-primary)] rounded-lg text-white">
                <FaChartBar className="text-sm" />
              </div>
              Tren Percakapan
            </h4>
            <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[var(--color-primary)]"></div>
                <span>Percakapan</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span>Handoff</span>
              </div>
            </div>
          </div>
          <div className="h-72">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>
      )}

      {/* Recent Conversations - Enhanced */}
      {analytics.recentConversations && analytics.recentConversations.length > 0 && (
        <div className="bg-[var(--color-surface)] rounded-2xl shadow-lg border border-[var(--color-border)] hover:shadow-xl transition-shadow overflow-hidden">
          <div className="p-6 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
            <h4 className="text-lg font-bold text-[var(--color-text)] flex items-center gap-2">
              <div className="p-1.5 bg-[var(--color-primary)] rounded-lg text-white">
                <FaHistory className="text-sm" />
              </div>
              Percakapan Terakhir
            </h4>
          </div>
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead className="bg-[var(--color-bg)]">
                <tr>
                  <th className="text-xs font-semibold text-[var(--color-text-muted)] uppercase">Chat ID</th>
                  <th className="text-xs font-semibold text-[var(--color-text-muted)] uppercase">Pesan User</th>
                  <th className="text-xs font-semibold text-[var(--color-text-muted)] uppercase">Respon AI</th>
                  <th className="text-xs font-semibold text-[var(--color-text-muted)] uppercase">Status</th>
                  <th className="text-xs font-semibold text-[var(--color-text-muted)] uppercase">Waktu</th>
                </tr>
              </thead>
              <tbody>
                {analytics.recentConversations.map((conv, idx) => (
                  <tr
                    key={conv.id}
                    className={`hover:bg-[var(--color-surface)] transition-colors ${
                      idx % 2 === 0 ? "bg-[var(--color-bg)]" : "bg-[var(--color-surface)]/50"
                    }`}
                  >
                    <td className="font-mono text-xs text-[var(--color-text-muted)] py-3">
                      {conv.chatId.substring(0, 15)}...
                    </td>
                    <td className="max-w-xs truncate text-sm text-[var(--color-text)] py-3">
                      {conv.userMessage || "-"}
                    </td>
                    <td className="max-w-xs truncate text-sm text-[var(--color-text)] py-3">
                      {conv.aiResponse || "-"}
                    </td>
                    <td className="py-3">
                      {conv.isHandoff ? (
                        <span className="badge badge-warning badge-sm font-medium shadow-sm">
                          Handoff
                        </span>
                      ) : (
                        <span className="badge badge-success badge-sm font-medium shadow-sm">
                          Selesai
                        </span>
                      )}
                    </td>
                    <td className="text-xs text-[var(--color-text-muted)] py-3">
                      {new Date(conv.createdAt).toLocaleString("id-ID", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State - Enhanced */}
      {analytics.totalConversations === 0 && (
        <div className="bg-[var(--color-surface)] rounded-2xl p-12 border-2 border-dashed border-[var(--color-border)] text-center">
          <div className="w-20 h-20 bg-[var(--color-bg)] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <FaChartBar className="text-[var(--color-text-muted)] text-3xl" />
          </div>
          <h3 className="text-xl font-bold text-[var(--color-text)] mb-2">Belum Ada Data</h3>
          <p className="text-[var(--color-text-muted)] text-sm max-w-md mx-auto leading-relaxed">
            Data analitik akan muncul setelah AI Agent mulai berinteraksi dengan pengguna nyata di
            mode production.
          </p>
        </div>
      )}
    </div>
  );
};

export default EvaluationTab;
