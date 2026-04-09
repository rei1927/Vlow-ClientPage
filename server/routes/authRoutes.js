import express from "express";
import {
  login,
  logout,
  forgotPassword,
  resetPasswordFinal,
  updatePassword,
  impersonateUser,
  stopImpersonating,
} from "../controllers/authController.js";

import {
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} from "../validators/authValidator.js";

// Import Handler Validasi Modular
import { runValidation } from "../validators/validatorHandler.js";

import { protect, authorize } from "../middlewares/authMiddleware.js";

const router = express.Router();

// --- Public Routes ---

// Login: Validasi Input -> Cek User -> Set Cookie
router.post("/login", loginValidator, runValidation, login);

// Logout: Hapus Cookie
router.get("/logout", logout);

// Forgot Password: Validasi Email -> Kirim Link
router.post("/forgot-password", forgotPasswordValidator, runValidation, forgotPassword);

// Reset Password Final: Validasi Password Baru -> Update DB -> Auto Login
router.put(
  "/reset-password/:resetToken",
  resetPasswordValidator,
  runValidation,
  resetPasswordFinal,
);

// --- Protected Routes (Butuh Login) ---

// Change Password: Cek Token Login -> Validasi Password Baru -> Update DB
router.put("/change-password", protect, resetPasswordValidator, runValidation, updatePassword);

// --- Impersonate Routes (Admin Only) ---

// Impersonate: Admin masuk sebagai User lain
router.post("/impersonate/:userId", protect, authorize("admin"), impersonateUser);

// Stop Impersonating: Kembali ke akun Admin
router.post("/stop-impersonate/:adminId", protect, stopImpersonating);

export default router;
