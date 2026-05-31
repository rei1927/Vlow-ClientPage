import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    FaSearch,
    FaSync,
    FaWhatsapp,
    FaUserCircle,
    FaChevronDown,
    FaFileExport,
    FaFilter,
    FaCopy,
    FaCheck
} from "react-icons/fa";
import { getPlatforms } from "../../features/platforms/platformSlice";
import axiosInstance from "../../api/axiosInstance";
import toast from "react-hot-toast";
import FeatureAccessGuard from "../../components/common/FeatureAccessGuard";

const CRMDashboard = () => {
    const dispatch = useDispatch();
    const { platforms, isLoading: platformsLoading } = useSelector((state) => state.platforms);

    const [selectedPlatform, setSelectedPlatform] = useState(null);
    const [chats, setChats] = useState([]);
    const [isFetchingChats, setIsFetchingChats] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [copiedId, setCopiedId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);

    // Load platforms on mount
    useEffect(() => {
        dispatch(getPlatforms({ limit: 100 }));
    }, [dispatch]);

    // Auto-select first WORKING platform if none selected
    useEffect(() => {
        if (!selectedPlatform && platforms && platforms.length > 0) {
            const workingPlatform = platforms.find(p => p.status === "WORKING");
            if (workingPlatform) {
                setSelectedPlatform(workingPlatform);
            }
        }
    }, [platforms, selectedPlatform]);

    // Fetch chats when platform changes
    useEffect(() => {
        if (selectedPlatform) {
            fetchChats();
        } else {
            setChats([]);
        }
    }, [selectedPlatform]);

    const fetchChats = async (showLoading = true) => {
        if (!selectedPlatform) return;
        if (showLoading) setIsFetchingChats(true);
        try {
            const res = await axiosInstance.get(`/chats/${selectedPlatform.id}`);
            if (res.data?.success) {
                setChats(res.data.data || []);
            }
        } catch (error) {
            console.error("Error fetching CRM chats:", error);
            toast.error(error.response?.data?.message || "Gagal memuat daftar kontak CRM");
        } finally {
            if (showLoading) setIsFetchingChats(false);
        }
    };

    const filteredChats = useMemo(() => {
        let list = chats || [];

        // Apply Search Filter
        if (searchKeyword.trim() !== "") {
            const keyword = searchKeyword.toLowerCase();
            list = list.filter(chat => {
                const phone = chat.realPhoneNumber ? chat.realPhoneNumber.split('@')[0] : String(typeof chat.id === 'object' ? (chat.id._serialized || chat.id.id) : chat.id).split('@')[0];
                const chatName = (chat.name || phone).toLowerCase();
                return chatName.includes(keyword) || phone.includes(keyword);
            });
        }
        
        return list;
    }, [chats, searchKeyword]);

    // Reset page to 1 when filter or platform changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchKeyword, selectedPlatform]);

    const itemsPerPage = 10;
    const totalPages = Math.ceil(filteredChats.length / itemsPerPage);

    const paginatedChats = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredChats.slice(start, start + itemsPerPage);
    }, [filteredChats, currentPage]);

    const handleExport = () => {
        if (!filteredChats || filteredChats.length === 0) {
            toast.error("Tidak ada data untuk dieksport");
            return;
        }

        // Prepare CSV Headers
        const headers = ["WhatsApp Name", "Phone Number", "Requirements", "Terakhir Aktif"];
        
        // Prepare CSV Rows
        const rows = filteredChats.map(chat => {
            const rawId = typeof chat.id === 'object' ? (chat.id._serialized || chat.id.id) : chat.id;
            let extractedPhone = chat.realPhoneNumber ? chat.realPhoneNumber.split('@')[0] : String(rawId).split('@')[0];
            let displayName = chat.customName || chat.name || extractedPhone;
            
            // Re-apply same logic for Meta IDs to match table display
            const isLikelySystemId = !chat.realPhoneNumber && /^\d{13,20}$/.test(extractedPhone);
            const isNamePhoneFormat = /^[\+\d\s\-\(\)]{8,20}$/.test(displayName);
            let displayPhone = extractedPhone;
            
            if (isLikelySystemId) {
                const origNameIsPhone = chat.name && /^[\+\d\s\-\(\)]{8,20}$/.test(chat.name);
                if (origNameIsPhone) {
                    displayPhone = chat.name;
                } else if (isNamePhoneFormat) {
                    displayPhone = displayName;
                    if (chat.customName) displayName = chat.customName;
                } else {
                    displayPhone = extractedPhone + " (Meta ID)";
                }
            }

            let lastActive = "-";
            if (chat.timestamp) {
                const numTs = Number(chat.timestamp);
                const date = new Date(numTs < 10000000000 ? numTs * 1000 : numTs);
                lastActive = date.toLocaleString("id-ID", {
                    day: '2-digit', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                });
            }

            const requirements = chat.requirements || "Belum ada data";

            // Escape quotes and handle commas in CSV
            const escapeCSV = (str) => `"${String(str).replace(/"/g, '""')}"`;

            return [
                escapeCSV(displayName),
                escapeCSV(displayPhone),
                escapeCSV(requirements),
                escapeCSV(lastActive)
            ].join(",");
        });

        // Combine headers and rows
        const csvContent = [headers.join(","), ...rows].join("\n");
        
        // Add BOM for Excel UTF-8 support
        const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `CRM_Kontak_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast.success("Berhasil mengeksport data ke CSV!");
    };

    return (
        <FeatureAccessGuard feature="crm">
        <div className="h-[calc(100vh-100px)] flex flex-col bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] overflow-hidden shadow-sm animate-fade-in">
            {/* Header Section */}
            <div className="p-4 border-b border-[var(--color-border)] flex flex-col sm:flex-row justify-between items-center gap-4 bg-[var(--color-surface)] z-10">
                <div>
                    <h2 className="text-xl font-bold text-[var(--color-text)]">Customer Relationship Management (CRM)</h2>
                    <p className="text-sm text-[var(--color-text-muted)]">Kelola kontak WhatsApp dari pelanggan Anda</p>
                </div>
                
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button 
                        onClick={() => fetchChats(true)} 
                        disabled={isFetchingChats || !selectedPlatform} 
                        className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors bg-[var(--color-bg)] rounded-lg border border-[var(--color-border)]"
                        title="Refresh Data"
                    >
                        <FaSync className={isFetchingChats ? "animate-spin" : ""} />
                    </button>
                    
                    {/* Platform Selector Dropdown */}
                    <div className="relative w-full sm:w-56">
                        <button 
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)} 
                            className="w-full flex items-center justify-between px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text)] hover:border-[var(--color-primary)] transition-colors"
                        >
                            <div className="flex items-center gap-2 truncate">
                                <FaWhatsapp className={selectedPlatform?.status === "WORKING" ? "text-green-500" : "text-gray-400"} />
                                <span className="truncate">{selectedPlatform ? selectedPlatform.name : "Pilih Akun WhatsApp"}</span>
                            </div>
                            <FaChevronDown className="text-[var(--color-text-muted)] text-xs" />
                        </button>

                        {isDropdownOpen && (
                            <div className="absolute right-0 sm:right-auto mt-2 w-full sm:w-64 bg-[var(--color-surface)] rounded-xl shadow-lg border border-[var(--color-border)] z-50 p-2">
                                <div className="text-xs font-semibold text-[var(--color-text-muted)] mb-2 px-2 uppercase tracking-wider">
                                    Pilih Akun WhatsApp
                                </div>
                                {platformsLoading ? (
                                    <div className="p-2 text-center"><span className="loading loading-spinner loading-xs text-[var(--color-primary)]"></span></div>
                                ) : platforms.length === 0 ? (
                                    <div className="p-2 text-xs text-[var(--color-text-muted)] text-center">Belum ada akun terhubung</div>
                                ) : (
                                    <div className="max-h-48 overflow-y-auto">
                                        {platforms.map(pf => (
                                            <button
                                                key={pf.id}
                                                disabled={pf.status !== "WORKING"}
                                                onClick={() => {
                                                    setSelectedPlatform(pf);
                                                    setIsDropdownOpen(false);
                                                }}
                                                className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center gap-2
                                                    ${selectedPlatform?.id === pf.id ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-medium' : 'hover:bg-[var(--color-bg)] text-[var(--color-text)]'}
                                                    ${pf.status !== "WORKING" ? 'opacity-50 cursor-not-allowed' : ''}
                                                `}
                                            >
                                                <FaWhatsapp className={pf.status === "WORKING" ? "text-green-500" : "text-gray-400"} />
                                                <span className="truncate flex-1">{pf.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Toolbar Section */}
            <div className="p-4 bg-[var(--color-bg)] border-b border-[var(--color-border)] flex flex-wrap gap-3 items-center justify-between">
                <div className="relative flex-1 min-w-[250px] max-w-md">
                    <FaSearch className="absolute left-3 top-3 text-[var(--color-text-muted)]" />
                    <input
                        type="text"
                        placeholder="Cari nama atau nomor telepon..."
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:border-[var(--color-primary)] text-[var(--color-text)]"
                    />
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text)] hover:bg-[var(--color-bg)] transition-colors">
                        <FaFilter className="text-[var(--color-text-muted)]" />
                        <span>Filter</span>
                    </button>
                    <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text)] hover:bg-[var(--color-bg)] transition-colors">
                        <FaFileExport className="text-[var(--color-text-muted)]" />
                        <span>Export</span>
                    </button>
                </div>
            </div>

            {/* Table Section */}
            <div className="flex-1 overflow-auto bg-[var(--color-surface)]">
                {platformsLoading || isFetchingChats ? (
                    <div className="flex justify-center items-center h-full text-[var(--color-text-muted)] p-8">
                        <span className="loading loading-spinner text-[var(--color-primary)] loading-lg"></span>
                    </div>
                ) : !selectedPlatform ? (
                    <div className="flex flex-col justify-center items-center h-full p-8 text-center">
                        <FaWhatsapp className="text-6xl text-gray-300 mb-4" />
                        <h3 className="text-lg font-bold text-[var(--color-text)] mb-2">Pilih Akun WhatsApp</h3>
                        <p className="text-[var(--color-text-muted)] text-sm max-w-sm">
                            Pilih akun WhatsApp Anda di pojok kanan atas untuk melihat daftar kontak pelanggan.
                        </p>
                    </div>
                ) : filteredChats.length === 0 ? (
                    <div className="flex flex-col justify-center items-center h-full p-8 text-center">
                        <FaUserCircle className="text-6xl text-gray-300 mb-4" />
                        <h3 className="text-lg font-bold text-[var(--color-text)] mb-2">Kontak Kosong</h3>
                        <p className="text-[var(--color-text-muted)] text-sm">
                            Tidak ada data kontak yang ditemukan untuk pencarian atau filter yang dipilih.
                        </p>
                    </div>
                ) : (
                    <div className="min-w-[600px]">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-[var(--color-bg)] sticky top-0 z-10 shadow-sm border-b border-[var(--color-border)]">
                                <tr>
                                    <th className="px-6 py-4 font-semibold text-[var(--color-text)] border-r border-[var(--color-border)] w-12 text-center">#</th>
                                    <th className="px-6 py-4 font-semibold text-[var(--color-text)] border-r border-[var(--color-border)]">WhatsApp Name</th>
                                    <th className="px-6 py-4 font-semibold text-[var(--color-text)] border-r border-[var(--color-border)]">Phone Number</th>
                                    <th className="px-6 py-4 font-semibold text-[var(--color-text)] border-r border-[var(--color-border)]">Requirements</th>
                                    <th className="px-6 py-4 font-semibold text-[var(--color-text)]">Terakhir Aktif</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--color-border)]">
                                {paginatedChats.map((chat, idx) => {
                                    const rawId = typeof chat.id === 'object' ? (chat.id._serialized || chat.id.id) : chat.id;
                                    let extractedPhone = chat.realPhoneNumber ? chat.realPhoneNumber.split('@')[0] : String(rawId).split('@')[0];
                                    let displayName = chat.customName || chat.name || extractedPhone;
                                    
                                    // Handle Meta Cloud API anomaly where ID is PSID and Name is Phone Number
                                    const isLikelySystemId = !chat.realPhoneNumber && /^\d{13,20}$/.test(extractedPhone);
                                    const isNamePhoneFormat = /^[\+\d\s\-\(\)]{8,20}$/.test(displayName);
                                    let displayPhone = extractedPhone;
                                    
                                    if (isLikelySystemId) {
                                        const origNameIsPhone = chat.name && /^[\+\d\s\-\(\)]{8,20}$/.test(chat.name);
                                        if (origNameIsPhone) {
                                            displayPhone = chat.name;
                                        } else if (isNamePhoneFormat) {
                                            displayPhone = displayName;
                                            if (chat.customName) displayName = chat.customName;
                                        } else {
                                            displayPhone = extractedPhone + " (Meta ID)";
                                        }
                                    }
                                    
                                    return (
                                        <tr key={rawId} className="hover:bg-[var(--color-bg)] transition-colors group cursor-default">
                                            <td className="px-6 py-3 text-center text-[var(--color-text-muted)] border-r border-[var(--color-border)]">
                                                {(currentPage - 1) * itemsPerPage + idx + 1}
                                            </td>
                                            <td className="px-6 py-3 border-r border-[var(--color-border)]">
                                                <div className="flex items-center gap-3">
                                                    {chat.profilePicUrl && chat.profilePicUrl !== 'NOT_FOUND' ? (
                                                        <img src={chat.profilePicUrl} alt={displayName} className="w-8 h-8 rounded-full object-cover" referrerPolicy="no-referrer" />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)] font-bold">
                                                            {displayName.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <span className="font-semibold text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">
                                                            {displayName}
                                                        </span>
                                                        {chat.customName ? (
                                                            <span className="ml-2 text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded uppercase font-bold">
                                                                AI Extracted
                                                            </span>
                                                        ) : chat.name && chat.name !== displayPhone ? (
                                                            <span className="hidden ml-2 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded uppercase font-bold">
                                                                Saved Contact
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 text-[var(--color-text)] font-mono border-r border-[var(--color-border)]">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-green-600 flex-shrink-0">
                                                        <FaWhatsapp className="text-[10px]" />
                                                    </span>
                                                    <span className="truncate">{displayPhone}</span>
                                                    <button
                                                        onClick={() => {
                                                            const cleanNumber = displayPhone.replace(" (Meta ID)", "");
                                                            navigator.clipboard.writeText(cleanNumber);
                                                            setCopiedId(rawId);
                                                            toast.success("Nomor telepon disalin!");
                                                            setTimeout(() => setCopiedId(null), 2000);
                                                        }}
                                                        className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors p-1 rounded hover:bg-[var(--color-bg)] flex-shrink-0"
                                                        title="Salin Nomor Telepon"
                                                    >
                                                        {copiedId === rawId ? (
                                                            <FaCheck className="text-green-500 text-xs" />
                                                        ) : (
                                                            <FaCopy className="text-xs" />
                                                        )}
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 text-sm border-r border-[var(--color-border)]">
                                                {chat.requirements ? (
                                                    <div className="max-w-xs truncate text-[var(--color-text)]" title={chat.requirements}>
                                                        {chat.requirements}
                                                    </div>
                                                ) : (
                                                    <span className="text-[var(--color-text-muted)] italic text-xs">Belum ada data</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-3 text-sm text-[var(--color-text-muted)]">
                                                {(() => {
                                                    if (!chat.timestamp) return "-";
                                                    const numTs = Number(chat.timestamp);
                                                    const date = new Date(numTs < 10000000000 ? numTs * 1000 : numTs);
                                                    return date.toLocaleString("id-ID", {
                                                        day: '2-digit', month: 'short', year: 'numeric',
                                                        hour: '2-digit', minute: '2-digit'
                                                    });
                                                })()}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            
            {/* Table Footer / Pagination Controls */}
            {filteredChats.length > 0 && (
                <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col sm:flex-row justify-between items-center gap-3 text-sm text-[var(--color-text-muted)]">
                    <span>
                        Menampilkan <strong>{((currentPage - 1) * itemsPerPage) + 1}</strong> - <strong>{Math.min(currentPage * itemsPerPage, filteredChats.length)}</strong> dari <strong>{filteredChats.length}</strong> kontak WhatsApp
                    </span>
                    {totalPages > 1 && (
                        <div className="flex items-center gap-1 bg-[var(--color-bg)] p-1 rounded-xl border border-[var(--color-border)]">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 rounded-lg text-xs font-semibold hover:bg-[var(--color-surface)] text-[var(--color-text)] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                            >
                                Prev
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors flex items-center justify-center ${
                                        currentPage === page
                                            ? "bg-[var(--color-primary)] text-white shadow-sm"
                                            : "hover:bg-[var(--color-surface)] text-[var(--color-text)]"
                                    }`}
                                >
                                    {page}
                                </button>
                            ))}
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 rounded-lg text-xs font-semibold hover:bg-[var(--color-surface)] text-[var(--color-text)] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
        </FeatureAccessGuard>
    );
};

export default CRMDashboard;
