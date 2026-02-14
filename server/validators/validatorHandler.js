import { validationResult } from "express-validator";
import AppError from "../utils/AppError.js";

// Middleware Central untuk menangkap error validasi
export const runValidation = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // Ambil pesan error pertama saja agar respon bersih dan user tidak bingung
    const firstError = errors.array()[0].msg;

    // Lempar ke Global Error Handler
    return next(new AppError(firstError, 400));
  }

  next();
};
