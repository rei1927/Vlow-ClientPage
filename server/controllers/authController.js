import crypto from "crypto";
import { Op } from "sequelize";
import User from "../models/User.js";
import AppError from "../utils/AppError.js";
import sendEmail from "../utils/emailService.js";
import { getPasswordResetTemplate } from "../utils/emailTemplates.js";
import { sendTokenResponse } from "../utils/tokenUtils.js";

// --- Login User ---
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Cek apakah email dan password ada
    if (!email || !password) {
      return next(new AppError("Mohon masukkan email dan password.", 400));
    }

    // 2. Cari User dan Include Password (karena select false defaultnya jika ada)
    const user = await User.findOne({ where: { email } });

    // 3. Validasi User & Password
    if (!user || !(await user.matchPassword(password))) {
      return next(new AppError("Email atau password salah.", 401));
    }

    // 4. Cek Status Aktif
    if (!user.isActive) {
      return next(new AppError("Akun Anda dinonaktifkan. Silakan hubungi Admin.", 403));
    }

    // 5. Kirim Response (Panggil Utility Modular)
    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// --- Logout User (Clear Cookie) ---
export const logout = (req, res) => {
  res.cookie("token", "none", {
    expires: new Date(Date.now() + 10 * 1000), // Expire dalam 10 detik
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: "Berhasil logout.",
  });
};

// --- Update Password (First Login / User Profile) ---
export const updatePassword = async (req, res, next) => {
  try {
    const { password } = req.body;

    // User didapat dari middleware 'protect'
    const user = await User.findByPk(req.user.id);

    user.password = password; // Hash otomatis via hook
    user.isFirstLogin = false; // Matikan flag first login
    await user.save();

    // Opsional: Kirim token baru jika ingin memperpanjang sesi setelah ganti password
    // sendTokenResponse(user, 200, res);

    // Atau cukup response sukses saja:
    res.status(200).json({
      success: true,
      message: "Password berhasil diperbarui.",
    });
  } catch (error) {
    next(error);
  }
};

// --- Forgot Password ---
export const forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ where: { email: req.body.email } });
    if (!user) {
      return next(new AppError("Email tidak ditemukan.", 404));
    }

    // Generate Random Token
    const resetToken = crypto.randomBytes(20).toString("hex");

    // Hash token dan simpan ke DB
    user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 Menit
    await user.save();

    // Buat URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    const message = getPasswordResetTemplate(resetUrl);

    try {
      await sendEmail({
        email: user.email,
        subject: "Reset Password - Vlow.ai",
        html: message,
      });

      res.status(200).json({
        success: true,
        message: "Email instruksi reset password telah dikirim.",
      });
    } catch (err) {
      user.resetPasswordToken = null;
      user.resetPasswordExpire = null;
      await user.save();
      return next(new AppError("Gagal mengirim email. Silakan coba lagi.", 500));
    }
  } catch (error) {
    next(error);
  }
};

// --- Reset Password Final ---
export const resetPasswordFinal = async (req, res, next) => {
  try {
    // Hash token dari URL untuk dicocokkan dengan DB
    const hashedToken = crypto.createHash("sha256").update(req.params.resetToken).digest("hex");

    const user = await User.findOne({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpire: { [Op.gt]: Date.now() }, // Cek kadaluarsa
      },
    });

    if (!user) {
      return next(new AppError("Token tidak valid atau sudah kadaluarsa.", 400));
    }

    // Set password baru
    user.password = req.body.password;
    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;
    user.isFirstLogin = false; // Reset password dianggap sudah validasi user
    await user.save();

    // Langsung login user (Kirim Token & Cookie)
    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};
