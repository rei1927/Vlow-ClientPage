import { body, param } from "express-validator";

export const validateCreateAgent = [
  body("name")
    .notEmpty()
    .withMessage("Nama Agent wajib diisi")
    .trim()
    .isLength({ min: 3 })
    .withMessage("Nama Agent minimal 3 karakter"),

  body("description").optional().trim(),

  // AI Behavior (System Prompt) - Max 15000
  body("systemInstruction")
    .optional()
    .trim()
    .isLength({ max: 15000 })
    .withMessage("AI Behavior maksimal 15.000 karakter"),

  // Welcome Message - Max 5000
  body("welcomeMessage")
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage("Welcome Message maksimal 5.000 karakter"),

  // Transfer Condition - Max 750
  body("transferCondition")
    .optional()
    .trim()
    .isLength({ max: 750 })
    .withMessage("Transfer Condition maksimal 750 karakter"),

  body("isActive").optional().toBoolean(), // Auto convert string "true" -> true
];

export const validateUpdateAgent = [
  param("id").isUUID().withMessage("ID Agent tidak valid"),

  // Gunakan aturan yang sama dengan create
  body("name").optional().trim().isLength({ min: 3 }),
  body("systemInstruction").optional().isLength({ max: 15000 }),
  body("welcomeMessage").optional().isLength({ max: 5000 }),
  body("transferCondition").optional().isLength({ max: 750 }),
  body("isActive").optional().toBoolean(),
];

export const validateAgentId = [param("id").isUUID().withMessage("ID Agent tidak valid")];
