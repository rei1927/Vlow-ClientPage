export const getDefaultHandoffConfig = () => ({
  enabled: false,
  keywords: [],
  conditionText: "",
  responseMessage: "",
});

export const parseHandoffConfig = (raw) => {
  const defaults = getDefaultHandoffConfig();
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
      return parseHandoffConfig(parsed);
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

export const serializeHandoffConfig = (config) => {
  const normalized = parseHandoffConfig(config);
  return JSON.stringify(normalized);
};

export const validateHandoffConfig = (config) => {
  const normalized = parseHandoffConfig(config);
  if (!normalized.enabled) return { isValid: true, message: "" };

  if (normalized.keywords.length < 1) {
    return {
      isValid: false,
      message: "Minimal 1 kata kunci diperlukan saat human handoff aktif.",
    };
  }

  return { isValid: true, message: "" };
};

export const buildHandoffPromptPreview = (basePrompt, config) => {
  const normalized = parseHandoffConfig(config);
  const prompt = basePrompt?.trim() || "Kamu adalah asisten virtual yang membantu.";
  if (!normalized.enabled) return prompt;

  const rules = [];
  rules.push("HUMAN HANDOFF RULES:");
  if (normalized.conditionText) {
    rules.push(`- Kondisi utama: ${normalized.conditionText}`);
  }
  if (normalized.keywords.length > 0) {
    rules.push(`- Kata kunci pemicu: ${normalized.keywords.join(", ")}`);
  }
  if (normalized.responseMessage) {
    rules.push(`- Pesan saat handoff: "${normalized.responseMessage}"`);
  }
  rules.push(
    '- Jika handoff diperlukan, balas user dengan pesan yang sopan, lalu tambahkan JSON di baris terakhir: {"escalate": true, "reason": "<alasan singkat>"}',
  );
  rules.push('- Jika tidak handoff, jangan sertakan "escalate": true.');

  return `${prompt}\n\n${rules.join("\n")}`;
};
