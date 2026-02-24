import { FaExclamationTriangle } from "react-icons/fa";

const QuotaOverlay = ({ user, usage }) => {
    // Only apply to customers
    if (!user || user.role === "admin") return null;

    const issues = [];

    // 1. Check subscription expiry
    if (user.subscriptionExpiry) {
        const expiryDate = new Date(user.subscriptionExpiry);
        if (expiryDate < new Date()) {
            issues.push("Mohon maaf, Masa aktif anda sudah habis.");
        }
    }

    // 2. Check conversation quota
    if (
        usage &&
        !usage.isLoading &&
        usage.maxConversations > 0 &&
        usage.conversations >= usage.maxConversations
    ) {
        issues.push("Kuota conversation anda sudah habis.");
    }

    // 3. Check AI response quota
    if (
        usage &&
        !usage.isLoading &&
        usage.maxAiResponses > 0 &&
        usage.aiResponses >= usage.maxAiResponses
    ) {
        issues.push("Kuota AI response anda sudah habis.");
    }

    // Don't render anything if no issues
    if (issues.length === 0) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            {/* Blurred Background Overlay */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-md" />

            {/* Message Card */}
            <div className="relative z-10 w-full max-w-md mx-4 animate-[fadeIn_0.5s_ease-out]">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-red-200 dark:border-red-800/50 overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-red-500 to-orange-500 px-6 py-5 text-center">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm mb-3">
                            <FaExclamationTriangle className="text-white text-2xl" />
                        </div>
                        <h2 className="text-white font-bold text-lg">Akses Terbatas</h2>
                    </div>

                    {/* Body */}
                    <div className="p-6 space-y-4">
                        {issues.map((msg, idx) => (
                            <div
                                key={idx}
                                className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800/30"
                            >
                                <div className="w-2 h-2 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                                <p className="text-sm font-medium text-red-700 dark:text-red-300">
                                    {msg}
                                </p>
                            </div>
                        ))}

                        <div className="pt-2 text-center">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Silakan hubungi Admin untuk memperpanjang masa aktif atau
                                menambah kuota Anda.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuotaOverlay;
