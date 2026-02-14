import Agent from "../models/Agent.js";
import KnowledgeSource from "../models/KnowledgeSource.js";
import ConnectedPlatform from "../models/ConnectedPlatform.js";
import User from "../models/User.js";
import AppError from "../utils/AppError.js";
import minioClient, { bucketName } from "../config/minio.js";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import { buildAgentSystemPrompt } from "../utils/handoff.js";
import { Op } from "sequelize";

// --- HELPER: Upload to MinIO ---
const uploadToMinio = async (file) => {
  const fileName = `${uuidv4()}-${file.originalname.replace(/\s/g, "-")}`;
  await minioClient.putObject(bucketName, fileName, file.buffer);

  // Return Public URL (Sesuaikan dengan ENV Anda)
  // Contoh: http://localhost:9000/sapaku-agents/gambar.jpg
  const minioUrl =
    process.env.MINIO_PUBLIC_URL || `http://localhost:${process.env.MINIO_PORT || 9000}`;
  return `${minioUrl}/${bucketName}/${fileName}`;
};

const deleteFromMinio = async (imageUrl) => {
  if (!imageUrl) return;
  try {
    // Extract object name from URL
    // URL format: http://localhost:9000/sapaku-agents/uuid-filename.jpg
    const urlParts = imageUrl.split(`/${bucketName}/`);
    if (urlParts.length === 2) {
      const objectName = urlParts[1];
      await minioClient.removeObject(bucketName, objectName);
      console.log(`Deleted image from MinIO: ${objectName}`);
    }
  } catch (error) {
    console.error("Error deleting image from MinIO:", error);
    // Don't throw error, just log it
  }
};

// @desc    Get Agent Config for n8n Integration
// @route   GET /api/agents/integration/:waNumber
export const getAgentByWa = async (req, res) => {
  try {
    const { waNumber } = req.params;

    // Cari agent berdasarkan nomor WA yg terdaftar
    const agent = await Agent.findOne({
      where: { whatsappNumber: waNumber, isActive: true },
      include: [KnowledgeSource], // Pastikan relasi diload
    });

    if (!agent) {
      return res.status(404).json({ message: "Agent not found or inactive" });
    }

    // Gabungkan semua deskripsi knowledge jadi satu teks konteks
    const knowledgeText = (agent.KnowledgeSources || [])
      .map((k) => k.description) // Description sudah HTML/Text dari Rich Text
      .join("\n\n---\n\n");

    res.json({
      systemInstruction: agent.systemInstruction,
      transferCondition: agent.transferCondition,
      welcomeMessage: agent.welcomeMessage,
      knowledgeContext: knowledgeText,
      // Kirim juga URL gambar knowledge jika perlu diproses vision model n8n
      knowledgeImages: (agent.KnowledgeSources || []).map((k) => k.imageUrl),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create Agent (Basic Info)
// @route   POST /api/agents
export const createAgent = async (req, res, next) => {
  try {
    // 1. Handle Upload Welcome Image (Jika ada)
    let welcomeImageUrl = null;
    if (req.files && req.files["welcomeImage"]) {
      const file = req.files["welcomeImage"][0];
      welcomeImageUrl = await uploadToMinio(file);
    }

    // 2. Ambil data dari body
    let {
      name,
      description,
      systemInstruction,
      welcomeMessage,
      transferCondition,
      whatsappNumber,
      isActive,
      followupConfig,
    } = req.body;

    if (Array.isArray(transferCondition)) {
      transferCondition = transferCondition[transferCondition.length - 1];
    }
    if (transferCondition && typeof transferCondition === "object") {
      transferCondition = JSON.stringify(transferCondition);
    }

    // 3. Helper: Parse JSON followupConfig
    // PENTING: Karena request ini pakai FormData (multipart/form-data),
    // objek nested seperti followupConfig akan diterima sebagai STRING JSON.
    let parsedFollowup = undefined; // Biarkan undefined agar Sequelize pakai defaultValue jika kosong

    if (followupConfig) {
      try {
        parsedFollowup =
          typeof followupConfig === "string" ? JSON.parse(followupConfig) : followupConfig;
      } catch (e) {
        console.error("Error parsing followupConfig on create:", e);
        // Jika error parse, kita biarkan undefined (fallback ke default DB)
      }
    }

    const agent = await Agent.create({
      name,
      description,
      systemInstruction,
      welcomeMessage,
      transferCondition,
      whatsappNumber,
      // Konversi string 'true'/'false' ke boolean
      isActive: isActive === "true" || isActive === true,
      welcomeImageUrl,
      // Masukkan config follow-up
      followupConfig: parsedFollowup,
      userId: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "AI Agent berhasil dibuat.",
      data: agent,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get All My Agents (with Pagination, Search, Filter, Sort)
// @route   GET /api/agents?page=1&limit=9&search=keyword&status=active&sortBy=name&sortOrder=asc
export const getMyAgents = async (req, res, next) => {
  try {
    // Extract query parameters
    const {
      page = 1,
      limit = 9,
      search,
      status,
      sortBy = "updatedAt",
      sortOrder = "desc",
    } = req.query;

    // Build where clause
    const where = { userId: req.user.id };

    // Add search filter (case-insensitive)
    if (search && search.trim()) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search.trim()}%` } },
        { description: { [Op.iLike]: `%${search.trim()}%` } },
      ];
    }

    // Add status filter
    if (status === "active") {
      where.isActive = true;
    } else if (status === "inactive") {
      where.isActive = false;
    }

    // Validate sortBy
    const validSortFields = ["name", "createdAt", "updatedAt"];
    const finalSortBy = validSortFields.includes(sortBy) ? sortBy : "updatedAt";
    const finalSortOrder = sortOrder.toLowerCase() === "asc" ? "ASC" : "DESC";

    // Calculate pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit))); // Max 100 per page
    const offset = (pageNum - 1) * limitNum;

    // Execute query with pagination
    const { count, rows: agents } = await Agent.findAndCountAll({
      where,
      include: [
        {
          model: KnowledgeSource,
          attributes: ["id", "title"], // Only include necessary fields
        },
      ],
      order: [[finalSortBy, finalSortOrder]],
      limit: limitNum,
      offset: offset,
    });

    const totalPages = Math.ceil(count / limitNum);

    res.status(200).json({
      success: true,
      data: agents,
      pagination: {
        total: count,
        page: pageNum,
        limit: limitNum,
        totalPages: totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Agent Detail (Include Knowledge)
// @route   GET /api/agents/:id
export const getAgentById = async (req, res, next) => {
  try {
    const agent = await Agent.findOne({
      where: { id: req.params.id, userId: req.user.id },
      include: [KnowledgeSource], // Include Data Knowledge
    });

    if (!agent) return next(new AppError("Agent tidak ditemukan.", 404));

    res.status(200).json({ success: true, data: agent });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Agent (General, System Prompt, Welcome Image)
// @route   PUT /api/agents/:id
export const updateAgent = async (req, res, next) => {
  try {
    const agent = await Agent.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!agent) return next(new AppError("Agent tidak ditemukan.", 404));

    // Handle Upload/Delete Welcome Image
    let newWelcomeImageUrl = agent.welcomeImageUrl;
    if (req.files && req.files["welcomeImage"]) {
      const file = req.files["welcomeImage"][0];
      // Delete old image if exists
      if (agent.welcomeImageUrl) {
        await deleteFromMinio(agent.welcomeImageUrl);
      }
      newWelcomeImageUrl = await uploadToMinio(file);
    } else if (req.body.removeWelcomeImage === "true") {
      // Flag to remove image
      if (agent.welcomeImageUrl) {
        await deleteFromMinio(agent.welcomeImageUrl);
      }
      newWelcomeImageUrl = null;
    }

    // Ambil fields dari body
    let {
      name,
      description,
      systemInstruction,
      welcomeMessage,
      transferCondition,
      whatsappNumber,
      isActive,
      followupConfig,
    } = req.body;

    if (Array.isArray(transferCondition)) {
      transferCondition = transferCondition[transferCondition.length - 1];
    }
    if (transferCondition && typeof transferCondition === "object") {
      transferCondition = JSON.stringify(transferCondition);
    }

    // Helper: Parse JSON jika dikirim sebagai string (karena FormData)
    let parsedFollowup = null;
    if (followupConfig) {
      try {
        parsedFollowup =
          typeof followupConfig === "string" ? JSON.parse(followupConfig) : followupConfig;
      } catch (e) {
        console.error("Error parsing followupConfig", e);
      }
    }

    // Update
    if (name) agent.name = name;
    if (description !== undefined) agent.description = description;
    if (systemInstruction !== undefined) agent.systemInstruction = systemInstruction;
    if (welcomeMessage !== undefined) agent.welcomeMessage = welcomeMessage;
    if (transferCondition !== undefined) agent.transferCondition = transferCondition;
    if (whatsappNumber !== undefined) agent.whatsappNumber = whatsappNumber;
    if (isActive !== undefined) agent.isActive = isActive === "true" || isActive === true;

    // Update Followup Config (JSONB)
    if (parsedFollowup) {
      agent.followupConfig = parsedFollowup;
    }

    agent.welcomeImageUrl = newWelcomeImageUrl;

    await agent.save();

    res.status(200).json({ success: true, message: "Agent berhasil diupdate.", data: agent });
  } catch (error) {
    next(error);
  }
};

// @desc    Add Knowledge Source (Image + Desc)
// @route   POST /api/agents/:id/knowledge
export const addKnowledge = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;

    if (!description) {
      return next(new AppError("Deskripsi konten wajib diisi.", 400));
    }

    const knowledge = await KnowledgeSource.create({
      agentId: id, // Gunakan 'id' yang dari params tadi
      title: title || "Untitled Resource",
      description: description,
    });

    res.status(201).json({ success: true, data: knowledge });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Knowledge Source
// @route   PUT /api/agents/knowledge/:knowledgeId
export const updateKnowledge = async (req, res, next) => {
  try {
    const { knowledgeId } = req.params;
    const { title, description } = req.body;

    const knowledge = await KnowledgeSource.findByPk(knowledgeId);

    if (!knowledge) {
      return next(new AppError("Knowledge source tidak ditemukan.", 404));
    }

    // Update fields
    knowledge.title = title || knowledge.title;
    knowledge.description = description || knowledge.description;

    await knowledge.save();

    res.status(200).json({ success: true, data: knowledge });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete Knowledge Source
// @route   DELETE /api/agents/knowledge/:knowledgeId
export const deleteKnowledge = async (req, res, next) => {
  try {
    // Cari knowledge dan pastikan agent-nya milik user yg login
    const knowledge = await KnowledgeSource.findByPk(req.params.knowledgeId, {
      include: {
        model: Agent,
        where: { userId: req.user.id },
      },
    });

    if (!knowledge) return next(new AppError("Data knowledge tidak ditemukan.", 404));

    await knowledge.destroy();
    res.status(200).json({ success: true, message: "Knowledge deleted." });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete Agent
// @route   DELETE /api/agents/:id
export const deleteAgent = async (req, res, next) => {
  try {
    const agent = await Agent.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!agent) return next(new AppError("Agent tidak ditemukan.", 404));

    await agent.destroy();
    res.status(200).json({ success: true, message: "Agent berhasil dihapus." });
  } catch (error) {
    next(error);
  }
};

// --- SPECIAL: N8N INTEGRATION ---
// @desc    Get Agent Config by WhatsApp Number (Untuk n8n)
// @route   GET /api/agents/integration/:waNumber
// Note: Endpoint ini sebaiknya diproteksi API Key, tapi untuk MVP kita public-kan dulu atau cek header custom
export const getIntegrationConfig = async (req, res, next) => {
  try {
    // n8n akan mengirim query: ?sessionId=mysession_01
    const { sessionId } = req.query;

    if (!sessionId) {
      return res.status(400).json({ message: "Session ID required" });
    }

    // 1. Cari Platform berdasarkan Session ID WAHA
    const platform = await ConnectedPlatform.findOne({
      where: {
        sessionId,
      },
      include: [
        {
          model: Agent,
          include: [
            KnowledgeSource, // Include Knowledge
            {
              model: User,
              attributes: ["id", "role", "subscriptionExpiry"], // Include User untuk check subscription
            },
          ],
        },
      ],
    });

    if (!platform || !platform.Agent) {
      return res.status(404).json({ message: "No active agent found for this session." });
    }

    const agent = platform.Agent;
    const user = agent.User;

    // Check subscription expiry for customer
    if (user && user.role === "customer") {
      if (!user.subscriptionExpiry) {
        return res.json({
          agentName: agent.name,
          systemInstruction:
            "SUBSCRIPTION_EXPIRED: Langganan belum diaktifkan. Jangan membalas pesan apapun. Output harus kosong.",
          welcomeMessage: "",
          welcomeImageUrl: null,
          knowledgeBase: "",
          isActive: false,
          disabledReason: "Subscription not activated",
          followupConfig: { isEnabled: false },
        });
      }

      const expiryDate = new Date(user.subscriptionExpiry);
      if (expiryDate < new Date()) {
        return res.json({
          agentName: agent.name,
          systemInstruction:
            "SUBSCRIPTION_EXPIRED: Langganan telah berakhir. Jangan membalas pesan apapun. Output harus kosong.",
          welcomeMessage: "",
          welcomeImageUrl: null,
          knowledgeBase: "",
          isActive: false,
          disabledReason: "Subscription expired",
          followupConfig: { isEnabled: false },
        });
      }
    }

    if (!agent.isActive) {
      return res.json({
        agentName: agent.name,
        systemInstruction:
          "AGENT_DISABLED: Jangan membalas pesan apapun. Output harus kosong.",
        welcomeMessage: "",
        welcomeImageUrl: null,
        knowledgeBase: "",
        isActive: false,
        disabledReason: "Agent is inactive",
        followupConfig: { isEnabled: false },
      });
    }

    // 2. Format Knowledge Base jadi satu teks
    const knowledgeText = (agent.KnowledgeSources || [])
      .map((k) => `[${k.title}]:\n${k.description}`)
      .join("\n\n---\n\n");

    const finalSystemPrompt = buildAgentSystemPrompt(
      agent.systemInstruction,
      agent.transferCondition,
      agent.welcomeMessage,
      agent.welcomeImageUrl,
    );

    // 3. Return JSON Config siap pakai untuk n8n
    res.json({
      agentId: agent.id, // Tambahkan agentId untuk logging
      agentName: agent.name,
      systemInstruction: finalSystemPrompt,
      welcomeMessage: agent.welcomeMessage,
      welcomeImageUrl: agent.welcomeImageUrl,
      knowledgeBase: knowledgeText,
      isActive: agent.isActive,
      // Sertakan Followup Config juga
      followupConfig: agent.followupConfig || { isEnabled: false },
      platformId: platform.id, // Tambahkan platformId untuk logging
    });
  } catch (error) {
    console.error("Integration Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// @desc    Test Chat Agent (Simulator)
// @route   POST /api/agents/:id/test-chat
export const testChatAgent = async (req, res, next) => {
  try {
    const {
      message,
      sessionId,
      systemInstruction,
      name,
      knowledgeBase,
      transferCondition,
      followupConfig,
    } = req.body;

    if (!message) return next(new AppError("Pesan tidak boleh kosong.", 400));
    if (!systemInstruction) return next(new AppError("System Instruction harus diisi.", 400));

    const N8N_SIMULATOR_URL = process.env.N8N_SIMULATOR_URL;
    if (!N8N_SIMULATOR_URL) return next(new AppError("Server AI belum dikonfigurasi.", 500));

    const uniqueSession = sessionId || `preview-${Date.now()}`;

    const finalSystemPrompt = buildAgentSystemPrompt(
      systemInstruction,
      transferCondition,
      req.body.welcomeMessage,
      req.body.welcomeImageUrl,
    );

    const payload = {
      mode: "simulation",
      sessionId: uniqueSession,
      message: message,
      agentConfig: {
        name: name || "Test Agent",
        systemInstruction: finalSystemPrompt,
        knowledgeBase: knowledgeBase || "",
        followupConfig: followupConfig || null,
      },
    };

    // Kirim ke n8n
    const response = await axios.post(N8N_SIMULATOR_URL, payload);
    const responseData = response.data;

    // --- LOGIC BARU: MENERIMA 'output' ---
    let aiResponse = "";

    // Cek apakah response berupa Array (Format [ { output: "..." } ])
    if (Array.isArray(responseData)) {
      aiResponse = responseData[0]?.output || responseData[0]?.reply || responseData[0]?.text;
    } else {
      // Cek apakah response berupa Object (Format { output: "..." })
      aiResponse = responseData?.output || responseData?.reply || responseData?.text;
    }

    if (!aiResponse) {
      console.warn("n8n Empty Response:", responseData);
      aiResponse = "Maaf, AI tidak merespon (Empty Output).";
    }

    // Kirim ke Frontend dengan key 'output' (SESUAI REQUEST ANDA)
    res.status(200).json({
      success: true,
      output: aiResponse, // <--- Kita kirim sebagai 'output'
    });
  } catch (error) {
    console.error("Simulator Error:", error.message);
    next(new AppError("Gagal menghubungi AI Brain.", 502));
  }
};
