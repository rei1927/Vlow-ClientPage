import { body, param, query } from "express-validator";

// --- Rules Validasi User Management ---

export const validateCreateUser = [
  body("name")
    .notEmpty()
    .withMessage("Nama user wajib diisi")
    .isLength({ min: 3 })
    .withMessage("Nama minimal 3 karakter"),

  body("email")
    .notEmpty()
    .withMessage("Email wajib diisi")
    .isEmail()
    .withMessage("Format email tidak valid")
    .normalizeEmail(),

  body("role").optional().isIn(["admin", "customer"]).withMessage("Role harus admin atau customer"),
];

export const validateUpdateUser = [
  param("id").isUUID().withMessage("ID User tidak valid"),

  body("name").optional().isLength({ min: 3 }).withMessage("Nama minimal 3 karakter"),

  body("email").optional().isEmail().withMessage("Format email tidak valid"),

  body("role").optional().isIn(["admin", "customer"]).withMessage("Role tidak valid"),

  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("Status Active harus berupa boolean (true/false)"),
];

export const validateUserId = [param("id").isUUID().withMessage("Format ID User tidak valid")];

// Validasi untuk Query Parameters (Search, Sort, Pagination)
export const validateGetAllUsers = [
  query("page").optional().isInt({ min: 1 }).withMessage("Page harus angka positif"),

  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit harus antara 1 - 100"),

  query("role").optional().isIn(["admin", "customer"]).withMessage("Filter Role tidak valid"),

  query("order").optional().isIn(["ASC", "DESC"]).withMessage("Order harus ASC atau DESC"),
];
