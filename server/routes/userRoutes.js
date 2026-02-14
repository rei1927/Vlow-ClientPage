import express from "express";
import {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} from "../controllers/userController.js";

// Import Middleware Proteksi
import { protect, authorize } from "../middlewares/authMiddleware.js";

// Import Rules Validasi (Hanya Rules)
import {
  validateCreateUser,
  validateUpdateUser,
  validateUserId,
  validateGetAllUsers,
} from "../validators/userValidator.js";

// Import Handler Validasi Modular (Shared Handler)
import { runValidation } from "../validators/validatorHandler.js";

const router = express.Router();

// --- GLOBAL PROTECTION (Semua endpoint butuh Login & Admin) ---
// Middleware ini akan berjalan untuk semua route di bawahnya
router.use(protect);
router.use(authorize("admin"));

// Route: /api/users
router
  .route("/")
  .get(validateGetAllUsers, runValidation, getAllUsers) // Get All dengan Filter/Page
  .post(validateCreateUser, runValidation, createUser); // Create User Baru

// Route: /api/users/:id
router
  .route("/:id")
  .get(validateUserId, runValidation, getUserById)
  .put(validateUserId, validateUpdateUser, runValidation, updateUser)
  .delete(validateUserId, runValidation, deleteUser);

export default router;
