import { FaExclamationTriangle, FaCalendarTimes } from "react-icons/fa";

/**
 * Component untuk menampilkan peringatan subscription expired
 */
const SubscriptionWarning = ({ subscriptionExpiry, userRole }) => {
  // Only show for customer role
  if (userRole !== "customer") return null;

  // Check if subscription is expired
  if (!subscriptionExpiry) {
    return (
      <div className="bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 rounded-lg p-4 mb-6 shadow-md">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <FaExclamationTriangle className="text-red-500 text-xl mt-0.5" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-red-700 mb-1 flex items-center gap-2">
              <FaCalendarTimes /> Langganan Belum Diaktifkan
            </h3>
            <p className="text-sm text-red-600 mb-2">
              Akun Anda belum memiliki masa berlaku langganan. Silakan hubungi administrator untuk
              mengaktifkan langganan Anda.
            </p>
            <p className="text-xs text-red-500 font-medium">
              Fitur AI Agents tidak dapat digunakan sampai langganan diaktifkan.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const expiryDate = new Date(subscriptionExpiry);
  const now = new Date();
  const isExpired = expiryDate < now;
  const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

  if (isExpired) {
    return (
      <div className="bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 rounded-lg p-4 mb-6 shadow-md">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <FaExclamationTriangle className="text-red-500 text-xl mt-0.5" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-red-700 mb-1 flex items-center gap-2">
              <FaCalendarTimes /> Langganan Telah Berakhir
            </h3>
            <p className="text-sm text-red-600 mb-2">
              Masa berlaku langganan Anda telah berakhir pada{" "}
              <span className="font-bold">
                {expiryDate.toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
              . Silakan hubungi administrator untuk memperpanjang langganan Anda.
            </p>
            <p className="text-xs text-red-500 font-medium">
              Fitur AI Agents tidak dapat digunakan sampai langganan diperpanjang.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show warning if less than 7 days remaining
  if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
    return (
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-500 rounded-lg p-4 mb-6 shadow-md">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <FaExclamationTriangle className="text-yellow-600 text-xl mt-0.5" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-yellow-700 mb-1 flex items-center gap-2">
              <FaCalendarTimes /> Langganan Akan Berakhir
            </h3>
            <p className="text-sm text-yellow-700 mb-2">
              Masa berlaku langganan Anda akan berakhir dalam{" "}
              <span className="font-bold">{daysUntilExpiry} hari</span> ({" "}
              {expiryDate.toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}{" "}
              ). Silakan hubungi administrator untuk memperpanjang langganan Anda.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default SubscriptionWarning;
