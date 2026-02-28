import Agent from "../models/Agent.js";
import KnowledgeSource from "../models/KnowledgeSource.js";
import ConnectedPlatform from "../models/ConnectedPlatform.js";
import User from "../models/User.js";
import AppError from "../utils/AppError.js";
import minioClient, { bucketName, getPublicFileUrl } from "../config/minio.js";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import { buildAgentSystemPrompt } from "../utils/handoff.js";
import { Op } from "sequelize";

// --- HELPER: Upload to MinIO ---
const uploadToMinio = async (file) => {
  const fileName = `${uuidv4()}-${file.originalname.replace(/\s/g, "-")}`;
  await minioClient.putObject(bucketName, fileName, file.buffer);

  // Return Public URL (Sesuaikan dengan ENV Anda)
  // Contoh: http://localhost:9000/vlow-agents/gambar.jpg
  // Update: use the centralized getPublicFileUrl method to avoid localhost fallback issues
  return getPublicFileUrl(fileName);
};

const deleteFromMinio = async (imageUrl) => {
  if (!imageUrl) return;
  try {
    // Extract object name from URL
    // URL format: http://localhost:9000/vlow-agents/uuid-filename.jpg
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

    // Rewrite MinIO fileUrls to proxy URLs so frontend can render them
    const agentData = agent.toJSON();
    if (agentData.KnowledgeSources) {
      agentData.KnowledgeSources = agentData.KnowledgeSources.map(ks => {
        if (ks.fileUrl && ks.fileUrl.includes('minio.dayamedialangit.co.id')) {
          ks.fileUrl = `/api/agents/knowledge/proxy-image?url=${encodeURIComponent(ks.fileUrl)}`;
        }
        return ks;
      });
    }

    res.status(200).json({ success: true, data: agentData });
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
      handoverConfig,
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

    // Parse handoverConfig (JSONB)
    let parsedHandover = null;
    if (handoverConfig) {
      try {
        parsedHandover =
          typeof handoverConfig === "string" ? JSON.parse(handoverConfig) : handoverConfig;
      } catch (e) {
        console.error("Error parsing handoverConfig", e);
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

    // Update Handover Config (JSONB)
    if (parsedHandover) {
      agent.handoverConfig = parsedHandover;
    }

    agent.welcomeImageUrl = newWelcomeImageUrl;

    await agent.save();

    res.status(200).json({ success: true, message: "Agent berhasil diupdate.", data: agent });
  } catch (error) {
    next(error);
  }
};

// @desc    Add Knowledge Source (with optional file: image/PDF)
// @route   POST /api/agents/:id/knowledge
export const addKnowledge = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;

    if (!description) {
      return next(new AppError("Deskripsi konten wajib diisi.", 400));
    }

    let fileUrl = null;
    let fileName = null;
    let fileType = null;

    // Upload file to MinIO if present
    if (req.file) {
      const ext = req.file.originalname.split(".").pop();
      const objectName = `knowledge/${id}/${uuidv4()}.${ext}`;
      await minioClient.putObject(bucketName, objectName, req.file.buffer, req.file.size, {
        "Content-Type": req.file.mimetype,
      });
      fileUrl = getPublicFileUrl(objectName);
      fileName = req.file.originalname;
      fileType = req.file.mimetype;
    }

    const knowledge = await KnowledgeSource.create({
      agentId: id,
      title: title || "Untitled Resource",
      description: description,
      fileUrl,
      fileName,
      fileType,
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

    // Handle file replacement
    if (req.file) {
      // Delete old file from MinIO if exists
      if (knowledge.fileUrl) {
        try {
          const oldPath = knowledge.fileUrl.split(`${bucketName}/`)[1];
          if (oldPath) await minioClient.removeObject(bucketName, oldPath);
        } catch (e) {
          console.warn("Warning: could not delete old MinIO file:", e.message);
        }
      }
      // Upload new file
      const ext = req.file.originalname.split(".").pop();
      const objectName = `knowledge/${knowledge.agentId}/${uuidv4()}.${ext}`;
      await minioClient.putObject(bucketName, objectName, req.file.buffer, req.file.size, {
        "Content-Type": req.file.mimetype,
      });
      knowledge.fileUrl = getPublicFileUrl(objectName);
      knowledge.fileName = req.file.originalname;
      knowledge.fileType = req.file.mimetype;
    }

    // Update text fields
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

    // Delete file from MinIO if exists
    if (knowledge.fileUrl) {
      try {
        const filePath = knowledge.fileUrl.split(`${bucketName}/`)[1];
        if (filePath) await minioClient.removeObject(bucketName, filePath);
      } catch (e) {
        console.warn("Warning: could not delete MinIO file:", e.message);
      }
    }

    await knowledge.destroy();
    res.status(200).json({ success: true, message: "Knowledge deleted." });
  } catch (error) {
    next(error);
  }
};

// @desc    Proxy MinIO Image to bypass Cloudflare/NGINX HTML blocking
// @route   GET /api/agents/knowledge/proxy-image
export const proxyMinioImage = async (req, res, next) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).send("Missing url parameter");

    // Extract bucket and object path from the public MinIO URL
    // e.g. "https://minio.dayamedialangit.co.id/vlow-client/knowledge/xxx.jpeg"
    //   -> bucket: "vlow-client", objectName: "knowledge/xxx.jpeg"
    let targetBucket = bucketName; // default from env
    let objectName = null;

    if (url.includes('minio.dayamedialangit.co.id')) {
      const pathPart = url.split('minio.dayamedialangit.co.id/')[1];
      if (pathPart) {
        const slashIdx = pathPart.indexOf('/');
        if (slashIdx > 0) {
          targetBucket = pathPart.substring(0, slashIdx);
          objectName = pathPart.substring(slashIdx + 1);
        }
      }
    }

    if (!objectName) {
      return res.status(400).send("Could not parse object path from URL");
    }

    // Guess content type from extension
    const ext = objectName.split('.').pop()?.toLowerCase();
    const mimeMap = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp', pdf: 'application/pdf' };
    const contentType = mimeMap[ext] || 'application/octet-stream';

    // Use the already-configured minioClient SDK (correct endpoint, SSL, credentials)
    const stream = await minioClient.getObject(targetBucket, objectName);

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000');

    stream.pipe(res);

  } catch (error) {
    console.error("Proxy Image Error:", error.message);
    res.status(500).send("Internal Server Error proxying image.");
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
      .map((k) => {
        let text = `[${k.title}]:\n${k.description}`;
        if (k.fileUrl) {
          text += `\nAttached File (${k.fileName || 'file'}): ${k.fileUrl}`;
        }
        return text;
      })
      .join("\n\n---\n\n");

    // Use handoverConfig (new JSONB) or fall back to transferCondition (legacy TEXT)
    const handoffConfig = agent.handoverConfig?.enabled
      ? agent.handoverConfig
      : agent.transferCondition;

    // Inject knowledgeBase directly into system prompt so AI always sees it
    let enrichedInstruction = agent.systemInstruction || "";
    if (knowledgeText && knowledgeText.trim().length > 0) {
      enrichedInstruction += `\n\n=== KNOWLEDGE BASE (gunakan informasi ini untuk menjawab pertanyaan user) ===\n${knowledgeText}\n=== AKHIR KNOWLEDGE BASE ===`;
    }

    const finalSystemPrompt = buildAgentSystemPrompt(
      enrichedInstruction,
      handoffConfig,
      agent.welcomeMessage,
      agent.welcomeImageUrl,
    );

    // 3. Return JSON Config siap pakai untuk n8n
    res.json({
      agentId: agent.id,
      agentName: agent.name,
      systemInstruction: finalSystemPrompt,
      welcomeMessage: agent.welcomeMessage,
      welcomeImageUrl: agent.welcomeImageUrl,
      knowledgeBase: knowledgeText,
      isActive: agent.isActive,
      followupConfig: agent.followupConfig || { isEnabled: false },
      handoverConfig: agent.handoverConfig || { enabled: false },
      platformId: platform.id,
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

    const user = await User.findByPk(req.user.id);
    const N8N_SIMULATOR_URL = user?.n8nSimulatorWebhookUrl || process.env.N8N_SIMULATOR_URL;
    if (!N8N_SIMULATOR_URL) return next(new AppError("Server AI (Simulator) belum dikonfigurasi.", 500));

    const uniqueSession = sessionId || `preview-${Date.now()}`;

    // Inject knowledgeBase directly into system prompt so AI always sees it
    let enrichedInstruction = systemInstruction || "";
    if (knowledgeBase && knowledgeBase.trim().length > 0) {
      enrichedInstruction += `\n\n=== KNOWLEDGE BASE (gunakan informasi ini untuk menjawab pertanyaan user) ===\n${knowledgeBase}\n=== AKHIR KNOWLEDGE BASE ===`;
    }

    const finalSystemPrompt = buildAgentSystemPrompt(
      enrichedInstruction,
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
    console.log("=== N8N SIMULATOR REPLY ===", JSON.stringify(responseData, null, 2));

    // --- LOGIC: MENERIMA 'output' + 'welcome_image_url' ---
    let aiResponse = "";
    let imageUrl = null;

    const firstItem = Array.isArray(responseData) ? responseData[0] : responseData;

    // Kadang N8N membungkus dalam { json: { ... } } jika tidak ada explicit Respond to Webhook
    const n8nData = firstItem?.json ? firstItem.json : firstItem;

    aiResponse = n8nData?.output || n8nData?.reply || n8nData?.text || "";
    imageUrl = n8nData?.welcome_image_url || n8nData?.image_url || null;

    // Fallback: jika n8n tidak memisahkan image, coba extract dari teks AI
    if (!imageUrl && aiResponse) {
      const mdRegex = /\[([^\]]*)\]\((https?:\/\/[^\s)]+\.(?:png|jpg|jpeg|gif|webp|pdf)(?:\?[^\s)]*)?)\)/i;
      const rawRegex = /(https?:\/\/[^\s]+\.(?:png|jpg|jpeg|gif|webp|pdf)(?:\?[^\s]*)?)/i;
      const mdMatch = aiResponse.match(mdRegex);
      if (mdMatch) {
        imageUrl = mdMatch[2];
        aiResponse = aiResponse.replace(mdMatch[0], "").trim();
      } else {
        const rawMatch = aiResponse.match(rawRegex);
        if (rawMatch) {
          imageUrl = rawMatch[1];
          aiResponse = aiResponse.replace(rawMatch[0], "").trim();
        }
      }
    }

    if (!aiResponse && !imageUrl) {
      console.warn("n8n Empty Response:", responseData);
      aiResponse = "Maaf, AI tidak merespon (Empty Output).";
    }

    // Kirim ke Frontend dengan key 'output' + 'image_url'
    res.status(200).json({
      success: true,
      output: aiResponse,
      image_url: imageUrl, // <--- URL gambar dari knowledge resource
    });
  } catch (error) {
    console.error("Simulator Error:", error.message);
    next(new AppError("Gagal menghubungi AI Brain.", 502));
  }
};
