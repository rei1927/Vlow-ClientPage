import nodemailer from "nodemailer";
import logger from "./logger.js";

const sendEmail = async (options) => {
  // 1. Buat Transporter (Konfigurasi SMTP)
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false, // true untuk port 465, false untuk port lain
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  // 2. Definisikan Opsi Email
  const message = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    // Kita juga bisa kirim HTML jika mau tampilan bagus
    html: options.html,
  };

  // 3. Kirim Email
  try {
    const info = await transporter.sendMail(message);
    logger.info(`Email sent: ${info.messageId}`);
  } catch (error) {
    logger.error(`Email send error: ${error.message}`);
    throw new Error("Email could not be sent");
  }
};

export default sendEmail;
