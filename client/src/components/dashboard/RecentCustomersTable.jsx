import { Link } from "react-router-dom";
import { FaSpinner } from "react-icons/fa";

/**
 * Komponen untuk menampilkan tabel customer terbaru
 */
const RecentCustomersTable = ({ customers, isLoading }) => {
  const getStatusBadge = (status) => {
    switch (status) {
      case "Active":
        return <span className="badge badge-success gap-2 text-white">Active</span>;
      case "Expired":
        return <span className="badge badge-error gap-2 text-white">Expired</span>;
      case "Inactive":
        return <span className="badge badge-warning gap-2 text-white">Inactive</span>;
      default:
        return <span className="badge badge-ghost gap-2">{status}</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-[var(--color-surface)] rounded-2xl shadow-sm border border-[var(--color-border)] p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-[var(--color-text)]">Customer Terbaru</h3>
          <Link to="/users" className="text-sm text-[var(--color-primary)] font-bold hover:underline">
            Lihat Semua
          </Link>
        </div>
        <div className="flex items-center justify-center py-12">
          <FaSpinner className="animate-spin text-[var(--color-text-muted)] text-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--color-surface)] rounded-2xl shadow-sm border border-[var(--color-border)] p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-[var(--color-text)]">Customer Terbaru</h3>
        <Link to="/users" className="text-sm text-[var(--color-primary)] font-bold hover:underline">
          Lihat Semua
        </Link>
      </div>
      <div className="overflow-x-auto">
        {customers && customers.length > 0 ? (
          <table className="table w-full min-w-125">
            <thead>
              <tr className="bg-[var(--color-bg)] text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
                <th>Nama</th>
                <th>Email</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer, idx) => (
                <tr
                  key={customer.id}
                  className={`border-b border-[var(--color-border)] hover:bg-[var(--color-border)]/30 transition-colors ${
                    idx % 2 === 0 ? "bg-[var(--color-surface)]" : "bg-[var(--color-bg)]/50"
                  }`}
                >
                  <td className="font-bold whitespace-nowrap text-[var(--color-text)]">{customer.name}</td>
                  <td className="text-[var(--color-text-muted)]">{customer.email}</td>
                  <td>{getStatusBadge(customer.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-12 text-[var(--color-text-muted)]">
            <p className="text-sm">Belum ada customer</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentCustomersTable;
