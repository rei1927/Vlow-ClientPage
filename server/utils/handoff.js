const normalizeHandoffConfig = (raw) => {
  const defaults = {
    enabled: false,
    keywords: [],
    conditionText: "",
    responseMessage: "",
  };

  if (!raw) return defaults;

  if (typeof raw === "object") {
    return {
      enabled: !!raw.enabled,
      keywords: Array.isArray(raw.keywords)
        ? raw.keywords.map((k) => String(k).trim()).filter(Boolean)
        : [],
      conditionText: raw.conditionText ? String(raw.conditionText).trim() : "",
      responseMessage: raw.responseMessage ? String(raw.responseMessage).trim() : "",
    };
  }

  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return normalizeHandoffConfig(parsed);
    } catch (error) {
      const legacyText = raw.trim();
      return {
        ...defaults,
        enabled: !!legacyText,
        conditionText: legacyText,
      };
    }
  }

  return defaults;
};

const buildHandoffSystemPrompt = (basePrompt, rawConfig) => {
  const config = normalizeHandoffConfig(rawConfig);
  if (!config.enabled) return basePrompt;

  const rules = [];
  rules.push("HUMAN HANDOFF RULES:");
  if (config.conditionText) {
    rules.push(`- Kondisi utama: ${config.conditionText}`);
  }
  if (config.keywords.length > 0) {
    rules.push(`- Kata kunci pemicu: ${config.keywords.join(", ")}`);
  }
  if (config.responseMessage) {
    rules.push(`- Pesan saat handoff: "${config.responseMessage}"`);
  }

  // Add escalation prompt if configured
  const escalationPrompt = typeof rawConfig === "object" ? rawConfig?.escalationPrompt : null;
  if (escalationPrompt && escalationPrompt.trim()) {
    rules.push("");
    rules.push("AI ESCALATION RULES:");
    rules.push("Kamu HARUS mendeteksi kondisi berikut dari percakapan dan jika terpenuhi, sertakan {\"escalate\": true} di response JSON:");
    rules.push(escalationPrompt.trim());
  }

  rules.push(
    '- Jika handoff diperlukan, balas user dengan pesan yang sopan, lalu tambahkan JSON di baris terakhir: {"escalate": true, "reason": "<alasan singkat>"}',
  );
  rules.push('- Jika tidak handoff, jangan sertakan "escalate": true.');

  return `${basePrompt}\n\n${rules.join("\n")}`;
};

const appendWelcomeRules = (basePrompt, welcomeMessage, welcomeImageUrl) => {
  if (!welcomeMessage && !welcomeImageUrl) return basePrompt;

  const rules = [];
  rules.push("WELCOME RULES:");
  rules.push(
    "- Jika ini adalah balasan asisten pertama pada sesi ini, kirimkan welcome message di awal.",
  );
  if (welcomeMessage) {
    rules.push(`- Welcome message: "${welcomeMessage}"`);
  }
  if (welcomeImageUrl) {
    rules.push(
      `- Jika perlu menampilkan gambar sapaan, tulis URL ini di baris terpisah dengan format "WELCOME_IMAGE_URL: ${welcomeImageUrl}"`,
    );
  }

  return `${basePrompt}\n\n${rules.join("\n")}`;
};

const buildLeadQualificationPrompt = (basePrompt, leadConfig) => {
  if (!leadConfig || !leadConfig.enabled) return basePrompt;

  const rules = [];
  rules.push("LEAD QUALIFICATION RULES:");
  rules.push("Kamu HARUS mendeteksi suhu minat prospek dari percakapan dan menyertakan {\"lead_temperature\": \"<suhu>\"} di response JSON pada baris terakhir.");
  rules.push("Pilih suhu berikut (gunakan UPPERCASE):");
  if (leadConfig.coldLabelId) rules.push("- COLD: Saat prospek baru menyapa, basa-basi, atau tanya hal dasar.");
  if (leadConfig.warmLabelId) rules.push("- WARM: Saat prospek mulai tanya spesifikasi, harga, atau detail lebih lanjut.");
  if (leadConfig.hotLabelId) rules.push("- HOT: Saat prospek siap beli, minta invoice, janji meeting, atau menunjukkan minat sangat kuat.");
  rules.push("Contoh JSON: {\"lead_temperature\": \"WARM\"}");

  return `${basePrompt}\n\n${rules.join("\n")}`;
};

const buildAgentSystemPrompt = (basePrompt, handoffConfig, welcomeMessage, welcomeImageUrl, leadQualificationConfig) => {
  const base = basePrompt || "Kamu adalah asisten virtual yang membantu.";
  const withWelcome = appendWelcomeRules(base, welcomeMessage, welcomeImageUrl);
  const withHandoff = buildHandoffSystemPrompt(withWelcome, handoffConfig);
  return buildLeadQualificationPrompt(withHandoff, leadQualificationConfig);
};

export { normalizeHandoffConfig, buildHandoffSystemPrompt, buildAgentSystemPrompt };
