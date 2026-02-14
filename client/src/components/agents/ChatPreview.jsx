import { useState, useRef, useEffect } from "react";
import { FaPaperPlane, FaRobot, FaEraser } from "react-icons/fa";
import { toast } from "react-hot-toast";
import agentService from "../../features/agents/agentService";

const ChatPreview = ({
  agentName,
  systemInstruction,
  knowledgeBase,
  handoffConfig,
  welcomeMessage,
  welcomeImageUrl,
  isActive,
  followupConfig,
}) => {
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState(`sess-${Date.now()}`);
  const [hasWelcomed, setHasWelcomed] = useState(false);

  const scrollRef = useRef(null);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "sys-init",
          sender: "system", // Tipe baru khusus info sistem (bukan error)
          text: "Test AI Agent kamu di chat ini.",
        },
      ]);
    }
  }, []);

  // 2. Auto Scroll (Hanya scroll container chat, bukan window)
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [messages, isTyping]);

  // 3. Handle Reset
  const handleReset = (e) => {
    if (e) e.preventDefault();
    setMessages([
      {
        id: `sys-${Date.now()}`,
        sender: "system",
        text: "Memori di reset. Test AI Agent kamu di chat ini.",
      },
    ]);
    setSessionId(`sess-${Date.now()}`);
    setHasWelcomed(false);
  };

  // 4. Handle Send
  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;

    if (!isActive) {
      toast.error("Agent belum aktif. Aktifkan dulu untuk mencoba.");
      return;
    }

    if (!systemInstruction || systemInstruction.trim().length < 5) {
      toast.error("Mohon isi 'Instruksi / Prompt' terlebih dahulu.");
      return;
    }

    const userText = inputMsg;
    setMessages((prev) => [...prev, { id: Date.now(), sender: "user", text: userText }]);
    setInputMsg("");
    setIsTyping(true);

    try {
      // API call ke testChatAgent
      const payload = {
        message: userText,
        sessionId: sessionId,
        systemInstruction: systemInstruction,
        name: agentName,
        knowledgeBase: knowledgeBase || "",
        transferCondition: handoffConfig,
        welcomeMessage: welcomeMessage || "",
        welcomeImageUrl: welcomeImageUrl || "",
        followupConfig: followupConfig || null,
      };

      const response = await agentService.testChat(payload);

      const rawOutput = response.output || "";
      const imgMatch = rawOutput.match(/WELCOME_IMAGE_URL:\s*(\S+)/i);
      const imageUrl = imgMatch?.[1]?.trim() || null;
      const cleanedText = rawOutput.replace(/WELCOME_IMAGE_URL:\s*\S+/i, "").trim();
      const resolvedImageUrl =
        imageUrl || (!hasWelcomed && welcomeImageUrl ? welcomeImageUrl : null);

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: "system",
          text: cleanedText || "",
          image: resolvedImageUrl || undefined,
        },
      ]);
      if (!hasWelcomed && (cleanedText || resolvedImageUrl)) {
        setHasWelcomed(true);
      }
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: "error", // Bedakan style error
          text: "Gagal terhubung ke AI Brain. Pastikan server n8n aktif.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-162.5 bg-[#EFE7DD] rounded-3xl shadow-xl overflow-hidden border border-gray-300 relative">
      {/* --- HEADER --- */}
      <div className="bg-[#075E54] px-4 py-3 flex items-center justify-between shadow-md z-20 text-white">
        <div className="flex items-center gap-3">
          <div className="avatar">
            <div className="w-10 h-10 rounded-full bg-white p-0.5">
              <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center text-gray-500 overflow-hidden">
                <FaRobot size={20} />
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-bold text-sm leading-tight">{agentName || "AI Assistant"}</h4>
            <div className="flex items-center gap-1 opacity-90">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
              <span className="text-[10px] font-medium tracking-wide">
                {isTyping ? "sedang mengetik..." : "Online • Preview"}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={handleReset}
          className="btn btn-ghost btn-circle btn-sm text-white/80 hover:bg-white/10 hover:text-white tooltip tooltip-left"
          data-tip="Reset Percakapan"
          type="button"
        >
          <FaEraser />
        </button>
      </div>

      {/* --- CHAT BACKGROUND & AREA --- */}
      {/* Background Pattern WhatsApp-like */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none z-0"
        style={{
          backgroundImage:
            "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')",
        }}
      ></div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar z-10 relative">
        {/* Date/System Info */}
        <div className="flex justify-center mb-4">
          <span className="bg-blue-100 text-blue-800 text-[10px] px-3 py-1 rounded-full shadow-sm font-medium uppercase tracking-wider">
            Simulation Mode
          </span>
        </div>

        {messages.map((msg) => (
          <div key={msg.id} className={`chat ${msg.sender === "user" ? "chat-end" : "chat-start"}`}>
            <div
              className={`chat-bubble text-sm shadow-sm leading-relaxed max-w-[85%]
                    ${
                      msg.sender === "user"
                        ? "bg-[#E7FFDB] text-gray-800 rounded-tr-none" // Style WA Sender
                        : msg.sender === "system"
                          ? "bg-green-100 text-gray-800 rounded-tl-none"
                          : " bg-red-100 text-red-600" // Style WA Receiver
                    }`}
            >
              {/* Render Image for Welcome Msg */}
              {msg.image && (
                <div className="mb-2 -mx-2 -mt-2">
                  <img src={msg.image} alt="Welcome" className="w-full h-auto rounded-t-lg" />
                </div>
              )}

              <p className="whitespace-pre-wrap">{msg.text}</p>

              {/* Fake Time */}
              <div
                className={`text-[10px] mt-1 text-right ${msg.sender === "user" ? "text-gray-400" : "text-gray-400"}`}
              >
                {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                {msg.sender === "user" && <span className="ml-1 text-blue-400">✓✓</span>}
              </div>
            </div>
          </div>
        ))}

        {/* Typing Indicator Bubble */}
        {isTyping && (
          <div className="chat chat-start animate-fade-in">
            <div className="chat-bubble bg-white text-gray-500 p-3 rounded-tl-none shadow-sm flex items-center gap-1 w-16 h-10">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
              <span
                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              ></span>
              <span
                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.4s" }}
              ></span>
            </div>
          </div>
        )}
        <div ref={scrollRef}></div>
      </div>

      {/* --- INPUT AREA --- */}
      <form
        onSubmit={handleSend}
        className="p-3 bg-gray-100/90 backdrop-blur-sm z-20 flex items-center gap-2"
      >
        <input
          type="text"
          className="input border-none flex-1 rounded-full bg-white focus:ring-0 focus:outline-none pl-5 shadow-sm text-sm h-10"
          placeholder="Ketik pesan..."
          value={inputMsg}
          onChange={(e) => setInputMsg(e.target.value)}
          disabled={isTyping}
        />
        <button
          type="submit"
          disabled={!inputMsg.trim() || isTyping}
          className={`btn btn-circle btn-sm bg-[#075E54] hover:bg-[#054c44] text-white border-none shadow-md
                 ${!inputMsg.trim() || isTyping ? "opacity-50 cursor-not-allowed" : "hover:scale-105 transition-transform"}`}
        >
          <FaPaperPlane size={14} className="-ml-0.5 mt-0.5" />
        </button>
      </form>
    </div>
  );
};

export default ChatPreview;
