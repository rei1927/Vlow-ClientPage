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
    FaSync
} from "react-icons/fa";
import { getPlatforms } from "../../features/platforms/platformSlice";
import axiosInstance from "../../api/axiosInstance";
import toast from "react-hot-toast";

const ChatDashboard = () => {
    const dispatch = useDispatch();
    const { platforms, isLoading: platformsLoading } = useSelector((state) => state.platforms);

    const [selectedPlatform, setSelectedPlatform] = useState(null);
    const [chats, setChats] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState("");

    const [isFetchingChats, setIsFetchingChats] = useState(false);
    const [isFetchingMessages, setIsFetchingMessages] = useState(false);
    const [isSending, setIsSending] = useState(false);

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
            fetchChats();
        }
    }, [selectedPlatform]);

    // Fetch messages when activeChat changes
    useEffect(() => {
        if (activeChat && selectedPlatform) {
            fetchMessages();
        }
    }, [activeChat, selectedPlatform]);

    // Scroll to bottom when messages update
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const fetchChats = async () => {
        if (!selectedPlatform) return;
        setIsFetchingChats(true);
        try {
            const res = await axiosInstance.get(`/chats/${selectedPlatform.id}`);
            if (res.data?.success) {
                setChats(res.data.data);
            }
        } catch (error) {
            console.error("Error fetching chats:", error);
            toast.error(error.response?.data?.message || "Gagal memuat daftar pesan");
        } finally {
            setIsFetchingChats(false);
        }
    };

    const fetchMessages = async () => {
        if (!activeChat || !selectedPlatform) return;
        setIsFetchingMessages(true);
        try {
            const res = await axiosInstance.get(`/chats/${selectedPlatform.id}/${activeChat.id}/messages`, {
                params: { limit: 50 }
            });
            if (res.data?.success) {
                setMessages(res.data.data.reverse()); // Asumsi WAHA return newest first, kita butuh oldest first untuk UI chat
            }
        } catch (error) {
            console.error("Error fetching messages:", error);
            toast.error("Gagal memuat isi pesan");
        } finally {
            setIsFetchingMessages(false);
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
            const res = await axiosInstance.post(`/chats/${selectedPlatform.id}/${activeChat.id}/messages`, {
                text: textToSend
            });
            if (res.data?.success) {
                // Refresh messages after sending
                fetchMessages();
            }
        } catch (error) {
            console.error("Error sending message:", error);
            toast.error("Gagal mengirim pesan");
            // Remove optimistic message on fail
            setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
            setInputText(textToSend); // restore input
        } finally {
            setIsSending(false);
        }
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return "";
        const date = new Date(timestamp * 1000);
        return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDateLabel = (timestamp) => {
        if (!timestamp) return "";
        const date = new Date(timestamp * 1000);
        return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const wahaChats = chats || [];

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col md:flex-row bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] overflow-hidden shadow-sm animate-fade-in">

            {/* Sidebar - Chat List */}
            <div className="w-full md:w-1/3 border-r border-[var(--color-border)] flex flex-col bg-[var(--color-bg)]">
                {/* Header Chat List */}
                <div className="p-4 border-b border-[var(--color-border)] flex flex-col gap-3 bg-[var(--color-surface)]">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-bold text-[var(--color-text)]">Live Chat</h2>
                        <div className="flex gap-2">
                            <button onClick={fetchChats} disabled={isFetchingChats || !selectedPlatform} className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors" title="Refresh">
                                <FaSync className={isFetchingChats ? "animate-spin" : ""} />
                            </button>
                            <button className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
                                <FaEllipsisV />
                            </button>
                        </div>
                    </div>

                    {/* Platform Selector */}
                    <select
                        className="select select-sm select-bordered w-full bg-[var(--color-bg)]"
                        value={selectedPlatform?.id || ""}
                        onChange={(e) => {
                            const pf = platforms.find(p => p.id === e.target.value);
                            setSelectedPlatform(pf);
                            setActiveChat(null);
                        }}
                        disabled={platformsLoading}
                    >
                        <option value="" disabled>Pilih Koneksi WhatsApp</option>
                        {platforms.map(pf => (
                            <option key={pf.id} value={pf.id} disabled={pf.status !== "WORKING"}>
                                {pf.name} {pf.status !== "WORKING" ? "(Disconnect)" : ""}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Search Bar */}
                <div className="p-3 border-b border-[var(--color-border)]">
                    <div className="relative">
                        <FaSearch className="absolute left-3 top-3 text-[var(--color-text-muted)]" />
                        <input
                            type="text"
                            placeholder="Cari pesan atau kontak..."
                            className="w-full pl-10 pr-4 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:border-[var(--color-primary)] text-[var(--color-text)]"
                        />
                    </div>
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
                                key={chat.id}
                                onClick={() => setActiveChat(chat)}
                                className={`flex items-center gap-3 p-4 cursor-pointer transition-colors border-b border-[var(--color-border)]/50 ${activeChat?.id === chat.id ? 'bg-[var(--color-primary)]/10' : 'hover:bg-[var(--color-surface)]'}`}
                            >
                                <div className="relative">
                                    <FaUserCircle className="text-4xl text-gray-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h3 className="font-bold text-[var(--color-text)] text-sm truncate">{chat.name || chat.id.split('@')[0]}</h3>
                                        <span className="text-xs text-[var(--color-text-muted)]">{formatTime(chat.timestamp)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <p className="text-xs text-[var(--color-text-muted)] truncate pr-2">
                                            {/* WAHA API detail might need extraction, usually chat.lastMessage exists */}
                                            {chat.lastMessage?.body || "(Pesan Tidak Didukung)"}
                                        </p>
                                        {chat.unreadCount > 0 && (
                                            <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                                                {chat.unreadCount}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="w-full md:w-2/3 flex flex-col bg-[#EFEAE2] dark:bg-[#0b141a] relative">
                {activeChat ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 bg-[var(--color-surface)] border-b border-[var(--color-border)] flex items-center justify-between z-10 shadow-sm">
                            <div className="flex items-center gap-3">
                                <FaUserCircle className="text-4xl text-gray-400" />
                                <div>
                                    <h2 className="font-bold text-[var(--color-text)]">{activeChat.name || activeChat.id.split('@')[0]}</h2>
                                    <p className="text-xs text-[var(--color-text-muted)] max-w-xs truncate">
                                        {activeChat.id}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-4 text-[var(--color-text-muted)]">
                                <button onClick={fetchMessages} disabled={isFetchingMessages} className="hover:text-[var(--color-primary)] transition-colors"><FaSync className={isFetchingMessages ? "animate-spin" : ""} /></button>
                                <button className="hover:text-[var(--color-text)]"><FaSearch /></button>
                                <button className="hover:text-[var(--color-text)]"><FaEllipsisV /></button>
                            </div>
                        </div>

                        {/* Chat Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 relative bg-opacity-50">
                            {/* Fake WhatsApp Web Background Pattern */}
                            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: "url('https://web.whatsapp.com/img/bg-chat-tile-dark_a4be512e7195b6b733d9110b408f075d.png')", backgroundRepeat: 'repeat' }}></div>

                            {isFetchingMessages ? (
                                <div className="flex justify-center p-4 relative z-10">
                                    <span className="loading loading-dots text-[var(--color-primary)]"></span>
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="flex justify-center p-4 relative z-10 text-[var(--color-text-muted)] text-sm">
                                    Kirim pesan untuk memulai percakapan
                                </div>
                            ) : (
                                messages.map((msg, idx) => {
                                    const isMe = msg.fromMe;
                                    const showDate = idx === 0 || formatDateLabel(msg.timestamp) !== formatDateLabel(messages[idx - 1].timestamp);

                                    return (
                                        <React.Fragment key={msg.id || idx}>
                                            {showDate && (
                                                <div className="flex justify-center mb-6 relative z-10">
                                                    <span className="bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] text-xs py-1 px-3 rounded-lg shadow-sm">
                                                        {formatDateLabel(msg.timestamp)}
                                                    </span>
                                                </div>
                                            )}

                                            <div className={`flex relative z-10 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[85%] md:max-w-[75%] rounded-lg p-3 shadow-sm relative ${isMe ? 'bg-[#d9fdd3] dark:bg-[#005c4b] text-[#111b21] dark:text-[#e9edef] rounded-tr-none' : 'bg-white dark:bg-[#202c33] text-[#111b21] dark:text-[#e9edef] rounded-tl-none'}`}>

                                                    <p className="text-sm whitespace-pre-wrap">{msg.body || (msg.hasMedia && "(Ada Media)")}</p>

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

        </div>
    );
};

export default ChatDashboard;
