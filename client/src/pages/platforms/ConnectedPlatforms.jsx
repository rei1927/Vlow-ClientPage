/* eslint-disable react/no-unescaped-entities */
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getPlatforms,
  updatePlatform,
  deletePlatform,
  resetPlatformState,
} from "../../features/platforms/platformSlice";
import { getAgents } from "../../features/agents/agentSlice";
import {
  FaWhatsapp,
  FaInstagram,
  FaRobot,
  FaPlus,
  FaTrash,
  FaFacebook,
  FaSearch,
  FaCog
} from "react-icons/fa";
import toast from "react-hot-toast";

import axiosInstance from "../../api/axiosInstance";
import ConfirmationModal from "../../components/ConfirmationModal";
import AgentListLoading from "../../components/agents/AgentListLoading";
import PlatformModal from "../../components/platforms/PlatformModal";

const ConnectedPlatforms = () => {
  const dispatch = useDispatch();
  const { platforms, isLoading, isError, message } = useSelector(
    (state) => state.platforms,
  );
  const { agents } = useSelector((state) => state.agents);
  const { user } = useSelector((state) => state.auth);

  const [activePlatformId, setActivePlatformId] = useState(null);
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [confirmState, setConfirmState] = useState({ isOpen: false, platform: null });
  const [searchQuery, setSearchQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Selection Modal State
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);

  // WAHA Modal State
  const [isWahaModalOpen, setIsWahaModalOpen] = useState(false);
  const [wahaInitialData, setWahaInitialData] = useState(null);

  // Initial load
  useEffect(() => {
    dispatch(getAgents());
    dispatch(getPlatforms({ limit: 100 })); // Fetch more to fit in list
  }, [dispatch]);

  // Load FB SDK
  useEffect(() => {
    if (!window.FB) {
      window.fbAsyncInit = function () {
        window.FB.init({
          appId: "4503298316613982", // Facebook App ID
          cookie: true,
          xfbml: true,
          version: "v22.0",
        });
      };

      (function (d, s, id) {
        var js,
          fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) {
          return;
        }
        js = d.createElement(s);
        js.id = id;
        js.src = "https://connect.facebook.net/en_US/sdk.js";
        fjs.parentNode.insertBefore(js, fjs);
      })(document, "script", "facebook-jssdk");
    }
  }, []);

  const activePlatform = platforms.find((p) => p.id === activePlatformId);

  // Sync form when selecting a new platform
  useEffect(() => {
    if (activePlatform) {
      setSelectedAgentId(activePlatform.Agent?.id || "");
    }
  }, [activePlatform]);

  // Handle notifications
  useEffect(() => {
    if (isError && message) {
      toast.error(message, { id: "platform-status" });
      dispatch(resetPlatformState());
    }
  }, [isError, message, dispatch]);

  const sendMetaCodeToBackend = async (code, wabaId, phoneNumberId) => {
    try {
      console.log("Sending to backend - code length:", code?.length, "wabaId:", wabaId, "phoneNumberId:", phoneNumberId);
      const response = await axiosInstance.post("/platforms/whatsapp/connect", {
        code,
        wabaId,
        phoneNumberId,
      });

      if (response.data && response.data.success) {
        toast.success("WhatsApp berhasil terhubung melalui Meta!");
        dispatch(getPlatforms({ limit: 100 }));
        if (response.data.data) {
          setActivePlatformId(response.data.data.id);
        }
      } else {
        toast.error("Gagal menghubungkan WhatsApp. Silakan coba lagi.");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Terjadi kesalahan jaringan.");
    }
  };

  const handleConnectWhatsApp = () => {
    if (typeof window.FB === "undefined") {
      toast.error("Meta SDK belum dimuat. Silakan tunggu sebentar.");
      return;
    }

    // Store embedded signup data - persists across async boundaries
    let embeddedData = {};

    // Message event listener to capture WABA ID & Phone Number
    // This fires DURING the Embedded Signup dialog (before FB.login callback)
    const sessionInfoListener = (event) => {
      if (event.origin !== "https://www.facebook.com" && event.origin !== "https://web.facebook.com") return;
      try {
        const data = JSON.parse(event.data);
        console.log("[FB Message Event]", data.type, data);
        if (data.type === "WA_EMBEDDED_SIGNUP") {
          // data.data.event can be 'SUBMIT' or 'FINISH' or 'CANCEL'
          if (data.data) {
            embeddedData = data.data;
            console.log("[Embedded Signup] Captured:", embeddedData);
          }
        }
      } catch (e) { /* ignore non-JSON messages */ }
    };
    window.addEventListener("message", sessionInfoListener);

    window.FB.login(
      (response) => {
        if (response.authResponse && response.authResponse.code) {
          // Wait briefly for the WA_EMBEDDED_SIGNUP event (race condition fix)
          // The message event may arrive slightly after or before FB.login callback
          setTimeout(() => {
            window.removeEventListener("message", sessionInfoListener);
            console.log("[FB.login] Embedded data at send time:", embeddedData);
            sendMetaCodeToBackend(
              response.authResponse.code,
              embeddedData.waba_id,
              embeddedData.phone_number_id
            );
          }, 1500);
        } else {
          window.removeEventListener("message", sessionInfoListener);
          toast.error("Login Meta dibatalkan.");
        }
      },
      {
        config_id: "1190767959562870",
        response_type: "code",
        override_default_response_type: true,
        extras: {
          feature: "whatsapp_embedded_signup",
          sessionInfoVersion: "3",
        },
      }
    );
  };

  const handleConnectFB = () => {
    if (!window.FB) {
      toast.error("Facebook SDK belum dimuat");
      return;
    }
    window.FB.login(
      (response) => {
        if (response.authResponse) {
          toast.success("Berhasil login FB Page!");
        } else {
          toast.error("Login Facebook dibatalkan atau gagal");
        }
      },
      {
        config_id: "1190767959562870",
        response_type: "code",
        override_default_response_type: true,
        extras: {
          setup: {},
          featureType: "",
          sessionInfoVersion: "3",
        },
      }
    );
  };

  const handleSelectWaha = async () => {
    setIsSelectionModalOpen(false);

    // Auto-create session in the background
    const toastId = toast.loading("Memulai sesi WhatsApp baru...");
    try {
      const res = await axiosInstance.post('/platforms', {
        name: `${user?.name || 'Customer'} - Device`,
        provider: 'whatsapp',
        agentId: null
      });

      toast.dismiss(toastId);
      toast.success("Sesi berhasil dibuat, menyiapkan QR Code...");

      // Update Redux state so the left pane shows it
      dispatch(getPlatforms({ limit: 100 }));

      const newPlatform = res.data.data;

      // Open the PlatformModal directly to Step 2 (QR Code phase)
      setWahaInitialData({ ...newPlatform, status: "SCANNING" });
      setIsWahaModalOpen(true);

      // After creating successfully, make it the active platform viewed
      setActivePlatformId(newPlatform.id);

    } catch (err) {
      toast.dismiss(toastId);
      toast.error(err.response?.data?.message || "Gagal memulai sesi WAHA");
    }
  };

  const handleWahaSubmit = async (data) => {
    // This handles any manual update from PlatformModal
    const resultAction = await dispatch(updatePlatform({ id: activePlatformId, platformData: data }));
    return null;
  };

  const handleOpenDeleteConfirm = (platform) => {
    setConfirmState({ isOpen: true, platform });
  };

  const handleCloseDeleteConfirm = () => {
    setConfirmState({ isOpen: false, platform: null });
  };

  const handleConfirmDelete = async () => {
    if (!confirmState.platform) return;
    const resultAction = await dispatch(deletePlatform(confirmState.platform.id));
    if (deletePlatform.fulfilled.match(resultAction)) {
      toast.success("Koneksi berhasil dihapus");
      if (activePlatformId === confirmState.platform.id) {
        setActivePlatformId(null);
      }
      handleCloseDeleteConfirm();
      dispatch(getPlatforms({ limit: 100 }));
    }
  };

  const handleSaveSettings = async () => {
    if (!activePlatform) return;

    setIsSaving(true);
    const formData = {
      name: activePlatform.name,
      agentId: selectedAgentId || null
    };

    const resultAction = await dispatch(
      updatePlatform({ id: activePlatform.id, platformData: formData }),
    );

    if (updatePlatform.fulfilled.match(resultAction)) {
      toast.success("Konfigurasi berhasil diperbarui");
      dispatch(getPlatforms({ limit: 100 }));
    } else {
      toast.error("Gagal memperbarui platform");
    }
    setIsSaving(false);
  };

  const filteredPlatforms = platforms.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-100px)] gap-6 animate-fade-in pb-10">
      {/* LEFT PANE - INBOXES LIST */}
      <div className="w-full md:w-[320px] lg:w-[350px] flex-shrink-0 flex flex-col bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-sm h-[calc(100vh-120px)] max-h-[850px]">
        {/* Header */}
        <div className="p-5 border-b border-[var(--color-border)] flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black text-[var(--color-text)] flex items-center gap-2 tracking-tight">Inboxes</h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">This is where you can connect all your platforms</p>
          </div>
          <div className="dropdown dropdown-end">
            <label tabIndex={0} className="btn btn-sm btn-circle bg-[var(--color-bg)] hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-primary)] text-[var(--color-text-muted)] border border-[var(--color-border)] hover:border-[var(--color-primary)]/30 transition-colors">
              <FaPlus size={12} />
            </label>
            <ul tabIndex={0} className="dropdown-content z-[50] menu p-2 shadow-xl bg-[var(--color-surface)] rounded-xl w-52 border border-[var(--color-border)] mt-2">
              <li>
                <a onClick={() => setIsSelectionModalOpen(true)} className="gap-3 font-semibold text-[var(--color-text)] text-sm py-3">
                  <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
                    <FaWhatsapp className="text-green-500 text-lg" />
                  </div>
                  WhatsApp
                </a>
              </li>
              <li>
                <a onClick={handleConnectFB} className="gap-3 font-semibold text-[var(--color-text)] text-sm py-3">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                    <FaFacebook className="text-blue-500 text-lg" />
                  </div>
                  Facebook Page
                </a>
              </li>
              <li>
                <a onClick={() => toast.success("Fitur Instagram akan segera hadir!")} className="gap-3 font-semibold text-[var(--color-text)] text-sm py-3">
                  <div className="w-8 h-8 rounded-full bg-pink-50 flex items-center justify-center">
                    <FaInstagram className="text-pink-500 text-lg" />
                  </div>
                  Instagram
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="relative group">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] group-focus-within:text-[var(--color-primary)] transition-colors" size={13} />
            <input
              type="text"
              placeholder="Search by name..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-[var(--color-bg)] border border-[var(--color-border)] rounded-full focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] text-[var(--color-text)] transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Inboxes List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[var(--color-bg)]/30">
          {isLoading && platforms.length === 0 ? (
            <div className="py-8"><AgentListLoading type="list" message="Loading platforms..." /></div>
          ) : filteredPlatforms.length === 0 ? (
            <div className="text-center py-8 text-sm text-[var(--color-text-muted)]">No platforms found.</div>
          ) : (
            filteredPlatforms.map(pf => (
              <div
                key={pf.id}
                onClick={() => setActivePlatformId(pf.id)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${activePlatformId === pf.id
                  ? "bg-blue-50/50 dark:bg-[var(--color-primary)]/10 border-blue-200 dark:border-[var(--color-primary)]/30 shadow-sm"
                  : "bg-[var(--color-surface)] border-[var(--color-border)] hover:border-gray-300 dark:hover:border-gray-600 shadow-sm hover:shadow-md"
                  }`}
              >
                <div className="flex gap-3.5 items-center overflow-hidden">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${pf.name.toLowerCase().includes('insta') ? 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 text-white' : 'bg-gradient-to-tr from-green-400 to-green-500 text-white shadow-sm'
                    }`}>
                    {pf.name.toLowerCase().includes('insta') ? <FaInstagram size={24} /> : <FaWhatsapp size={24} />}
                  </div>
                  <div className="truncate">
                    <h4 className="font-bold text-[13px] text-[var(--color-text)] truncate">{pf.name}</h4>
                    <div className="text-[11px] font-medium text-[var(--color-text-muted)] truncate tracking-wide mt-0.5">{pf.sessionId?.substring(0, 14) || "Unknown"}</div>
                  </div>
                </div>

                <div className="flex flex-col justify-center items-end h-full">
                  {/* Status & Agent Avatars */}
                  <div className="flex items-center gap-1.5 flex-col h-full justify-center">
                    {pf.status === "WORKING" && activePlatformId !== pf.id ? (
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                    ) : null}

                    <div className="flex -space-x-1.5 mt-auto">
                      {/* Human initial mock */}
                      <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 border border-white dark:border-gray-800 flex items-center justify-center text-[9px] font-bold z-10">
                        R
                      </div>
                      {/* AI Agent indicator */}
                      {pf.Agent ? (
                        <div className="w-5 h-5 rounded-full bg-purple-100 text-purple-600 border border-white dark:border-gray-800 flex items-center justify-center text-[9px] font-bold z-0">
                          A
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Connect New Box */}
          <div
            onClick={() => setIsSelectionModalOpen(true)}
            className="mt-6 p-5 rounded-xl border-2 border-dashed border-[var(--color-border)] hover:border-blue-300 dark:hover:border-[var(--color-primary)]/50 bg-[var(--color-surface)] cursor-pointer flex items-center gap-4 group transition-all duration-300"
          >
            <div className="w-10 h-10 shrink-0 rounded-full bg-blue-50 dark:bg-[var(--color-primary)]/10 group-hover:bg-blue-100 dark:group-hover:bg-[var(--color-primary)]/20 text-blue-500 dark:text-[var(--color-primary)] flex items-center justify-center transition-colors">
              <FaPlus size={14} />
            </div>
            <div>
              <h4 className="text-[13px] font-bold text-blue-600 dark:text-[var(--color-primary)] tracking-wide">Click to Connect A Platform</h4>
              <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">Add a new Chatting Inbox</p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANE - DETAIL VIEW */}
      <div className="flex-1 flex flex-col bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-sm h-[calc(100vh-120px)] max-h-[850px]">
        {activePlatform ? (
          <>
            {/* Action Header */}
            <div className="p-4 border-b border-[var(--color-border)] flex justify-end items-center bg-[var(--color-surface)] z-10">
              <div className="flex gap-3">
                <button
                  onClick={handleSaveSettings}
                  disabled={isSaving}
                  className="btn btn-sm bg-[var(--color-surface)] hover:bg-[#F3F4F6] dark:hover:bg-gray-800 text-[var(--color-text)] border border-[var(--color-border)] rounded-lg px-6 font-semibold shadow-sm text-xs h-9"
                >
                  {isSaving ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => handleOpenDeleteConfirm(activePlatform)}
                  className="btn btn-sm bg-[#F9FAFB] dark:bg-gray-800 text-[var(--color-text-muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 border border-[var(--color-border)] hover:border-red-200 rounded-lg w-9 h-9 p-0 flex items-center justify-center transition-colors"
                >
                  <FaTrash size={13} />
                </button>
              </div>
            </div>

            <div className="p-8 flex-1 overflow-y-auto bg-white dark:bg-[var(--color-bg)]">
              {/* Main Title Area */}
              <div className="text-center mb-10">
                <h1 className="text-[22px] font-black tracking-tight text-[var(--color-text)] mb-3">{activePlatform.name}</h1>
                <p className="text-sm text-[var(--color-text-muted)]">
                  Type a description here...
                </p>
                <p className="text-xs font-mono text-gray-400 mt-2">
                  Session ID: {activePlatform.sessionId} | Status: <span className={activePlatform.status === 'WORKING' ? 'text-green-500' : 'text-yellow-500'}>{activePlatform.status}</span>
                </p>
              </div>

              {/* Tabs */}
              <div className="flex justify-center mb-10">
                <div className="bg-[#F3F4F6] dark:bg-[#1f2937] p-1.5 rounded-xl flex items-center text-[13px] font-bold w-fit shadow-inner">
                  <button className="px-8 py-2 rounded-lg bg-white dark:bg-[#374151] shadow border border-gray-100 dark:border-gray-600 text-[var(--color-text)] transition-all">Basic</button>
                  <button className="px-8 py-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 cursor-not-allowed transition-all">Flow</button>
                </div>
              </div>

              {/* Form Content */}
              <div className="max-w-xl mx-auto space-y-7 pb-10">
                {/* AI Agent Selection */}
                <div className="mb-8">
                  <label className="text-[13px] font-bold text-[var(--color-text)] mb-3 flex items-center gap-2">
                    AI Agent <a href="#" className="text-blue-500 hover:text-blue-600 transition-colors"><FaCog size={12} /></a>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-500 bg-blue-100/50 w-7 h-7 rounded-full flex items-center justify-center">
                      <FaRobot size={13} className="" />
                    </div>
                    <select
                      className="w-full pl-14 pr-10 py-3.5 bg-white dark:bg-[#1f2937] border border-[var(--color-border)] rounded-xl text-sm font-medium text-[var(--color-text)] appearance-none outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all shadow-sm cursor-pointer"
                      value={selectedAgentId || ""}
                      onChange={(e) => setSelectedAgentId(e.target.value)}
                    >
                      <option value="">No AI Agent Connected</option>
                      {agents.map(ag => (
                        <option key={ag.id} value={ag.id}>🤖 {ag.name}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-[var(--color-text-muted)]">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                    </div>
                  </div>
                </div>

                {/* Teams / Division */}
                <div className="mb-8">
                  <label className="block text-[13px] font-bold text-[var(--color-text)] mb-3">Teams</label>
                  <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-4">
                    <p className="text-[13px] text-gray-500 dark:text-gray-400">You don't have any division yet. Create it now</p>
                    <button className="text-[13px] font-bold text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50 rounded-lg px-4 py-2 bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-gray-700 flex items-center gap-1.5 transition-colors shadow-sm">
                      <FaPlus size={11} /> Create Division
                    </button>
                  </div>
                </div>

                {/* Human Agent */}
                <div className="mb-8">
                  <label className="block text-[13px] font-bold text-[var(--color-text)] mb-3">Human Agent</label>
                  <div className="w-full pl-3 pr-4 py-3 bg-white dark:bg-[#1f2937] border border-[var(--color-border)] rounded-xl flex items-center gap-2 shadow-sm relative">
                    <div className="bg-[#F3F4F6] dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-600 outline-none text-[13px] font-bold flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[9px] font-black">R</div>
                      Rei
                      <span className="text-[14px] cursor-pointer text-gray-400 hover:text-gray-600 dark:hover:text-white ml-2">&times;</span>
                    </div>
                    <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-[var(--color-text-muted)]">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                    </div>
                  </div>
                </div>

                {/* Chat Distribution Method */}
                <div className="mb-10">
                  <label className="block text-[13px] font-bold text-[var(--color-text)] mb-3">Chat Distribution Method</label>
                  <div className="relative">
                    <select className="w-full px-4 py-3.5 bg-[#F9FAFB] dark:bg-[#1f2937] border border-[var(--color-border)] rounded-xl text-sm font-semibold text-[var(--color-text)] outline-none appearance-none cursor-pointer hover:bg-white transition-colors">
                      <option>Least Assigned First</option>
                      <option>Round Robin</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-[var(--color-text-muted)]">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                    </div>
                  </div>
                </div>

                {/* Toggles */}
                <div className="space-y-6 pt-6 font-sans">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-[13px] font-bold text-[var(--color-text)] flex items-center gap-2 tracking-wide">
                        Customer Satisfaction Feature (CSAT) <a href="#" className="text-blue-500 hover:text-blue-600 transition-colors"><FaCog size={14} /></a>
                      </h4>
                      <p className="text-[12px] text-gray-500 mt-1.5">Send a review link to the chat after it is resolved by an agent.</p>
                    </div>
                    <input type="checkbox" className="toggle toggle-sm bg-gray-200 border-gray-200 [--tglbg:white] hover:bg-gray-300" />
                  </div>

                  <div className="flex items-center justify-between mt-8">
                    <div className="pr-10">
                      <h4 className="text-[13px] font-bold text-[var(--color-text)] tracking-wide">
                        Reassign Chat When Agent is Offline
                      </h4>
                      <p className="text-[12px] text-gray-500 mt-1.5">Automatically reassign conversation to available agent when the assigned agent goes offline</p>
                    </div>
                    <input type="checkbox" className="toggle toggle-sm bg-gray-200 border-gray-200 [--tglbg:white] hover:bg-gray-300" />
                  </div>
                </div>

              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-[var(--color-surface)]">
            <div className="w-20 h-20 rounded-full bg-blue-50 dark:bg-[#1f2937] text-blue-500 dark:text-[var(--color-primary)] flex items-center justify-center mb-6 shadow-sm">
              <FaWhatsapp size={36} />
            </div>
            <h3 className="text-xl font-black tracking-tight text-[var(--color-text)]">Select an Inbox</h3>
            <p className="text-[var(--color-text-muted)] text-[13px] mt-2 max-w-xs leading-relaxed">
              Click on one of your connected platforms on the left to view and edit its workspace settings.
            </p>
          </div>
        )}
      </div>

      {/* MODALS */}
      {/* 1. SELECTION MODAL */}
      {isSelectionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#1f2937] border border-gray-700 rounded-3xl p-8 max-w-2xl w-full shadow-2xl relative overflow-hidden">

            {/* Background Glows */}
            <div className="absolute -top-32 -left-32 w-64 h-64 bg-green-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <button
              onClick={() => setIsSelectionModalOpen(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors"
            >
              &times;
            </button>
            <h2 className="text-2xl font-black text-white mb-2 relative z-10">Connect WhatsApp</h2>
            <p className="text-gray-400 text-sm mb-8 relative z-10">Choose your connection method</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10">

              {/* META / CLOUD API OPTION */}
              <div
                onClick={() => {
                  setIsSelectionModalOpen(false);
                  handleConnectWhatsApp();
                }}
                className="group relative cursor-pointer rounded-2xl p-[2px] overflow-hidden transition-all duration-300 hover:scale-[1.02]"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-green-400/40 to-green-600/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl blur-md"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-green-400 via-emerald-500 to-green-600 opacity-50 rounded-2xl"></div>

                <div className="relative h-full bg-[#111827] rounded-[14px] p-6 flex flex-col justify-between border border-green-500/30 group-hover:border-green-400/60 transition-colors">
                  <div className="absolute top-4 right-4 bg-green-500/20 border border-green-500/30 text-green-400 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                    Recommended
                  </div>

                  <div className="mb-6 relative">
                    <FaWhatsapp size={46} className="text-green-400 drop-shadow-[0_0_15px_rgba(74,222,128,0.5)]" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg mb-2">WhatsApp Business (Official)</h3>
                    <p className="text-gray-400 text-xs leading-relaxed">Connect via Meta Cloud API. Best for high volume and stability. Requires a Meta Business Account.</p>
                  </div>
                </div>
              </div>

              {/* WAHA / QR CODE OPTION */}
              <div
                onClick={handleSelectWaha}
                className="group relative cursor-pointer rounded-2xl p-[2px] overflow-hidden transition-all duration-300 hover:scale-[1.02]"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl blur-md"></div>
                <div className="absolute inset-0 bg-gray-700 opacity-50 rounded-2xl"></div>

                <div className="relative h-full bg-[#1f2937] rounded-[14px] p-6 flex flex-col justify-between border border-gray-600 group-hover:border-blue-400/50 transition-colors">
                  <div className="mb-6 relative">
                    <div className="relative inline-block">
                      <FaWhatsapp size={40} className="text-gray-500 opacity-50" />
                      <div className="absolute -bottom-1 -right-2 bg-gray-800 p-1.5 rounded-lg border border-gray-600">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-blue-400" stroke="currentColor" strokeWidth="2"><path d="M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3zM9 9h6v6H9zM15 15h6v6h-6z" /></svg>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-gray-200 font-bold text-lg mb-2 group-hover:text-white transition-colors">Linked Device (WAHA)</h3>
                    <p className="text-gray-400 text-xs leading-relaxed">Scan a QR code from your existing WhatsApp app. Best for quick setup and personal numbers.</p>
                  </div>
                </div>
              </div>

            </div>

            <div className="mt-8 text-right">
              <a href="#" className="text-gray-500 hover:text-gray-300 text-xs font-semibold flex items-center justify-end gap-1 transition-colors">
                Learn More <span>&rarr;</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 2. WAHA SETUP MODAL */}
      <PlatformModal
        isOpen={isWahaModalOpen}
        onClose={() => setIsWahaModalOpen(false)}
        onSubmit={handleWahaSubmit}
        initialData={wahaInitialData}
        agents={agents}
      />

      {/* 3. DELETE CONFIRMATION */}
      <ConfirmationModal
        isOpen={confirmState.isOpen}
        onClose={handleCloseDeleteConfirm}
        onConfirm={handleConfirmDelete}
        title="Delete Connection?"
        message={`Are you sure you want to completely remove ${confirmState.platform?.name || "this"}? You won't be able to recover data associated with it.`}
        variant="danger"
        confirmText="Yes, Delete"
        cancelText="Cancel"
        isLoading={false}
      />
    </div>
  );
};

export default ConnectedPlatforms;
