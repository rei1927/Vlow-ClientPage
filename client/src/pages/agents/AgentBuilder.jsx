import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import {
  getAgentById,
  createAgent,
  updateAgent,
  addKnowledge,
  resetAgentState,
  clearCurrentAgent,
} from "../../features/agents/agentSlice";
import {
  FaSave,
  FaArrowLeft,
  FaBrain,
  FaDatabase,
  FaClock,
  FaChartBar,
  FaSpinner,
} from "react-icons/fa";
import toast from "react-hot-toast";
import {
  getDefaultHandoffConfig,
  parseHandoffConfig,
  serializeHandoffConfig,
  validateHandoffConfig,
} from "../../utils/handoff";

// Tabs
import GeneralTab from "./tabs/GeneralTab";
import KnowledgeTab from "./tabs/KnowledgeTab";
import FollowupTab from "./tabs/FollowupTab";
import EvaluationTab from "./tabs/EvaluationTab";
import ChatPreview from "../../components/agents/ChatPreview";
import SubscriptionWarning from "../../components/common/SubscriptionWarning";

const AgentBuilder = () => {
  const { id } = useParams();
  const isEditMode = !!id;
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { currentAgent, isLoading, isSuccess, message } = useSelector((state) => state.agents);
  const { user } = useSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState("general");
  const [isSaving, setIsSaving] = useState(false); // Local loading state for custom flow
  const [isTabLoading, setIsTabLoading] = useState(false); // Loading state for tab switching

  // Form Data
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    systemInstruction: "",
    welcomeMessage: "",
    transferCondition: "",
    whatsappNumber: "",
    isActive: false,
  });
  const [welcomeImageFile, setWelcomeImageFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [shouldRemoveImage, setShouldRemoveImage] = useState(false);

  // Smart Knowledge State (Untuk Create Mode)
  const [pendingKnowledge, setPendingKnowledge] = useState([]);

  const [followupConfig, setFollowupConfig] = useState({
    isEnabled: false,
    delay: 15,
    unit: "minutes",
    prompt: "",
  });
  const [handoffConfig, setHandoffConfig] = useState(getDefaultHandoffConfig());

  const knowledgeBaseText = useMemo(() => {
    const sources = [];
    if (Array.isArray(currentAgent?.KnowledgeSources)) {
      sources.push(
        ...currentAgent.KnowledgeSources.map((k) => ({
          title: k.title || "Untitled",
          description: k.description || "",
        })),
      );
    }
    if (Array.isArray(pendingKnowledge)) {
      sources.push(
        ...pendingKnowledge.map((k) => ({
          title: k.title || "Untitled",
          description: k.description || "",
        })),
      );
    }
    return sources
      .filter((k) => k.description && k.description.trim().length > 0)
      .map((k) => `[${k.title}]:\n${k.description}`)
      .join("\n\n---\n\n");
  }, [currentAgent, pendingKnowledge]);

  // 1. INIT
  useEffect(() => {
    if (isEditMode) {
      dispatch(getAgentById(id));
    } else {
      dispatch(clearCurrentAgent());
      setFormData({
        name: "",
        description: "",
        systemInstruction: "",
        welcomeMessage: "",
        transferCondition: "",
        whatsappNumber: "",
        isActive: false,
      });
      setPreviewImage(null);
      setPendingKnowledge([]);
      setHandoffConfig(getDefaultHandoffConfig());
      setShouldRemoveImage(false);
    }
    return () => dispatch(resetAgentState());
  }, [id, isEditMode, dispatch]);

  // 2. POPULATE DATA
  useEffect(() => {
    if (isEditMode && currentAgent) {
      setFormData({
        name: currentAgent.name || "",
        description: currentAgent.description || "",
        systemInstruction: currentAgent.systemInstruction || "",
        welcomeMessage: currentAgent.welcomeMessage || "",
        transferCondition: currentAgent.transferCondition || "",
        whatsappNumber: currentAgent.whatsappNumber || "",
        isActive: currentAgent.isActive || false,
      });
      // Only set preview image if not marked for removal
      if (currentAgent.welcomeImageUrl && !shouldRemoveImage) {
        setPreviewImage(currentAgent.welcomeImageUrl);
      } else if (shouldRemoveImage) {
        setPreviewImage(null);
      }
      if (currentAgent.followupConfig) {
        setFollowupConfig(currentAgent.followupConfig);
      }
      setHandoffConfig(parseHandoffConfig(currentAgent.transferCondition));
    } else {
      setFollowupConfig({ isEnabled: false, delay: 15, unit: "minutes", prompt: "" });
      setHandoffConfig(getDefaultHandoffConfig());
    }
  }, [currentAgent, isEditMode]);
  
  // Separate effect to handle image removal
  useEffect(() => {
    if (shouldRemoveImage) {
      setPreviewImage(null);
    }
  }, [shouldRemoveImage]);

  // 3. HANDLERS
  const handleInputChange = (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setFormData((prev) => ({ ...prev, [e.target.name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setWelcomeImageFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    // console.log("Removing image...");
    setWelcomeImageFile(null);
    setPreviewImage(null);
    setShouldRemoveImage(true);
    toast.success("Gambar berhasil dihapus", { duration: 2000 });
  };

  // Logic untuk Knowledge di Create Mode
  const handleAddPendingKnowledge = (knowledgeItem) => {
    // knowledgeItem = { description, file, tempId }
    setPendingKnowledge((prev) => [...prev, knowledgeItem]);
  };

  const handleRemovePendingKnowledge = (tempId) => {
    setPendingKnowledge((prev) => prev.filter((k) => k.tempId !== tempId));
  };

  // 4. SAVE LOGIC (SOPHISTICATED)
  // Check subscription status
  const isSubscriptionExpired = (() => {
    if (user?.role !== "customer") return false;
    if (!user?.subscriptionExpiry) return true; // No subscription = expired
    const expiryDate = new Date(user.subscriptionExpiry);
    return expiryDate < new Date();
  })();

  const handleSave = async () => {
    if (isSubscriptionExpired) {
      toast.error("Langganan Anda telah berakhir. Silakan hubungi administrator.", {
        id: "subscription-expired-save",
      });
      return;
    }
    if (!formData.name) return toast.error("Nama Agent wajib diisi.");
    const handoffValidation = validateHandoffConfig(handoffConfig);
    if (!handoffValidation.isValid) {
      setActiveTab("general");
      return toast.error(handoffValidation.message);
    }

    setIsSaving(true);
    try {
      const dataToSend = new FormData();
      Object.keys(formData).forEach((key) => {
        if (key === "transferCondition") return;
        dataToSend.append(key, formData[key]);
      });
      if (welcomeImageFile) {
        dataToSend.append("welcomeImage", welcomeImageFile);
      }
      // Send flag to remove image if needed
      if (shouldRemoveImage && isEditMode) {
        dataToSend.append("removeWelcomeImage", "true");
      }

      dataToSend.append("followupConfig", JSON.stringify(followupConfig));
      dataToSend.append("transferCondition", serializeHandoffConfig(handoffConfig));

      let agentId = id;
      if (isEditMode) {
        await dispatch(updateAgent({ id, agentData: dataToSend })).unwrap();
      } else {
        const result = await dispatch(createAgent(dataToSend)).unwrap();
        agentId = result.data.id;
      }

      // --- UPLOAD PENDING KNOWLEDGE (PERBAIKAN DISINI) ---
      if (pendingKnowledge.length > 0 && agentId) {
        const uploadPromises = pendingKnowledge.map((k) => {
          // PERBAIKAN: Pastikan ini Object biasa, bukan FormData
          const kData = {
            title: k.title,
            description: k.description,
          };

          // Dispatch action addKnowledge
          return dispatch(addKnowledge({ agentId, knowledgeData: kData })).unwrap();
        });

        await Promise.all(uploadPromises);
        setPendingKnowledge([]);
      }

      toast.success(
        isEditMode ? "Agent berhasil diperbarui!" : "Agent berhasil dibuat & Knowledge diupload!",
      );

      // Reset remove image flag after successful save
      if (shouldRemoveImage) {
        setShouldRemoveImage(false);
      }

      // Redirect ke edit mode jika create baru, agar data tersinkron
      if (!isEditMode) navigate(`/ai-agents/${agentId}`);
    } catch (err) {
      toast.error(typeof err === "string" ? err : "Gagal menyimpan agent.");
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTabChange = (tabId) => {
    setIsTabLoading(true);
    setActiveTab(tabId);
    // Simulate loading delay for smooth transition
    setTimeout(() => {
      setIsTabLoading(false);
    }, 300);
  };

  return (
    <div className="pb-10 max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* HEADER STICKY (Mobile Friendly) - Compact design */}
      <div className="sticky top-0 z-10 bg-[var(--color-surface)]/95 backdrop-blur-sm border-b border-[var(--color-border)] -mx-4 px-4 sm:mx-0 sm:px-0 mb-4">
        {/* Compact Header Row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 py-2 sm:py-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <button
              onClick={() => navigate("/ai-agents")}
              className="btn btn-circle btn-ghost btn-sm text-[var(--color-text-muted)] hover:bg-[var(--color-border)] flex-shrink-0"
            >
              <FaArrowLeft />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="text-base sm:text-lg font-bold text-[var(--color-text)] leading-tight truncate">
                {isEditMode ? formData.name || "Loading..." : "New AI Agent"}
              </h1>
              <div className="text-xs text-[var(--color-text-muted)] flex items-center gap-1.5 mt-0.5">
                {isEditMode ? (
                  <span className="text-blue-600 font-medium">Editing Mode</span>
                ) : (
                  <span>Creation Mode</span>
                )}
                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                <span className="capitalize">{activeTab.replace("-", " ")}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto justify-end">
            <div className="flex items-center gap-1.5 bg-[var(--color-surface)] px-2 sm:px-2.5 py-1 rounded-full border border-[var(--color-border)] shadow-sm">
              <span
                className={`w-1.5 h-1.5 rounded-full ${formData.isActive ? "bg-green-500" : "bg-[var(--color-border)]"}`}
              ></span>
              <span className="text-xs font-medium text-[var(--color-text-muted)] hidden sm:inline">Active</span>
              <input
                type="checkbox"
                name="isActive"
                className="toggle toggle-xs toggle-success"
                checked={formData.isActive}
                onChange={handleInputChange}
              />
            </div>
            <button
              onClick={handleSave}
              disabled={isSaving || isSubscriptionExpired}
              className={`btn btn-sm border-none rounded-lg shadow-md gap-1.5 px-3 sm:px-5 ${
                isSubscriptionExpired
                  ? "bg-[var(--color-text-muted)] text-white cursor-not-allowed"
                  : "bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white"
              }`}
            >
              {isSaving ? <FaSpinner className="animate-spin" /> : <FaSave />}
              <span className="hidden sm:inline">{isEditMode ? "Update" : "Create Agent"}</span>
              <span className="sm:hidden">{isEditMode ? "Update" : "Create"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* SUBSCRIPTION WARNING */}
      <SubscriptionWarning subscriptionExpiry={user?.subscriptionExpiry} userRole={user?.role} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* LEFT: CONFIGURATION (Full width on mobile, 7 cols on LG) */}
        <div
          className={`flex flex-col gap-4 transition-all duration-300 
             ${activeTab === "general" ? "lg:col-span-7 xl:col-span-8" : "lg:col-span-12"}`}
        >
          {/* TABS NAVIGATION (Modern Pills) - Outside sticky header */}
          <div className="flex flex-nowrap overflow-x-auto gap-2 pb-2 scrollbar-hide">
            {[
              { id: "general", label: "General", icon: <FaBrain /> },
              { id: "knowledge", label: "Knowledge Resources", icon: <FaDatabase /> },
              { id: "followups", label: "Follow-ups", icon: <FaClock /> },
              { id: "evaluation", label: "Evaluation", icon: <FaChartBar /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                disabled={isTabLoading}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap
                            ${
                              activeTab === tab.id
                                ? "bg-[var(--color-primary)] text-white shadow-lg"
                                : "bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:bg-[var(--color-border)] border border-[var(--color-border)]"
                            } ${isTabLoading ? "opacity-50 cursor-wait" : ""}`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* TAB CONTENT AREA */}
          <div className="bg-[var(--color-surface)] rounded-3xl shadow-sm border border-[var(--color-border)] p-6 sm:p-8 min-h-150 relative overflow-hidden">
            {isTabLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <FaSpinner className="animate-spin text-4xl text-[var(--color-primary)] mb-4" />
                <p className="text-[var(--color-text-muted)] text-sm">Memuat konten...</p>
              </div>
            ) : (
              <>
                <div className={activeTab === "general" ? "block" : "hidden"}>
                  <GeneralTab
                    formData={formData}
                    handleChange={handleInputChange}
                    handleFileChange={handleFileChange}
                    previewImage={shouldRemoveImage ? null : (previewImage || (!shouldRemoveImage && currentAgent?.welcomeImageUrl ? currentAgent.welcomeImageUrl : null))}
                    handoffConfig={handoffConfig}
                    setHandoffConfig={setHandoffConfig}
                    onRemoveImage={handleRemoveImage}
                  />
                </div>

                <div className={activeTab === "knowledge" ? "block" : "hidden"}>
                  <KnowledgeTab
                    agentId={id}
                    isEditMode={isEditMode}
                    knowledgeSources={currentAgent?.KnowledgeSources || []}
                    pendingKnowledge={pendingKnowledge} // Pass pending state
                    onAddPending={handleAddPendingKnowledge}
                    onRemovePending={handleRemovePendingKnowledge}
                  />
                </div>

                {activeTab === "followups" && (
                  <FollowupTab config={followupConfig} setConfig={setFollowupConfig} />
                )}
                {activeTab === "evaluation" && <EvaluationTab agentId={id} />}
              </>
            )}
          </div>
        </div>

        {/* RIGHT: PREVIEW (Hidden on mobile initially, or stacked) */}
        {activeTab === "general" && (
          <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-28 animate-[fadeIn_0.5s]">
            <div className="bg-linear-to-br from-gray-100 to-gray-50 rounded-3xl p-1 border border-gray-200 shadow-inner">
              <div className="px-4 py-3 flex justify-between items-center">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Simulator
                </span>
                <span className="badge badge-sm text-xs">
                  Live Preview
                </span>
              </div>
              <ChatPreview
                agentName={formData.name}
                systemInstruction={formData.systemInstruction}
                knowledgeBase={knowledgeBaseText}
                handoffConfig={handoffConfig}
                welcomeMessage={formData.welcomeMessage}
                welcomeImageUrl={previewImage || currentAgent?.welcomeImageUrl || ""}
                isActive={formData.isActive}
                followupConfig={followupConfig}
              />
              <div className="mt-4 bg-blue-50/50 rounded-xl p-4 border border-blue-100 text-xs text-blue-800 leading-relaxed">
                <p className="font-semibold mb-1">AI agent chat preview</p>
                <p>Silahkan tes ai agent kamu melalui chat tersebut untuk simulasi.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentBuilder;
