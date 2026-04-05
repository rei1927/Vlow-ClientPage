import { body } from "express-validator";

// --- Rules Validasi Auth ---

export const registerValidator = [
  body("name").notEmpty().withMessage("Nama wajib diisi"),

  body("email").isEmail().withMessage("Format email tidak valid").normalizeEmail(),

  body("password")
    .isLength({ min: 8 })
    .withMessage("Password minimal 8 karakter")
    .matches(/[A-Z]/)
    .withMessage("Password harus mengandung minimal 1 huruf besar")
    .matches(/[a-z]/)
    .withMessage("Password harus mengandung minimal 1 huruf kecil")
    .matches(/[\W_]/)
    .withMessage("Password harus mengandung minimal 1 simbol unik (!@#$%^&*)"),
];

export const loginValidator = [
  body("email").isEmail().withMessage("Format email tidak valid"),

  body("password").notEmpty().withMessage("Password wajib diisi"),
];

export const forgotPasswordValidator = [
  body("email").isEmail().withMessage("Format email tidak valid"),
];

export const resetPasswordValidator = [
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password minimal 8 karakter")
    .matches(/[A-Z]/)
    .withMessage("Password harus mengandung minimal 1 huruf besar")
    .matches(/[a-z]/)
    .withMessage("Password harus mengandung minimal 1 huruf kecil")
    .matches(/[\W_]/)
    .withMessage("Password harus mengandung minimal 1 simbol unik"),
];

export const updateProfilePasswordValidator = [
  body("oldPassword").notEmpty().withMessage("Password lama wajib diisi"),
  body("newPassword")
    .isLength({ min: 8 })
    .withMessage("Password baru minimal 8 karakter")
    .matches(/[A-Z]/)
    .withMessage("Password baru harus mengandung minimal 1 huruf besar")
    .matches(/[a-z]/)
    .withMessage("Password baru harus mengandung minimal 1 huruf kecil")
    .matches(/[0-9]/)
    .withMessage("Password baru harus mengandung minimal 1 angka")
    .matches(/[\W_]/)
    .withMessage("Password baru harus mengandung minimal 1 simbol unik"),
];
