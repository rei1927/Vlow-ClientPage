import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    FaSearch,
    FaEllipsisV,
    FaPaperPlane,
    FaUserCircle,
    FaCheckDouble,
    FaRobot,
    FaSmile,
    FaWhatsapp,
    FaSync,
    FaHandPaper,
    FaPhoneAlt,
    FaMapMarkerAlt,
    FaEnvelope,
    FaUserTie,
    FaChevronDown,
    FaPlus,
} from "react-icons/fa";
import { FiShield } from "react-icons/fi";
import { getPlatforms } from "../../features/platforms/platformSlice";
import axiosInstance from "../../api/axiosInstance";
import toast from "react-hot-toast";
import { parsePhoneNumber } from 'libphonenumber-js';

const getCountryFromPhone = (phone) => {
    if (!phone) return "Unknown";
    
    // Pastikan diawali dengan '+' agar dikenali sebagai format internasional
    let formattedPhone = phone;
    if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+' + formattedPhone;
    }

    try {
        const phoneNumber = parsePhoneNumber(formattedPhone);
        if (phoneNumber && phoneNumber.country) {
            const countryCode = phoneNumber.country; // e.g., 'ID', 'US'
            
            // Ambil nama negara secara dinamis menggunakan API bawaan browser
            const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
            const countryName = regionNames.of(countryCode);
            
            // Generate Emoji Bendera dari kode 2 huruf
            const flagEmoji = String.fromCodePoint(...[...countryCode.toUpperCase()].map(c => c.charCodeAt() + 127397));
            
            return `${countryName} ${flagEmoji}`;
        }
    } catch (err) {
        // Abaikan error parsing
    }
    
    return "International 🌍";
};

const ChatDashboard = () => {
    const dispatch = useDispatch();
    const { platforms, isLoading: platformsLoading } = useSelector((state) => state.platforms);
    const { isImpersonating } = useSelector((state) => state.auth);

    const [selectedPlatform, setSelectedPlatform] = useState(null);
    const [chats, setChats] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState("");

    const [isFetchingChats, setIsFetchingChats] = useState(false);
    const [isFetchingMessages, setIsFetchingMessages] = useState(false);
    const [isSending, setIsSending] = useState(false);

    // WA Business Label Feature State
    const [isBusiness, setIsBusiness] = useState(false);
    const [labels, setLabels] = useState([]);
    const [selectedLabel, setSelectedLabel] = useState("ALL");
    const [searchKeyword, setSearchKeyword] = useState("");
    const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
    const [isUpdatingLabel, setIsUpdatingLabel] = useState(false);

    // Human Handover State
    const [handoverStatus, setHandoverStatus] = useState(null); // null | 'ai' | 'human'
    const [isHandoverLoading, setIsHandoverLoading] = useState(false);
    const [chatHandoverMap, setChatHandoverMap] = useState({}); // { chatId: 'human' }

    const messagesEndRef = useRef(null);

    // Load platforms on mount
    useEffect(() => {
        dispatch(getPlatforms({ limit: 100 })); // fetch all
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
            fetchChatMeta(); // Cek isBusiness & get labels
            fetchChats();
        } else {
            setIsBusiness(false);
            setLabels([]);
            setSelectedLabel("ALL");
        }
    }, [selectedPlatform]);

    // Fetch messages when activeChat changes
    useEffect(() => {
        if (activeChat && selectedPlatform) {
            fetchMessages();
            fetchHandoverStatus();
        } else {
            setHandoverStatus(null);
        }
    }, [activeChat, selectedPlatform]);

    // Background Long-Polling for "Real-time" feel (every 10 seconds)
    useEffect(() => {
        let pollInterval;
        if (activeChat && selectedPlatform) {
            pollInterval = setInterval(() => {
                fetchChats(false); // Update sidebar silently
                fetchMessages(false); // Update chat window silently
            }, 10000); // 10 seconds
        }
        return () => {
            if (pollInterval) clearInterval(pollInterval);
        };
    }, [activeChat, selectedPlatform]);

    // Scroll to bottom when messages update
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Fetch handover status for active chat
    const fetchHandoverStatus = async () => {
        if (!activeChat || !selectedPlatform) return;
        try {
            const chatId = typeof activeChat.id === 'object' ? (activeChat.id._serialized || activeChat.id.id) : activeChat.id;
            const res = await axiosInstance.get(`/handover/status/${encodeURIComponent(chatId)}`, {
                params: { sessionId: selectedPlatform.sessionId }
            });
            setHandoverStatus(res.data?.status || 'ai');
        } catch {
            setHandoverStatus('ai');
        }
    };

    // Toggle handover status
    const handleHandover = async (action) => {
        if (!activeChat || !selectedPlatform) return;
        setIsHandoverLoading(true);
        try {
            const chatId = typeof activeChat.id === 'object' ? (activeChat.id._serialized || activeChat.id.id) : activeChat.id;
            await axiosInstance.post(`/handover/${action}`, {
                chatId,
                sessionId: selectedPlatform.sessionId,
                triggeredBy: 'manual',
            });
            setHandoverStatus(action === 'activate' ? 'human' : 'ai');
            // Update sidebar badge instantly
            setChatHandoverMap(prev => {
                const updated = { ...prev };
                if (action === 'activate') {
                    updated[chatId] = 'human';
                } else {
                    delete updated[chatId];
                }
                return updated;
            });
            toast.success(action === 'activate' ? '🙋 Chat dialihkan ke Anda' : '🤖 Chat dikembalikan ke AI');
        } catch (err) {
            toast.error('Gagal mengubah status handover');
        } finally {
            setIsHandoverLoading(false);
        }
    };

    // Fetch handover statuses for all chats in bulk
    const fetchBatchHandoverStatuses = async () => {
        if (!selectedPlatform?.sessionId) return;
        try {
            const res = await axiosInstance.get(`/handover/batch-status`, {
                params: { sessionId: selectedPlatform.sessionId }
            });
            setChatHandoverMap(res.data?.statuses || {});
        } catch (error) {
            console.error("Error fetching batch handover statuses:", error);
        }
    };

    const fetchChatMeta = async () => {
        if (!selectedPlatform) return;
        try {
            const res = await axiosInstance.get(`/chats/${selectedPlatform.id}/meta`);
            if (res.data?.success) {
                setIsBusiness(res.data.isBusiness);
                setLabels(res.data.labels || []);
            }
        } catch (error) {
            console.error("Error fetching chat meta (labels/isBusiness):", error);
        }
    };

    const fetchChats = async (showLoading = true) => {
        if (!selectedPlatform) return;
        if (showLoading) setIsFetchingChats(true);
        try {
            const res = await axiosInstance.get(`/chats/${selectedPlatform.id}`);
            if (res.data?.success) {
                setChats(res.data.data);
                // Fetch batch handover statuses for all chats
                fetchBatchHandoverStatuses();
            }
        } catch (error) {
            console.error("Error fetching chats:", error);
            toast.error(error.response?.data?.message || "Gagal memuat daftar pesan");
        } finally {
            if (showLoading) setIsFetchingChats(false);
        }
    };

    const fetchMessages = async (showLoading = true) => {
        if (!activeChat || !selectedPlatform) return;
        if (showLoading) setIsFetchingMessages(true);
        try {
            const safeChatId = typeof activeChat.id === 'object' ? (activeChat.id._serialized || activeChat.id.id) : activeChat.id;
            const res = await axiosInstance.get(`/chats/${selectedPlatform.id}/${safeChatId}/messages`, {
                params: { limit: 50 },
                timeout: 8000
            });
            if (res.data?.success) {
                const fetchedMsgs = Array.isArray(res.data.data) ? res.data.data : (Array.isArray(res.data.data?.docs) ? res.data.data.docs : []);
                
                // Fallback: If WAHA returns 0 history but sidebar knows a message exists, inject it!
                // We only do this if our current screen is completely empty to avoid overwriting live chat.
                if (fetchedMsgs.length === 0 && activeChat?.lastMessage && messages.length === 0) {
                    setMessages([{
                        id: `fallback-${Date.now()}`,
                        fromMe: false,
                        body: activeChat.lastMessage?.body || activeChat.lastMessage?.text || activeChat.lastMessage?.message?.conversation || "(Pesan tidak dapat dimuat penuh)",
                        timestamp: activeChat.timestamp || Math.floor(Date.now() / 1000),
                        type: "text",
                        status: "received"
                    }]);
                } else if (fetchedMsgs.length > 0) {
                    setMessages([...fetchedMsgs].reverse()); // Asumsi WAHA return newest first, kita butuh oldest first untuk UI chat
                } else {
                    // Benar-benar chat baru yang kosong
                    if (messages.length === 0) setMessages([]);
                }
            }
        } catch (error) {
            console.error("Error fetching messages:", error);
            const isTimeout = error.code === 'ECONNABORTED' || error.message?.toLowerCase().includes('timeout');
            
            // Fallback: If engine crashes on this chat (e.g. @lid) but sidebar has a message, inject it!
            if (messages.length === 0 && activeChat?.lastMessage) {
                setMessages([{
                    id: `fallback-err-${Date.now()}`,
                    fromMe: false,
                    body: activeChat.lastMessage?.body || activeChat.lastMessage?.text || activeChat.lastMessage?.message?.conversation || "(Pesan history diblokir oleh Meta)",
                    timestamp: activeChat.timestamp || Math.floor(Date.now() / 1000),
                    type: "text",
                    status: "received"
                }]);
            } else if (!isTimeout && showLoading) {
                toast.error(error.response?.data?.message || "Gagal memuat isi pesan");
            }
        } finally {
            if (showLoading) setIsFetchingMessages(false);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputText.trim() || !activeChat || !selectedPlatform || isSending) return;

        const textToSend = inputText;
        setInputText(""); // optimis clear input

        // Optimistic UI update (add temporary message)
        const tempMsg = {
            id: "temp-" + Date.now(),
            fromMe: true,
            body: textToSend,
            timestamp: Math.floor(Date.now() / 1000),
            status: "PENDING"
        };
        setMessages(prev => [...prev, tempMsg]);

        setIsSending(true);
        try {
            const safeChatId = typeof activeChat.id === 'object' ? (activeChat.id._serialized || activeChat.id.id) : activeChat.id;
            const res = await axiosInstance.post(`/chats/${selectedPlatform.id}/${safeChatId}/messages`, {
                text: textToSend
            });
            if (res.data?.success) {
                // Refresh messages after sending silently
                fetchMessages(false);
            }
        } catch (error) {
            console.error("Error sending message:", error);
            toast.error(error.response?.data?.message || "Gagal mengirim pesan");
            // Remove optimistic message on fail
            setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
            setInputText(textToSend); // restore input
        } finally {
            setIsSending(false);
        }
    };

    const handleToggleLabel = async (labelId, action) => {
        if (!activeChat || !selectedPlatform) return;
        setIsUpdatingLabel(true);
        try {
            const safeChatId = typeof activeChat.id === 'object' ? (activeChat.id._serialized || activeChat.id.id) : activeChat.id;
            const res = await axiosInstance.post(`/chats/${selectedPlatform.id}/${encodeURIComponent(safeChatId)}/labels`, {
                labelId: labelId,
                action: action // "add" or "remove"
            });
            if (res.data?.success) {
                toast.success(res.data.message);
                // Optimistic UI update on the activeChat & chats array
                const updatedChats = chats.map(c => {
                    const cId = typeof c.id === 'object' ? (c.id._serialized || c.id.id) : c.id;
                    if (cId === safeChatId) {
                        let currentLabels = Array.isArray(c.labels) ? [...c.labels] : [];
                        if (action === "add") {
                            const lbl = labels.find(l => l.id === labelId);
                            if (lbl && !currentLabels.some(l => l.id === labelId)) currentLabels.push(lbl);
                        } else {
                            currentLabels = currentLabels.filter(l => l.id !== labelId);
                        }
                        return { ...c, labels: currentLabels };
                    }
                    return c;
                });
                setChats(updatedChats);
                setActiveChat(updatedChats.find(c => {
                    const cId = typeof c.id === 'object' ? (c.id._serialized || c.id.id) : c.id;
                    return cId === safeChatId;
                }));
            }
        } catch (error) {
            console.error("Error updating label:", error);
            toast.error(error.response?.data?.message || "Gagal memperbarui label");
        } finally {
            setIsUpdatingLabel(false);
        }
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return "";
        try {
            let date;
            if (typeof timestamp === 'string' && timestamp.includes('T')) {
                date = new Date(timestamp);
            } else {
                const numTs = Number(timestamp);
                date = new Date(numTs > 9999999999 ? numTs : numTs * 1000);
            }
            if (isNaN(date.getTime())) return "";
            return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return "";
        }
    };

    const formatDateLabel = (timestamp) => {
        if (!timestamp) return "";
        try {
            let date;
            if (typeof timestamp === 'string' && timestamp.includes('T')) {
                date = new Date(timestamp);
            } else {
                const numTs = Number(timestamp);
                date = new Date(numTs > 9999999999 ? numTs : numTs * 1000);
            }
            if (isNaN(date.getTime())) return "";
            return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
        } catch (e) {
            return "";
        }
    };

    const formatSidebarTime = (timestamp) => {
        if (!timestamp) return "";
        try {
            let date;
            if (typeof timestamp === 'string' && timestamp.includes('T')) {
                date = new Date(timestamp);
            } else {
                const numTs = Number(timestamp);
                date = new Date(numTs > 9999999999 ? numTs : numTs * 1000);
            }
            if (isNaN(date.getTime())) return "";

            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            
            const diffTime = today - targetDate;
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 0) {
                return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(':', '.');
            } else if (diffDays === 1) {
                return "Kemarin";
            } else if (diffDays > 1 && diffDays < 7) {
                return date.toLocaleDateString('id-ID', { weekday: 'long' });
            } else {
                return date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
            }
        } catch (e) {
            return "";
        }
    };

    // Toggle Dropdown State
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const wahaChats = React.useMemo(() => {
        let list = chats || [];

        // --- DEBUG LOGS MULAI ---
        if (list.length > 0 && isBusiness) {
            console.log("DEBUG: list[0] labels prop:", list[0].labels);
            console.log("DEBUG: master labels[0]:", labels[0]);
        }
        // --- DEBUG LOGS SELESAI ---

        // Map labels from WAHA API (Syncing WAHA label.items into chat objects)
        if (isBusiness && labels.length > 0 && list.length > 0) {
            list = list.map(chat => {
                const safeChatId = typeof chat.id === 'object' ? (chat.id._serialized || chat.id.id) : chat.id;
                const computedLabels = [];
                labels.forEach(lbl => {
                    const hasItem = lbl.items && Array.isArray(lbl.items) && lbl.items.some(item => {
                        const iId = typeof item.id === 'object' ? (item.id._serialized || item.id.id) : item.id;
                        return iId === safeChatId;
                    });

                    const hasLegacyId = chat.labels && Array.isArray(chat.labels) && chat.labels.some(cl => String(cl) === String(lbl.id) || String(cl?.id) === String(lbl.id));

                    if (hasItem || hasLegacyId) {
                        computedLabels.push({ ...lbl });
                    }
                });
                return { ...chat, labels: computedLabels };
            });
        }

        // Apply Search Filter
        if (searchKeyword.trim() !== "") {
            const keyword = searchKeyword.toLowerCase();
            list = list.filter(chat => {
                const chatName = (chat.name || String(typeof chat.id === 'object' ? (chat.id._serialized || chat.id.id) : chat.id).split('@')[0]).toLowerCase();
                const lastMsg = (chat.lastMessage?.body || chat.lastMessage?.text || chat.lastMessage?.message?.conversation || chat.lastMessage?.message?.extendedTextMessage?.text || "").toLowerCase();
                return chatName.includes(keyword) || lastMsg.includes(keyword);
            });
        }

        // Apply Label Filter
        if (isBusiness && selectedLabel !== "ALL") {
            if (selectedLabel === "NONE") {
                list = list.filter(chat => !chat.labels || chat.labels.length === 0);
            } else {
                list = list.filter(chat => chat.labels && chat.labels.some(l => l.id === selectedLabel));
            }
        }

        return list;
    }, [chats, labels, isBusiness, searchKeyword, selectedLabel]);

    const currentActiveChat = React.useMemo(() => {
        if (!activeChat) return null;
        const safeActiveId = typeof activeChat.id === 'object' ? (activeChat.id._serialized || activeChat.id.id) : activeChat.id;
        return wahaChats.find(c => {
            const cId = typeof c.id === 'object' ? (c.id._serialized || c.id.id) : c.id;
            return cId === safeActiveId;
        }) || activeChat;
    }, [wahaChats, activeChat]);

    return (
        <div className={`w-full flex flex-col md:flex-row bg-[var(--color-surface)] overflow-hidden animate-fade-in ${isImpersonating ? 'h-[calc(100vh-104px)]' : 'h-[calc(100vh-64px)]'}`}>

            {/* Sidebar - Chat List */}
            <div className="w-full md:w-1/3 lg:w-1/4 border-r border-[var(--color-border)] flex flex-col bg-[var(--color-bg)]">
                {/* Header Chat List */}
                <div className="p-4 border-b border-[var(--color-border)] flex flex-col gap-3 bg-[var(--color-surface)] relative">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-lg font-bold text-[var(--color-text)] leading-tight">Live Chat</h2>
                            {selectedPlatform && (
                                <p className="text-xs text-[var(--color-text-muted)] truncate max-w-[150px]">
                                    {selectedPlatform.name}
                                </p>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <button onClick={fetchChats} disabled={isFetchingChats || !selectedPlatform} className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors p-2" title="Refresh">
                                <FaSync className={isFetchingChats ? "animate-spin" : ""} />
                            </button>
                            <div className="relative">
                                <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] p-2">
                                    <FaEllipsisV />
                                </button>

                                {/* Ellipsis Dropdown for Platform Selection */}
                                {isDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-56 bg-[var(--color-surface)] rounded-xl shadow-lg border border-[var(--color-border)] z-50 p-2">
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
                                                            setActiveChat(null);
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
                </div>

                {/* Search Bar */}
                <div className="p-3 border-b border-[var(--color-border)]">
                    <div className="relative">
                        <FaSearch className="absolute left-3 top-3 text-[var(--color-text-muted)]" />
                        <input
                            type="text"
                            placeholder="Cari pesan atau kontak..."
                            value={searchKeyword}
                            onChange={(e) => setSearchKeyword(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:border-[var(--color-primary)] text-[var(--color-text)]"
                        />
                    </div>
                    {/* Add Label Filter if isBusiness is true */}
                    {isBusiness && labels.length > 0 && (
                        <div className="mt-2">
                            <select
                                className="select select-sm select-bordered w-full bg-[var(--color-bg)]"
                                value={selectedLabel}
                                onChange={(e) => setSelectedLabel(e.target.value)}
                                disabled={isFetchingChats}
                            >
                                <option value="ALL">Semua Label</option>
                                <option value="NONE">Tanpa Label</option>
                                {labels.map(lbl => (
                                    <option key={lbl.id} value={lbl.id}>{lbl.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {/* List of Chats */}
                <div className="flex-1 overflow-y-auto">
                    {platformsLoading || isFetchingChats ? (
                        <div className="flex justify-center items-center h-full text-[var(--color-text-muted)] p-4">
                            <span className="loading loading-spinner text-[var(--color-primary)]"></span>
                        </div>
                    ) : !selectedPlatform ? (
                        <div className="text-center p-8 text-[var(--color-text-muted)] text-sm">
                            Silakan pilih koneksi WhatsApp yang aktif di atas.
                        </div>
                    ) : wahaChats.length === 0 ? (
                        <div className="text-center p-8 text-[var(--color-text-muted)] text-sm">
                            Belum ada percakapan.
                        </div>
                    ) : (
                        wahaChats.map((chat) => (
                            <div
                                key={typeof chat.id === 'object' ? chat.id._serialized : chat.id}
                                onClick={() => setActiveChat(chat)}
                                className={`flex items-start gap-3 p-4 cursor-pointer transition-colors border-b border-[var(--color-border)]/50 ${activeChat?.id === chat.id ? 'bg-[var(--color-primary)]/10' : 'hover:bg-[var(--color-surface)]'}`}
                            >
                                <div className="relative mt-1">
                                    <FaUserCircle className="text-4xl text-gray-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h3 className="font-bold text-[var(--color-text)] text-sm truncate">{chat.name || String(typeof chat.id === 'object' ? (chat.id._serialized || chat.id.id) : chat.id).split('@')[0]}</h3>
                                        <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
                                            {(() => {
                                                const chatIdStr = typeof chat.id === 'object' ? (chat.id._serialized || chat.id.user) : String(chat.id);
                                                const cleanId = chatIdStr.split('@')[0];
                                                const isHuman = chatHandoverMap[chatIdStr] === 'human' || chatHandoverMap[cleanId] === 'human';
                                                return (
                                                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold whitespace-nowrap ${isHuman ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                                                        {isHuman ? '👤 Human' : '🤖 AI'}
                                                    </span>
                                                );
                                            })()}
                                            <span className="text-xs text-[var(--color-text-muted)]">{formatSidebarTime(chat.timestamp)}</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center mb-1">
                                        <p className="text-xs text-[var(--color-text-muted)] truncate pr-2">
                                            {chat.lastMessage?.body || chat.lastMessage?.text || chat.lastMessage?.message?.conversation || chat.lastMessage?.message?.extendedTextMessage?.text || "(Pesan)"}
                                        </p>
                                        {chat.unreadCount > 0 && (
                                            <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                                                {chat.unreadCount}
                                            </span>
                                        )}
                                    </div>
                                    {/* Render Badge Label jika isBusiness dan punya label */}
                                    {isBusiness && Array.isArray(chat.labels) && chat.labels.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {chat.labels.map((lbl, i) => (
                                                <span
                                                    key={i}
                                                    className="px-1.5 py-0.5 rounded text-[9px] font-medium border whitespace-nowrap"
                                                    style={{
                                                        backgroundColor: lbl.color ? `${lbl.color}20` : 'var(--color-bg)',
                                                        color: lbl.color || 'var(--color-text-muted)',
                                                        borderColor: lbl.color ? `${lbl.color}50` : 'var(--color-border)'
                                                    }}
                                                >
                                                    {lbl.name}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="w-full md:w-2/3 lg:w-1/2 flex flex-col bg-[var(--color-bg)] relative border-r border-[var(--color-border)]">
                {currentActiveChat ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 bg-[var(--color-surface)] border-b border-[var(--color-border)] flex items-center justify-between z-50 shadow-sm relative">
                            <div className="flex items-center gap-3 w-3/4">
                                <FaUserCircle className="text-4xl text-gray-400 flex-shrink-0" />
                                <div className="min-w-0">
                                    <h2 className="font-bold text-[var(--color-text)] truncate">{currentActiveChat.name || String(typeof currentActiveChat.id === 'object' ? (currentActiveChat.id._serialized || currentActiveChat.id.id) : currentActiveChat.id).split('@')[0]}</h2>
                                    <p className="text-xs text-[var(--color-text-muted)] max-w-xs truncate">
                                        {String(typeof currentActiveChat.id === 'object' ? (currentActiveChat.id._serialized || currentActiveChat.id.id) : currentActiveChat.id).split('@')[0]}
                                    </p>

                                    {/* Small Label Badges under Header Name */}
                                    {isBusiness && Array.isArray(currentActiveChat.labels) && currentActiveChat.labels.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {currentActiveChat.labels.map((lbl, i) => (
                                                <span
                                                    key={i}
                                                    className="px-1.5 py-0.5 rounded text-[9px] font-medium border whitespace-nowrap"
                                                    style={{
                                                        backgroundColor: lbl.color ? `${lbl.color}20` : 'var(--color-bg)',
                                                        color: lbl.color || 'var(--color-text-muted)',
                                                        borderColor: lbl.color ? `${lbl.color}50` : 'var(--color-border)'
                                                    }}
                                                >
                                                    {lbl.name}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-2 items-center text-[var(--color-text-muted)] flex-shrink-0">
                                {/* Handover Button */}
                                {handoverStatus === 'human' ? (
                                    <button
                                        onClick={() => handleHandover('release')}
                                        disabled={isHandoverLoading}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-500 text-white hover:bg-green-600 transition-colors shadow-sm"
                                        title="Kembalikan ke AI Agent"
                                    >
                                        <FaRobot /> Release to AI
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleHandover('activate')}
                                        disabled={isHandoverLoading}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-orange-500 text-white hover:bg-orange-600 transition-colors shadow-sm"
                                        title="Ambil alih chat dari AI"
                                    >
                                        <FaHandPaper /> Take Over
                                    </button>
                                )}
                                {/* Status Badge */}
                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${handoverStatus === 'human' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'}`}>
                                    {handoverStatus === 'human' ? '👤 Human' : '🤖 AI'}
                                </span>
                                <button onClick={fetchMessages} disabled={isFetchingMessages} className="hover:text-[var(--color-primary)] transition-colors"><FaSync className={isFetchingMessages ? "animate-spin" : ""} /></button>
                                <button className="hover:text-[var(--color-text)]"><FaSearch /></button>
                                <div className="relative">
                                    <button onClick={() => setIsLabelModalOpen(!isLabelModalOpen)} className="hover:text-[var(--color-text)]"><FaEllipsisV /></button>

                                    {/* Ellipsis/Menu for Active Chat */}
                                    {isLabelModalOpen && (
                                        <div className="absolute right-0 mt-2 w-64 bg-[var(--color-surface)] rounded-xl shadow-lg border border-[var(--color-border)] z-50 p-3">
                                            {isBusiness ? (
                                                <>
                                                    <div className="text-xs font-semibold text-[var(--color-text-muted)] mb-3 pb-2 border-b border-[var(--color-border)] uppercase tracking-wider">
                                                        Kelola Label Chat
                                                    </div>
                                                    {labels.length === 0 ? (
                                                        <div className="text-xs text-center p-2 text-[var(--color-text-muted)]">Belum ada label di WhatsApp Anda</div>
                                                    ) : (
                                                        <div className="max-h-56 overflow-y-auto space-y-2">
                                                            {labels.map(lbl => {
                                                                const hasLabel = Array.isArray(currentActiveChat?.labels) && currentActiveChat.labels.some(l => l.id === lbl.id);
                                                                return (
                                                                    <div key={lbl.id} className="flex items-center justify-between gap-2 p-1 hover:bg-[var(--color-bg)] rounded">
                                                                        <div className="flex items-center gap-2 overflow-hidden">
                                                                            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: lbl.color || '#ccc' }}></span>
                                                                            <span className="text-sm text-[var(--color-text)] truncate">{lbl.name}</span>
                                                                        </div>
                                                                        <button
                                                                            disabled={isUpdatingLabel}
                                                                            onClick={() => handleToggleLabel(lbl.id, hasLabel ? 'remove' : 'add')}
                                                                            className={`text-xs px-2 py-1 rounded border transition-colors ${hasLabel ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' : 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'} ${isUpdatingLabel ? 'opacity-50' : ''}`}
                                                                        >
                                                                            {hasLabel ? 'Hapus' : 'Tambahkan'}
                                                                        </button>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <div className="text-xs text-center p-2 text-[var(--color-text-muted)]">Opsi tambahan belum tersedia</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Chat Messages */}
                        <div className="flex-1 overflow-y-auto px-4 pb-4 pt-1 space-y-3 relative bg-opacity-50">
                            {/* Fake WhatsApp Web Background Pattern */}
                            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: `url("https://web.whatsapp.com/img/bg-chat-tile-dark_a4be512e7195b6b733d9110b408f075d.png")`, backgroundRepeat: 'repeat' }}></div>

                            {isFetchingMessages ? (
                                <div className="flex justify-center p-4 relative z-10">
                                    <span className="loading loading-dots text-[var(--color-primary)]"></span>
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="flex justify-center p-4 relative z-10 text-[var(--color-text-muted)] text-sm">
                                    Kirim pesan untuk memulai percakapan
                                </div>
                            ) : (
                                (Array.isArray(messages) ? messages : []).map((msg, idx) => {
                                    if (!msg) return null;
                                    const isMe = msg.fromMe;
                                    const prevTimestamp = idx > 0 ? messages[idx - 1]?.timestamp : null;
                                    const showDate = idx === 0 || formatDateLabel(msg.timestamp) !== formatDateLabel(prevTimestamp);

                                    // AMAN: hindari error "Objects are not valid as React child" 
                                    const msgId = typeof msg.id === 'object' ? (msg.id?._serialized || msg.id?.id || `msg-${idx}`) : (msg.id || `msg-${idx}`);

                                    let safeBody = msg.body || msg.text || msg._data?.body || "";

                                    // Fallback for NOWEB engine
                                    if (!safeBody && msg.message) {
                                        safeBody = msg.message.conversation || msg.message.extendedTextMessage?.text || msg.message.imageMessage?.caption || "";
                                    }

                                    if (typeof safeBody === 'object' && safeBody !== null) {
                                        safeBody = "(Pesan Format Khusus)";
                                    } else if (safeBody !== null && safeBody !== undefined && typeof safeBody !== 'string') {
                                        safeBody = String(safeBody);
                                    }

                                    // Gunakan msg.type (yg mana adalah getter di bbrp waha engine) apabila body benar-benar kosong
                                    if (!safeBody || safeBody.trim() === "") {
                                        if (msg.type === "revoked" || msg.type === "protocol") safeBody = "🚫 Pesan ini telah dihapus";
                                        else if (msg.type === "image") safeBody = "📷 Gambar";
                                        else if (msg.type === "video") safeBody = "🎥 Video";
                                        else if (msg.type === "audio" || msg.type === "ptt") safeBody = "🎵 Pesan Suara";
                                        else if (msg.type === "document") safeBody = "📄 Dokumen";
                                        else if (msg.type === "location") safeBody = "📍 Lokasi";
                                        else if (msg.type === "vcard" || msg.type === "multi_vcard") safeBody = "👤 Kontak";
                                        else if (msg.type === "sticker") safeBody = "🌟 Stiker";
                                        else if (msg.type === "call_log") safeBody = "📞 Panggilan Suara/Video";
                                        else if (msg.hasMedia) safeBody = "📎 Lampiran Media";
                                        else if (msg.type) safeBody = `(Pesan: ${msg.type})`;
                                        else safeBody = `(Tidak ada teks pesan)`;
                                    }

                                    return (
                                        <React.Fragment key={msgId}>
                                            {showDate && (
                                                <div className="flex justify-center mb-6 relative z-10">
                                                    <span className="bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] text-xs py-1 px-3 rounded-lg shadow-sm">
                                                        {formatDateLabel(msg.timestamp)}
                                                    </span>
                                                </div>
                                            )}

                                            <div className={`flex relative z-10 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[92%] md:max-w-[85%] lg:max-w-[80%] rounded-lg p-3 shadow-sm relative ${isMe ? 'bg-[#d9fdd3] dark:bg-[#005c4b] text-[#111b21] dark:text-[#e9edef] rounded-tr-none' : 'bg-white dark:bg-[#202c33] text-[#111b21] dark:text-[#e9edef] rounded-tl-none'}`}>

                                                    {msg.type === 'image' && safeBody && (safeBody.startsWith('http') || safeBody.startsWith('/api/')) ? (
                                                        <div>
                                                            <img
                                                                src={safeBody}
                                                                alt="📷 Gambar"
                                                                className="rounded-lg max-w-[250px] max-h-[300px] object-cover cursor-pointer"
                                                                onClick={() => window.open(safeBody, '_blank')}
                                                                onError={(e) => { e.target.onerror = null; e.target.parentElement.innerHTML = '<p class="text-sm">📷 Gambar (gagal memuat)</p>'; }}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm whitespace-pre-wrap">{safeBody || (msg.hasMedia && "(Pilih Media)") || ""}</p>
                                                    )}

                                                    <div className="flex justify-end items-center gap-1 mt-1">
                                                        <span className="text-[10px] opacity-70">{formatTime(msg.timestamp)}</span>
                                                        {isMe && (
                                                            msg.status === "PENDING" ? <FaSync className="text-[8px] animate-spin opacity-50" /> :
                                                                <FaCheckDouble className={`text-[10px] ${msg.ack >= 3 ? "text-blue-500" : "opacity-60"}`} />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </React.Fragment>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Chat Input */}
                        {handoverStatus === 'human' ? (
                            <form onSubmit={handleSendMessage} className="p-3 bg-[var(--color-surface)] border-t border-[var(--color-border)] flex items-center gap-3 z-10">
                                <button type="button" className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] p-2">
                                    <FaSmile className="text-xl" />
                                </button>
                                <div className="flex-1 bg-[var(--color-bg)] rounded-xl border border-[var(--color-border)] flex items-center px-4 py-2 focus-within:border-[var(--color-primary)]">
                                    <input
                                        type="text"
                                        value={inputText}
                                        onChange={(e) => setInputText(e.target.value)}
                                        placeholder="Ketik pesan..."
                                        className="w-full bg-transparent border-none focus:outline-none text-sm text-[var(--color-text)]"
                                        disabled={isSending || isFetchingMessages}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={!inputText.trim() || isSending}
                                    className={`p-3 rounded-full transition-colors shadow-md ${!inputText.trim() ? 'bg-gray-300 dark:bg-gray-700 text-gray-500' : 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]'}`}
                                >
                                    {isSending ? <FaSync className="animate-spin" /> : <FaPaperPlane className="pl-1" />}
                                </button>
                            </form>
                        ) : (
                            <div className="p-4 bg-[var(--color-surface)] border-t border-[var(--color-border)] z-10">
                                <div className="flex flex-col items-center gap-2">
                                    <p className="text-xs text-[var(--color-text-muted)]">
                                        🤖 Chat ini sedang ditangani oleh AI Agent
                                    </p>
                                    <button
                                        onClick={() => handleHandover('activate')}
                                        disabled={isHandoverLoading}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold bg-orange-500 text-white hover:bg-orange-600 transition-colors shadow-md disabled:opacity-50"
                                    >
                                        {isHandoverLoading ? (
                                            <FaSync className="animate-spin" />
                                        ) : (
                                            <>
                                                <FaHandPaper /> Beralih ke Human Agent
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    /* Empty State */
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-[var(--color-bg)] relative z-10">
                        <div className="w-48 h-48 mb-6 opacity-20 dark:opacity-10 rounded-full bg-[var(--color-primary)]/20 flex flex-col justify-center items-center">
                            <FaWhatsapp className="text-7xl text-[var(--color-primary)] opacity-50" />
                        </div>
                        <h2 className="text-2xl font-light text-[var(--color-text)] mb-2">Vlow.ai Web Chat</h2>
                        <p className="text-[var(--color-text-muted)] text-sm max-w-sm">
                            Pilih percakapan dari daftar di sebelah kiri untuk melihat detail pesan WhatsApp.
                        </p>
                        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-[var(--color-text-muted)]">
                            <FaCheckDouble /> Terhubung dengan WhatsApp secara End-to-End
                        </div>
                    </div>
                )}
            </div>

            {/* Overview Panel (Right Side) */}
            <div className="hidden lg:flex w-full lg:w-1/4 flex-col bg-[var(--color-surface)] overflow-y-auto">
                <div className="p-4 border-b border-[var(--color-border)] flex justify-between items-center sticky top-0 bg-[var(--color-surface)] z-10">
                    <h2 className="text-lg font-bold text-[var(--color-text)] flex items-center gap-2">
                        Overview <FaChevronDown className="text-xs text-[var(--color-text-muted)]" />
                    </h2>
                </div>
                
                {currentActiveChat ? (
                    <div className="p-4 flex flex-col gap-6">
                        {/* User Profile Section */}
                        <div className="flex flex-col">
                            <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-4">User Information</h3>
                            <div className="flex items-center gap-3 mb-5">
                                <FaUserCircle className="text-5xl text-gray-400 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                    <h4 className="font-bold text-base text-[var(--color-text)] truncate">
                                        {currentActiveChat.name || String(typeof currentActiveChat.id === 'object' ? (currentActiveChat.id._serialized || currentActiveChat.id.id) : currentActiveChat.id).split('@')[0]}
                                    </h4>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 text-sm">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
                                        <FaPhoneAlt className="text-xs" /> <span>Phone</span>
                                    </div>
                                    <span className="font-medium text-[var(--color-text)]">
                                        {String(typeof currentActiveChat.id === 'object' ? (currentActiveChat.id._serialized || currentActiveChat.id.id) : currentActiveChat.id).split('@')[0]}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
                                        <FaUserTie className="text-xs" /> <span>Visitor Type</span>
                                    </div>
                                    <span className="font-medium text-[var(--color-text)]">New Lead</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
                                        <FaMapMarkerAlt className="text-xs" /> <span>Location</span>
                                    </div>
                                    <span className="font-medium text-[var(--color-text)]">
                                        {getCountryFromPhone(
                                            currentActiveChat.name && currentActiveChat.name.startsWith('+') 
                                                ? currentActiveChat.name 
                                                : String(typeof currentActiveChat.id === 'object' ? (currentActiveChat.id._serialized || currentActiveChat.id.id) : currentActiveChat.id)
                                        )}
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="text-[var(--color-primary)] text-sm font-semibold cursor-pointer hover:underline mt-2">
                            See All
                        </div>

                        <div className="border-t border-[var(--color-border)] pt-5">
                            <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Email</h3>
                            <div className="flex items-center gap-2">
                                <FaEnvelope className="text-blue-500 text-sm" />
                                <span className="text-sm font-medium text-blue-500 hover:underline cursor-pointer">
                                    contact@customer.com
                                </span>
                            </div>
                        </div>

                        <div className="border-t border-[var(--color-border)] pt-5">
                            <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">User Ticket</h3>
                            <button className="flex items-center gap-2 text-sm text-[var(--color-primary)] font-semibold hover:bg-[var(--color-primary)]/10 px-2 py-1.5 rounded transition-colors -ml-2">
                                <FaPlus /> Create Ticket
                            </button>
                        </div>

                        <div className="border-t border-[var(--color-border)] pt-5">
                            <div className="flex justify-between items-center cursor-pointer">
                                <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Tags</h3>
                                <FaChevronDown className="text-xs text-[var(--color-text-muted)]" />
                            </div>
                            {isBusiness && Array.isArray(currentActiveChat.labels) && currentActiveChat.labels.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {currentActiveChat.labels.map((lbl, i) => (
                                        <span
                                            key={i}
                                            className="px-2 py-1 rounded text-xs font-medium border"
                                            style={{
                                                backgroundColor: lbl.color ? `${lbl.color}20` : 'var(--color-bg)',
                                                color: lbl.color || 'var(--color-text-muted)',
                                                borderColor: lbl.color ? `${lbl.color}50` : 'var(--color-border)'
                                            }}
                                        >
                                            {lbl.name}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-[var(--color-text-muted)] text-sm p-4 text-center">
                        Pilih chat untuk melihat rincian pelanggan.
                    </div>
                )}
            </div>

        </div>
    );
};

export default ChatDashboard;
