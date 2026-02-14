import jwt from "jsonwebtoken";
import User from "../models/User.js";
import AppError from "../utils/AppError.js";

// Middleware untuk memproteksi Route (Harus Login)
export const protect = async (req, res, next) => {
  let token;

  // 1. PRIORITAS UTAMA: Cek Token dari Cookie (Mekanisme Web App kita)
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  // 2. OPSI KEDUA: Cek Header Authorization (Bearer)
  // (Berguna jika nanti test via Postman atau integrasi Mobile App)
  else if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  // Jika token tidak ditemukan sama sekali
  if (!token) {
    return next(new AppError("Sesi Anda telah berakhir atau Anda belum login.", 401));
  }

  try {
    // 3. Verifikasi Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Cari User di Database berdasarkan ID di token
    const currentUser = await User.findByPk(decoded.id, {
      attributes: { exclude: ["password"] }, // Jangan bawa password ke req.user
    });

    // Jika user sudah dihapus tapi token masih valid
    if (!currentUser) {
      return next(new AppError("User pemilik token ini sudah tidak ada.", 401));
    }

    // 5. Cek apakah user masih aktif
    if (!currentUser.isActive) {
      return next(new AppError("Akun Anda sedang dinonaktifkan.", 403));
    }

    // 6. SUKSES: Tempelkan data user ke request object agar bisa dipakai di controller berikutnya
    req.user = currentUser;
    next();
  } catch (error) {
    // Tangani error spesifik JWT
    if (error.name === "JsonWebTokenError") {
      return next(new AppError("Token tidak valid. Silakan login kembali.", 401));
    }
    if (error.name === "TokenExpiredError") {
      return next(new AppError("Sesi login telah kadaluarsa. Silakan login kembali.", 401));
    }
    return next(new AppError("Autentikasi gagal.", 401));
  }
};

// Middleware Authorization (Role Check)
// Tidak perlu diubah, tapi disertakan agar lengkap satu file
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError(`Role ${req.user.role} tidak memiliki akses ke fitur ini.`, 403));
    }
    next();
  };
};
