import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import {
  FaUsers,
  FaRobot,
  FaWhatsapp,
  FaChartLine,
  FaServer,
  FaComments,
  FaArrowRight,
  FaSpinner,
  FaCheckCircle,
  FaExclamationTriangle,
  FaCalendarAlt,
  FaCalendarTimes,
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
import {
  getDashboardStats,
  getAdminDashboardStats,
} from "../features/dashboard/dashboardSlice";
import toast from "react-hot-toast";
import SubscriptionWarning from "../components/common/SubscriptionWarning";
import AdminStatCard from "../components/dashboard/AdminStatCard";
import RecentCustomersTable from "../components/dashboard/RecentCustomersTable";

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

// --- WIDGET CARD COMPONENT ---
const StatCard = ({ title, value, icon, colorClass, desc, isLoading }) => (
  <div className="bg-[var(--color-surface)] p-4 sm:p-6 rounded-2xl shadow-sm border border-[var(--color-border)] hover:shadow-md transition-shadow group">
    <div className="flex items-start justify-between mb-3 sm:mb-4">
      <div className="flex-1">
        <p className="text-xs sm:text-sm font-medium text-[var(--color-text-muted)] mb-1">{title}</p>
        {isLoading ? (
          <div className="flex items-center gap-2">
            <FaSpinner className="animate-spin text-[var(--color-text-muted)]" />
            <span className="text-[var(--color-text-muted)]">Loading...</span>
          </div>
        ) : (
          <h3 className="text-xl sm:text-2xl font-bold text-[var(--color-text)]">{value}</h3>
        )}
      </div>
      <div
        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${colorClass} group-hover:scale-110 transition-transform`}
      >
        {icon}
      </div>
    </div>
    {desc && <p className="text-xs text-[var(--color-text-muted)]">{desc}</p>}
  </div>
);

// --- ADMIN VIEW ---
const AdminDashboard = ({ user }) => {
  const dispatch = useDispatch();
  const { adminStats, isAdminLoading, isError, message } = useSelector((state) => state.dashboard);

  useEffect(() => {
    dispatch(getAdminDashboardStats());
  }, [dispatch]);

  useEffect(() => {
    if (isError && message) {
      toast.error(message, { id: "admin-dashboard-error" });
    }
  }, [isError, message]);

  return (
    <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)] rounded-3xl p-6 sm:p-8 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-lg shadow-[var(--color-primary)]/20">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Selamat Datang, Admin! 🚀</h1>
          <p className="text-white/90 max-w-xl">
            Pantau pertumbuhan user dan performa sistem secara realtime. Kelola akses pelanggan
            dengan mudah dari sini.
          </p>
        </div>
        <div className="hidden md:block opacity-80">
          <FaServer size={80} />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <AdminStatCard
          title="Total Customer"
          value={adminStats?.totalCustomers?.toString() || "0"}
          icon={<FaUsers className="text-blue-600 dark:text-blue-400" />}
          colorClass="bg-blue-500/10 dark:bg-blue-500/20"
          desc={
            adminStats?.newCustomersThisWeek > 0
              ? `↗ ${adminStats.newCustomersThisWeek} user baru minggu ini`
              : "Tidak ada user baru minggu ini"
          }
          isLoading={isAdminLoading}
        />
        <AdminStatCard
          title="Active Subscription"
          value={adminStats?.activeSubscriptions?.toString() || "0"}
          icon={<FaChartLine className="text-green-600 dark:text-green-400" />}
          colorClass="bg-green-500/10 dark:bg-green-500/20"
          desc={
            adminStats?.activeSubscriptionPercentage !== undefined
              ? `${adminStats.activeSubscriptionPercentage}% operational status`
              : "Loading..."
          }
          isLoading={isAdminLoading}
        />
        <AdminStatCard
          title="Total Agents"
          value={adminStats?.totalAgents?.toString() || "0"}
          icon={<FaRobot className="text-purple-600 dark:text-purple-400" />}
          colorClass="bg-purple-500/10 dark:bg-purple-500/20"
          desc={
            adminStats?.totalMessagesToday !== undefined
              ? `${adminStats.totalMessagesToday.toLocaleString("id-ID")} pesan hari ini`
              : "Loading..."
          }
          isLoading={isAdminLoading}
        />
      </div>

      {/* Recent Customers Table */}
      <RecentCustomersTable
        customers={adminStats?.recentCustomers || []}
        isLoading={isAdminLoading}
      />

      {/* Activity Chart */}
      <div className="bg-[var(--color-surface)] rounded-2xl shadow-sm border border-[var(--color-border)] p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-[var(--color-text)] mb-1">
              Aktivitas Sistem
            </h3>
            <p className="text-sm text-[var(--color-text-muted)]">Statistik 7 hari terakhir</p>
          </div>
          {adminStats?.dailyStats && (
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-[var(--color-text-muted)]">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[var(--color-primary)]"></div>
                <span>Pesan</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Customer Baru</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                <span>Agent Baru</span>
              </div>
            </div>
          )}
        </div>

        {isAdminLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <FaSpinner className="animate-spin text-[var(--color-text-muted)] text-3xl mb-4" />
            <p className="text-[var(--color-text-muted)]">Memuat data chart...</p>
          </div>
        ) : adminStats?.dailyStats &&
          adminStats.dailyStats.some(
            (stat) => stat.messages > 0 || stat.newCustomers > 0 || stat.newAgents > 0,
          ) ? (
          <div className="h-64 sm:h-80">
            <Line
              data={{
                labels: adminStats.dailyStats.map((stat) => {
                  const date = new Date(stat.date);
                  return date.toLocaleDateString("id-ID", {
                    weekday: "short",
                    day: "numeric",
                  });
                }),
                datasets: [
                  {
                    label: "Pesan",
                    data: adminStats.dailyStats.map((stat) => stat.messages),
                    borderColor: "#1C4D8D",
                    backgroundColor: "rgba(28, 77, 141, 0.1)",
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: "#1C4D8D",
                    pointBorderColor: "#fff",
                    pointBorderWidth: 2,
                  },
                  {
                    label: "Customer Baru",
                    data: adminStats.dailyStats.map((stat) => stat.newCustomers),
                    borderColor: "#10B981",
                    backgroundColor: "rgba(16, 185, 129, 0.1)",
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: "#10B981",
                    pointBorderColor: "#fff",
                    pointBorderWidth: 2,
                  },
                  {
                    label: "Agent Baru",
                    data: adminStats.dailyStats.map((stat) => stat.newAgents),
                    borderColor: "#8B5CF6",
                    backgroundColor: "rgba(139, 92, 246, 0.1)",
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: "#8B5CF6",
                    pointBorderColor: "#fff",
                    pointBorderWidth: 2,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "top",
                    labels: {
                      usePointStyle: true,
                      padding: 15,
                      font: {
                        size: 12,
                        weight: "500",
                      },
                    },
                  },
                  tooltip: {
                    mode: "index",
                    intersect: false,
                    backgroundColor: "rgba(0, 0, 0, 0.8)",
                    padding: 12,
                    titleFont: {
                      size: 13,
                      weight: "600",
                    },
                    bodyFont: {
                      size: 12,
                    },
                    cornerRadius: 8,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      stepSize: 1,
                      font: {
                        size: 11,
                      },
                    },
                    grid: {
                      color: "rgba(0, 0, 0, 0.05)",
                    },
                  },
                  x: {
                    ticks: {
                      font: {
                        size: 11,
                      },
                    },
                    grid: {
                      display: false,
                    },
                  },
                },
              }}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="bg-[var(--color-border)] p-4 rounded-full mb-4">
              <FaChartLine size={32} className="text-[var(--color-text-muted)]" />
            </div>
            <h3 className="font-bold text-[var(--color-text-muted)] mb-2">Belum Ada Data</h3>
            <p className="text-sm text-[var(--color-text-muted)] max-w-md">
              Grafik aktivitas sistem akan muncul di sini setelah ada aktivitas dari customer.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// --- CUSTOMER VIEW ---
const CustomerDashboard = ({ user }) => {
  const dispatch = useDispatch();
  const { stats, isLoading, isError, message } = useSelector((state) => state.dashboard);

  useEffect(() => {
    dispatch(getDashboardStats());
  }, [dispatch]);

  useEffect(() => {
    if (isError && message) {
      toast.error(message, { id: "dashboard-error" });
    }
  }, [isError, message]);

  // Prepare chart data
  const chartData = stats?.dailyStats
    ? {
        labels: stats.dailyStats.map((stat) => {
          const date = new Date(stat.date);
          return date.toLocaleDateString("id-ID", { weekday: "short", day: "numeric" });
        }),
        datasets: [
          {
            label: "Percakapan",
            data: stats.dailyStats.map((stat) => stat.count),
            borderColor: "#1C4D8D",
            backgroundColor: "rgba(28, 77, 141, 0.1)",
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: "#1C4D8D",
            pointBorderColor: "#fff",
            pointBorderWidth: 2,
          },
          {
            label: "Handoff",
            data: stats.dailyStats.map((stat) => stat.handoffs),
            borderColor: "#F59E0B",
            backgroundColor: "rgba(245, 158, 11, 0.1)",
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: "#F59E0B",
            pointBorderColor: "#fff",
            pointBorderWidth: 2,
          },
        ],
      }
    : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12,
            weight: "500",
          },
        },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: 12,
        titleFont: {
          size: 14,
          weight: "bold",
        },
        bodyFont: {
          size: 13,
        },
        cornerRadius: 8,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
        ticks: {
          stepSize: 1,
          font: {
            size: 11,
          },
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          },
        },
      },
    },
  };

  const hasData = stats?.dailyStats?.some((stat) => stat.count > 0) || false;

  // Calculate subscription info
  const getSubscriptionInfo = () => {
    if (!user?.subscriptionExpiry) {
      return {
        status: "not_activated",
        expiryDate: null,
        daysRemaining: null,
        isExpired: true,
        isWarning: false,
      };
    }

    const expiryDate = new Date(user.subscriptionExpiry);
    const now = new Date();
    const isExpired = expiryDate < now;
    const daysRemaining = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
    const isWarning = daysRemaining <= 7 && daysRemaining > 0;

    return {
      status: isExpired ? "expired" : isWarning ? "warning" : "active",
      expiryDate,
      daysRemaining,
      isExpired,
      isWarning,
    };
  };

  const subscriptionInfo = getSubscriptionInfo();

  return (
    <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
      {/* Subscription Warning */}
      <SubscriptionWarning
        subscriptionExpiry={user?.subscriptionExpiry}
        userRole={user?.role}
      />

      {/* Welcome Section */}
      <div className="bg-[var(--color-surface)] rounded-3xl p-6 sm:p-8 border border-[var(--color-border)] shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-6">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-[var(--color-text)] mb-2">Halo, {user?.name} 👋</h1>
            <p className="text-[var(--color-text-muted)] mb-6">
              AI Agent Anda siap melayani pelanggan. Cek performa chatbot Anda hari ini.
            </p>
            <Link
              to="/ai-agents/create"
              className="btn bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white border-none rounded-xl normal-case px-6 shadow-lg"
            >
              Buat Agent Baru <FaArrowRight className="ml-2" />
            </Link>
          </div>
        </div>

        {/* Status & Subscription Cards - Improved Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
          {/* Status Koneksi */}
          <div className="bg-[var(--color-surface)] rounded-2xl p-5 sm:p-6 flex flex-col justify-between border border-[var(--color-border)] shadow-sm hover:shadow-md transition-shadow min-h-[140px]">
            <div className="mb-4">
              <div className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wide mb-3 flex items-center gap-2">
                <FaWhatsapp className="text-[var(--color-primary)]" />
                Status Koneksi
              </div>
              <div
                className={`font-bold text-xl sm:text-2xl flex items-center gap-2 mb-2 ${
                  stats?.hasWorkingPlatform ? "text-[var(--color-secondary)]" : "text-[var(--color-text-muted)]"
                }`}
              >
                {stats?.hasWorkingPlatform ? (
                  <>
                    <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                    Connected
                  </>
                ) : (
                  <>
                    <FaExclamationTriangle />
                    Not Connected
                  </>
                )}
              </div>
            </div>
            {stats?.totalPlatforms > 0 && (
              <div className="text-xs text-[var(--color-text-muted)] font-medium pt-3 border-t border-[var(--color-border)]">
                {stats.connectedPlatforms} dari {stats.totalPlatforms} platform aktif
              </div>
            )}
          </div>

          {/* Masa Berlaku Langganan - Enhanced Design */}
          <div
            className={`rounded-2xl p-5 sm:p-6 flex flex-col justify-between border-2 shadow-sm hover:shadow-md transition-all min-h-[140px] ${
              subscriptionInfo.status === "expired" || subscriptionInfo.status === "not_activated"
                ? "bg-gradient-to-br from-red-50 via-red-50/80 to-orange-50 border-red-300"
                : subscriptionInfo.status === "warning"
                  ? "bg-gradient-to-br from-yellow-50 via-yellow-50/80 to-orange-50 border-yellow-300"
                  : "bg-gradient-to-br from-green-50 via-emerald-50/80 to-green-50 border-green-300"
            }`}
          >
            <div className="mb-4">
              <div className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                <FaCalendarAlt
                  className={
                    subscriptionInfo.status === "expired" || subscriptionInfo.status === "not_activated"
                      ? "text-red-600"
                      : subscriptionInfo.status === "warning"
                        ? "text-yellow-600"
                        : "text-green-600"
                  }
                />
                Masa Berlaku Langganan
              </div>

              {subscriptionInfo.status === "not_activated" ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <FaCalendarTimes className="text-red-600 text-lg" />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-red-700 text-lg">Belum Diaktifkan</div>
                      <div className="text-xs text-red-600 mt-0.5">Hubungi administrator</div>
                    </div>
                  </div>
                </div>
              ) : subscriptionInfo.status === "expired" ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <FaExclamationTriangle className="text-red-600 text-lg" />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-red-700 text-lg">Telah Berakhir</div>
                      <div className="text-sm text-red-600 mt-1 font-semibold">
                        {subscriptionInfo.expiryDate?.toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ) : subscriptionInfo.status === "warning" ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <FaCalendarTimes className="text-yellow-600 text-lg" />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-yellow-700 text-lg">
                        {subscriptionInfo.daysRemaining} Hari Lagi
                      </div>
                      <div className="text-sm text-yellow-700 mt-1 font-semibold">
                        {subscriptionInfo.expiryDate?.toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <FaCheckCircle className="text-green-600 text-lg" />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-green-700 text-lg">Aktif</div>
                      <div className="text-sm text-green-700 mt-1 font-semibold">
                        {subscriptionInfo.expiryDate?.toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Info */}
            <div
              className={`text-xs font-medium pt-3 border-t ${
                subscriptionInfo.status === "expired" || subscriptionInfo.status === "not_activated"
                  ? "border-red-200/50 text-red-600"
                  : subscriptionInfo.status === "warning"
                    ? "border-yellow-200/50 text-yellow-700"
                    : "border-green-200/50 text-green-700"
              }`}
            >
              {subscriptionInfo.status === "not_activated" ? (
                <span>Silakan hubungi administrator untuk mengaktifkan</span>
              ) : subscriptionInfo.status === "expired" ? (
                <span>Silakan hubungi administrator untuk memperpanjang</span>
              ) : subscriptionInfo.status === "warning" ? (
                <span>Segera perpanjang langganan Anda</span>
              ) : (
                <span>{subscriptionInfo.daysRemaining} hari tersisa</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <StatCard
          title="Total Agents"
          value={stats?.totalAgents?.toString() || "0"}
          icon={<FaRobot className="text-indigo-600" />}
          colorClass="bg-indigo-50"
          isLoading={isLoading}
        />
        <StatCard
          title="Messages Today"
          value={stats?.messagesToday?.toLocaleString("id-ID") || "0"}
          icon={<FaComments className="text-orange-600" />}
          colorClass="bg-orange-50"
          isLoading={isLoading}
        />
        <StatCard
          title="Platform Terhubung"
          value={stats?.connectedPlatforms || 0}
          icon={<FaWhatsapp className="text-green-600" />}
          colorClass="bg-green-50"
          desc={`dari ${stats?.totalPlatforms || 0} total`}
          isLoading={isLoading}
        />
      </div>

      {/* Conversation Statistics Chart */}
      <div className="bg-[var(--color-surface)] rounded-2xl shadow-sm border border-[var(--color-border)] p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-[var(--color-text)] mb-1">
              Statistik Percakapan
            </h3>
            <p className="text-sm text-[var(--color-text-muted)]">Aktivitas chatbot 7 hari terakhir</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <FaSpinner className="animate-spin text-[var(--color-text-muted)] text-3xl mb-4" />
            <p className="text-[var(--color-text-muted)]">Memuat data...</p>
          </div>
        ) : hasData && chartData ? (
          <div className="h-64 sm:h-80">
            <Line data={chartData} options={chartOptions} />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="bg-[var(--color-border)] p-4 rounded-full mb-4">
              <FaChartLine size={32} className="text-[var(--color-text-muted)]" />
            </div>
            <h3 className="font-bold text-[var(--color-text-muted)] mb-2">Belum Ada Data</h3>
            <p className="text-sm text-[var(--color-text-muted)] max-w-md">
              Grafik aktivitas chatbot akan muncul di sini setelah ada interaksi dengan pelanggan.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// --- MAIN CONTROLLER ---
const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);

  return (
    <div className="w-full space-y-6">
      {user?.role === "admin" ? <AdminDashboard user={user} /> : <CustomerDashboard user={user} />}
    </div>
  );
};

export default Dashboard;
