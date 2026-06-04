import React, { useState, useEffect } from "react";
import axiosInstance from "../../api/axiosInstance";
import toast from "react-hot-toast";
import { FaPlay, FaPause, FaStop, FaUpload, FaFileCsv } from "react-icons/fa";
import FeatureAccessGuard from "../../components/common/FeatureAccessGuard";

const UnofficialBroadcast = () => {
  const [platforms, setPlatforms] = useState([]);
  const [selectedPlatform, setSelectedPlatform] = useState("");
  const [targetNumbers, setTargetNumbers] = useState("");
  const [messageText, setMessageText] = useState("");
  const [imageBase64, setImageBase64] = useState("");
  const [imageName, setImageName] = useState("");
  const [minDelay, setMinDelay] = useState(3);
  const [maxDelay, setMaxDelay] = useState(7);

  // Broadcast state
  const [status, setStatus] = useState("IDLE"); // IDLE, RUNNING, PAUSED, FINISHED
  const [logs, setLogs] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shouldStop, setShouldStop] = useState(false);
  const [shouldPause, setShouldPause] = useState(false);

  // Stats
  const [stats, setStats] = useState({ success: 0, failed: 0, total: 0 });

  useEffect(() => {
    fetchPlatforms();
  }, []);

  const fetchPlatforms = async () => {
    try {
      const { data } = await axiosInstance.get("/platforms");
      // Filter only WAHA platforms that are connected
      const wahaPlatforms = data.data.filter(
        (p) => p.provider === "waha" && p.status === "WORKING"
      );
      setPlatforms(wahaPlatforms);
      if (wahaPlatforms.length > 0) setSelectedPlatform(wahaPlatforms[0].id);
    } catch (error) {
      console.error("Failed to fetch platforms", error);
    }
  };

  const parseNumbers = (input) => {
    return input
      .split(/[\n,]/)
      .map((n) => n.trim().replace(/\D/g, ""))
      .filter((n) => n.length >= 10); // Basic validation
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      const lines = content.split('\n');
      const numbers = lines.map(line => {
        const parts = line.split(',');
        return parts[0].replace(/\D/g, ""); // Assume first column is phone number
      }).filter(n => n.length >= 10);
      setTargetNumbers(numbers.join('\n'));
      toast.success(`${numbers.length} nomor berhasil diekstrak dari file`);
    };
    reader.readAsText(file);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      return toast.error("Ukuran gambar maksimal 5MB");
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setImageBase64(event.target.result);
      setImageName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageBase64("");
    setImageName("");
  };

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const addLog = (msg, type = "info") => {
    setLogs((prev) => [{ time: new Date().toLocaleTimeString(), msg, type }, ...prev].slice(0, 50));
  };

  const startBroadcast = async () => {
    const numbers = parseNumbers(targetNumbers);
    if (numbers.length === 0) return toast.error("Daftar nomor target kosong atau tidak valid");
    if (!messageText && !imageBase64) return toast.error("Pesan atau gambar tidak boleh kosong");
    if (!selectedPlatform) return toast.error("Pilih akun pengirim (Device WA)");

    setStatus("RUNNING");
    setShouldStop(false);
    setShouldPause(false);
    setStats({ success: 0, failed: 0, total: numbers.length });
    setLogs([]);
    setCurrentIndex(0);

    let currentSuccess = 0;
    let currentFailed = 0;

    for (let i = 0; i < numbers.length; i++) {
      // Handle Pause/Stop
      while (shouldPauseRef.current && !shouldStopRef.current) {
        await sleep(1000);
      }
      if (shouldStopRef.current) {
        setStatus("FINISHED");
        addLog("Broadcast dihentikan oleh pengguna", "warning");
        break;
      }

      setCurrentIndex(i);
      const target = numbers[i] + "@s.whatsapp.net";
      
      try {
        addLog(`Mengirim ke ${numbers[i]}...`, "info");
        await axiosInstance.post(`/chats/${selectedPlatform}/${target}/messages`, {
          text: messageText,
          image: imageBase64 || undefined
        });
        currentSuccess++;
        addLog(`Berhasil mengirim ke ${numbers[i]}`, "success");
      } catch (err) {
        currentFailed++;
        addLog(`Gagal mengirim ke ${numbers[i]}: ${err.response?.data?.message || err.message}`, "error");
      }

      setStats({ success: currentSuccess, failed: currentFailed, total: numbers.length });

      // Delay if not the last item
      if (i < numbers.length - 1 && !shouldStopRef.current) {
        const delaySec = Math.floor(Math.random() * (maxDelay - minDelay + 1) + minDelay);
        addLog(`Menunggu ${delaySec} detik sebelum pesan berikutnya...`, "info");
        await sleep(delaySec * 1000);
      }
    }

    if (!shouldStopRef.current) {
      setStatus("FINISHED");
      addLog("Broadcast selesai!", "success");
      toast.success("Broadcast selesai!");
    }
  };

  // Refs for loop visibility
  const shouldPauseRef = React.useRef(shouldPause);
  const shouldStopRef = React.useRef(shouldStop);
  useEffect(() => { shouldPauseRef.current = shouldPause; }, [shouldPause]);
  useEffect(() => { shouldStopRef.current = shouldStop; }, [shouldStop]);

  return (
    <FeatureAccessGuard feature="broadcast">
      <div className="p-6 text-[var(--color-text)] min-h-[calc(100vh-100px)] animate-fade-in">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Unofficial Broadcast</h1>
          <p className="text-[var(--color-text-muted)] text-sm mt-1">
            Kirim pesan massal secara berurutan dengan jeda waktu langsung dari browser Anda. 
            <span className="text-yellow-500 font-semibold ml-1">Jangan tutup halaman ini selama proses berjalan.</span>
          </p>
          <div className="mt-4 p-4 bg-orange-500/10 border-l-4 border-orange-500 rounded-r-lg">
            <p className="text-sm text-orange-700 dark:text-orange-400 leading-relaxed">
              <strong>Penting (Do With Your Own Risk):</strong> Harap pastikan nomor WhatsApp yang digunakan untuk pengiriman telah aktif beroperasi selama lebih dari 3 bulan dan digunakan secara reguler. Penggunaan nomor baru atau tidak aktif secara signifikan meningkatkan potensi risiko pemblokiran (banned) oleh pihak WhatsApp. Penggunaan fitur ini sepenuhnya menjadi tanggung jawab Anda.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Setup */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-5 rounded-2xl shadow-sm">
              <h2 className="text-lg font-semibold mb-4 border-b border-[var(--color-border)] pb-2">Konfigurasi Siaran</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Pilih Device Pengirim</label>
                  <select 
                    value={selectedPlatform || ""}
                    onChange={(e) => setSelectedPlatform(e.target.value)}
                    disabled={status === "RUNNING" || status === "PAUSED"}
                    className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-4 py-2 text-sm focus:border-blue-500 outline-none"
                  >
                    <option value="">-- Pilih Device --</option>
                    {platforms.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.phoneNumber})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium">Nomor Tujuan</label>
                    <label className="cursor-pointer text-xs bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 px-2 py-1 rounded flex items-center gap-1 transition-colors">
                      <FaUpload /> Upload CSV
                      <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} disabled={status === "RUNNING" || status === "PAUSED"} />
                    </label>
                  </div>
                  <textarea
                    value={targetNumbers}
                    onChange={(e) => setTargetNumbers(e.target.value)}
                    disabled={status === "RUNNING" || status === "PAUSED"}
                    placeholder="Masukkan nomor (pisahkan dengan koma atau baris baru)&#10;Contoh:&#10;628123456789&#10;628987654321"
                    className="w-full h-32 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none resize-none font-mono"
                  ></textarea>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">Total: {targetNumbers ? parseNumbers(targetNumbers).length : 0} nomor unik (angka saja)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Isi Pesan</label>
                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    disabled={status === "RUNNING" || status === "PAUSED"}
                    placeholder="Tulis pesan broadcast Anda di sini..."
                    className="w-full h-40 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none resize-none"
                  ></textarea>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium">Sisipkan Gambar (Opsional)</label>
                    {imageBase64 && (
                      <button onClick={removeImage} className="text-xs text-red-500 hover:underline">Hapus Gambar</button>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <label className={`cursor-pointer w-full flex flex-col items-center justify-center h-24 border-2 border-dashed ${imageBase64 ? 'border-green-500 bg-green-500/10' : 'border-[var(--color-border)] hover:bg-[var(--color-bg)]'} rounded-xl transition-colors`}>
                      <FaUpload className={`mb-2 ${imageBase64 ? 'text-green-500' : 'text-[var(--color-text-muted)]'}`} />
                      <span className="text-sm font-medium text-[var(--color-text-muted)]">
                        {imageBase64 ? imageName : "Klik untuk upload gambar"}
                      </span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={status === "RUNNING" || status === "PAUSED"} />
                    </label>
                    {imageBase64 && (
                      <img src={imageBase64} alt="Preview" className="h-24 w-24 object-cover rounded-xl border border-[var(--color-border)]" />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Delay Min (Detik)</label>
                    <input 
                      type="number" 
                      min="1"
                      value={minDelay}
                      onChange={(e) => setMinDelay(Number(e.target.value))}
                      disabled={status === "RUNNING" || status === "PAUSED"}
                      className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-4 py-2 text-sm focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Delay Max (Detik)</label>
                    <input 
                      type="number" 
                      min="1"
                      value={maxDelay}
                      onChange={(e) => setMaxDelay(Number(e.target.value))}
                      disabled={status === "RUNNING" || status === "PAUSED"}
                      className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-4 py-2 text-sm focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Control Panel & Logs */}
          <div className="space-y-6">
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-5 rounded-2xl shadow-sm text-center">
              <h3 className="font-semibold text-lg mb-2">Status: <span className={status === "RUNNING" ? "text-blue-500" : status === "FINISHED" ? "text-green-500" : "text-gray-400"}>{status}</span></h3>
              
              <div className="grid grid-cols-3 gap-2 mb-6">
                <div className="bg-[var(--color-bg)] rounded-lg p-2 border border-[var(--color-border)]">
                  <div className="text-2xl font-bold text-gray-300">{stats.total}</div>
                  <div className="text-xs text-[var(--color-text-muted)]">Total</div>
                </div>
                <div className="bg-[var(--color-bg)] rounded-lg p-2 border border-green-500/20">
                  <div className="text-2xl font-bold text-green-500">{stats.success}</div>
                  <div className="text-xs text-[var(--color-text-muted)]">Sukses</div>
                </div>
                <div className="bg-[var(--color-bg)] rounded-lg p-2 border border-red-500/20">
                  <div className="text-2xl font-bold text-red-500">{stats.failed}</div>
                  <div className="text-xs text-[var(--color-text-muted)]">Gagal</div>
                </div>
              </div>

              {/* Progress Bar */}
              {stats.total > 0 && (
                <div className="mb-6">
                  <div className="h-2 w-full bg-[var(--color-bg)] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${((stats.success + stats.failed) / stats.total) * 100}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-[var(--color-text-muted)] mt-2">
                    Progres: {stats.success + stats.failed} / {stats.total}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                {status === "IDLE" || status === "FINISHED" ? (
                  <button 
                    onClick={startBroadcast}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl flex items-center justify-center gap-2 transition-colors font-medium"
                  >
                    <FaPlay /> Mulai
                  </button>
                ) : (
                  <>
                    <button 
                      onClick={() => setShouldPause(!shouldPause)}
                      className={`flex-1 ${shouldPause ? "bg-yellow-600" : "bg-[var(--color-bg)] border border-[var(--color-border)] hover:bg-[var(--color-border)]"} text-white py-2 rounded-xl flex items-center justify-center gap-2 transition-colors`}
                    >
                      {shouldPause ? <FaPlay size={12} /> : <FaPause size={12} />} 
                      {shouldPause ? "Resume" : "Pause"}
                    </button>
                    <button 
                      onClick={() => setShouldStop(true)}
                      className="flex-1 bg-red-600/20 text-red-500 hover:bg-red-600/30 py-2 rounded-xl flex items-center justify-center gap-2 transition-colors"
                    >
                      <FaStop size={12} /> Stop
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Live Logs */}
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-sm flex flex-col h-64 overflow-hidden">
              <div className="p-3 border-b border-[var(--color-border)] bg-[var(--color-bg)] font-semibold text-sm">
                Live Console Log
              </div>
              <div className="flex-1 overflow-y-auto p-3 font-mono text-[10px] space-y-2 bg-[#0d1117] text-gray-300">
                {logs.length === 0 ? (
                  <div className="text-gray-500 italic text-center mt-4">Waiting for task...</div>
                ) : (
                  logs.map((log, i) => (
                    <div key={i} className={`flex gap-2 ${log.type === 'error' ? 'text-red-400' : log.type === 'success' ? 'text-green-400' : log.type === 'warning' ? 'text-yellow-400' : ''}`}>
                      <span className="text-gray-500 shrink-0">[{log.time}]</span>
                      <span>{log.msg}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </FeatureAccessGuard>
  );
};

export default UnofficialBroadcast;
