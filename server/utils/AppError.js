class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true; // Menandakan ini error yang kita prediksi (bukan bug code)

    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
