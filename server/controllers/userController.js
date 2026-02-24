import crypto from "crypto";
import { Op } from "sequelize"; // Penting untuk Search & Filter
import User from "../models/User.js";
import AppError from "../utils/AppError.js";
import sendEmail from "../utils/emailService.js";
import { getWelcomeTemplate } from "../utils/emailTemplates.js";

// @desc    Create User (Admin Invite)
// @route   POST /api/users
export const createUser = async (req, res, next) => {
  try {
    const { name, email, role, subscriptionExpiry, maxPlatforms, n8nWebhookUrl, n8nSimulatorWebhookUrl } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return next(new AppError("Email ini sudah terdaftar dalam sistem.", 400));
    }

    // Generate Secure Random Password
    const randomHex = crypto.randomBytes(4).toString("hex");
    const tempPassword = `${randomHex}Vlow!`; // Contoh: a1b2c3d4Vlow!

    // Calculate subscription expiry date (only for customer)
    let finalExpiry = null;
    if (role === "customer" && subscriptionExpiry) {
      const expiryDate = new Date(subscriptionExpiry);
      expiryDate.setHours(23, 59, 59, 999); // Set ke akhir hari dari tanggal yang dipilih
      finalExpiry = expiryDate;
    }

    const user = await User.create({
      name,
      email,
      password: tempPassword,
      role: role || "customer",
      isFirstLogin: true,
      isActive: true,
      maxPlatforms: parseInt(maxPlatforms) || 1,
      n8nWebhookUrl: n8nWebhookUrl || null,
      n8nSimulatorWebhookUrl: n8nSimulatorWebhookUrl || null,
      subscriptionExpiry: finalExpiry,
    });

    // Kirim Email Welcome
    const loginUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/login`;
    const emailHtml = getWelcomeTemplate(name, email, tempPassword, loginUrl);

    let emailStatus = "Sent";
    try {
      await sendEmail({
        email: user.email,
        subject: "Selamat Datang di Vlow.ai - Kredensial Akses",
        html: emailHtml,
      });
    } catch (error) {
      emailStatus = "Failed";
      // Log error internal, tapi jangan fail request creation user
      console.error("Email Error:", error.message);
    }

    // Reload user to get all fields including subscriptionExpiry
    await user.reload();

    res.status(201).json({
      success: true,
      message: "User berhasil ditambahkan dan email undangan telah dikirim.",
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isFirstLogin: user.isFirstLogin,
        isActive: user.isActive,
        maxPlatforms: user.maxPlatforms,
        subscriptionExpiry: user.subscriptionExpiry,
        n8nWebhookUrl: user.n8nWebhookUrl,
        n8nSimulatorWebhookUrl: user.n8nSimulatorWebhookUrl,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get All Users (Search, Filter, Sort, Pagination)
// @route   GET /api/users
export const getAllUsers = async (req, res, next) => {
  try {
    // 1. Setup Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // 2. Setup Sorting
    const sortBy = req.query.sortBy || "createdAt"; // Default sort by tanggal buat
    const order = req.query.order || "DESC"; // Default Descending (Terbaru)

    // 3. Setup Filtering & Searching
    const { search, role, isActive } = req.query;
    const whereClause = {};

    // Filter by Role
    if (role) {
      whereClause.role = role;
    }

    // Filter by Active Status
    if (isActive !== undefined) {
      whereClause.isActive = isActive === "true";
    }

    // Search (Case Insensitive di PostgreSQL menggunakan Op.iLike)
    // Jika DB anda MySQL gunakan Op.like
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }

    // 4. Execute Query
    const { count, rows } = await User.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ["password", "resetPasswordToken", "resetPasswordExpire"] },
      order: [[sortBy === "subscriptionExpiry" ? "subscriptionExpiry" : sortBy, order]],
      limit: limit,
      offset: offset,
    });

    // 5. Build Response Meta
    res.status(200).json({
      success: true,
      data: rows,
      meta: {
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        itemsPerPage: limit,
        hasNextPage: page * limit < count,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Single User
// @route   GET /api/users/:id
export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ["password", "resetPasswordToken", "resetPasswordExpire"] },
    });

    if (!user) {
      return next(new AppError("User tidak ditemukan.", 404));
    }

    // Don't send n8nWebhookUrl to customer (security)
    const userData = user.toJSON();
    if (userData.role === "customer") {
      delete userData.n8nWebhookUrl;
      delete userData.n8nSimulatorWebhookUrl;
    }

    res.status(200).json({
      success: true,
      data: userData,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update User
// @route   PUT /api/users/:id
export const updateUser = async (req, res, next) => {
  try {
    const { name, role, isActive, subscriptionExpiry, maxPlatforms, n8nWebhookUrl, n8nSimulatorWebhookUrl, maxConversations, maxAiResponses, resetQuota } = req.body;

    const user = await User.findByPk(req.params.id);
    if (!user) {
      return next(new AppError("User tidak ditemukan.", 404));
    }

    // Proteksi: Admin tidak boleh menonaktifkan diri sendiri
    if (req.user.id === user.id && isActive === false) {
      return next(new AppError("Anda tidak dapat menonaktifkan akun sendiri.", 400));
    }

    // Update fields
    if (name) user.name = name;
    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;
    if (maxPlatforms !== undefined) user.maxPlatforms = parseInt(maxPlatforms) || 1;
    if (n8nWebhookUrl !== undefined) user.n8nWebhookUrl = n8nWebhookUrl || null;
    if (n8nSimulatorWebhookUrl !== undefined) user.n8nSimulatorWebhookUrl = n8nSimulatorWebhookUrl || null;

    // Set Max Limits for Customer
    if (role === "customer") {
      if (maxConversations !== undefined) user.maxConversations = parseInt(maxConversations) || 1;
      if (maxAiResponses !== undefined) user.maxAiResponses = parseInt(maxAiResponses) || 1;

      // Handle Quota Reset
      if (resetQuota === true) {
        user.quotaResetDate = new Date(); // Catat tanggal & waktu saat ini untuk titik referensi terbaru
      }
    }

    // Handle subscription expiry (only for customer)
    if (role === "customer" && subscriptionExpiry !== undefined) {
      if (subscriptionExpiry && subscriptionExpiry !== "") {
        const expiryDate = new Date(subscriptionExpiry);
        expiryDate.setHours(23, 59, 59, 999); // Set ke akhir hari
        user.subscriptionExpiry = expiryDate;
      } else {
        // Clear subscription if empty
        user.subscriptionExpiry = null;
      }
    } else if (role !== "customer") {
      // Clear subscription if role is not customer
      user.subscriptionExpiry = null;
    }

    await user.save();

    // Reload user to get updated data
    await user.reload();

    // DEBUG LOG: verify saved values
    console.log(`[updateUser] id=${user.id}, role=${role}, maxConversations=${user.maxConversations}, maxAiResponses=${user.maxAiResponses}, req.body.maxConversations=${maxConversations}`);

    res.status(200).json({
      success: true,
      message: resetQuota ? "Data user dan Kuota Pemakaian berhasil di-reset!" : "Data user berhasil diperbarui.",
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        maxPlatforms: user.maxPlatforms,
        subscriptionExpiry: user.subscriptionExpiry,
        maxConversations: user.maxConversations,
        maxAiResponses: user.maxAiResponses,
        quotaResetDate: user.quotaResetDate,
        n8nWebhookUrl: user.n8nWebhookUrl,
        n8nSimulatorWebhookUrl: user.n8nSimulatorWebhookUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete User
// @route   DELETE /api/users/:id
export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return next(new AppError("User tidak ditemukan.", 404));
    }

    // Proteksi: Admin tidak boleh menghapus diri sendiri
    if (req.user.id === user.id) {
      return next(new AppError("Anda tidak dapat menghapus akun sendiri.", 400));
    }

    await user.destroy();

    res.status(200).json({
      success: true,
      message: `User ${user.name} berhasil dihapus permanen.`,
    });
  } catch (error) {
    next(error);
  }
};
