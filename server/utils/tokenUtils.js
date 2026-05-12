import jwt from "jsonwebtoken";

// Fungsi generate token (Private, hanya dipakai internal file ini)
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "1d",
  });
};

// Fungsi untuk response impersonation (Admin login sebagai User lain)
export const sendImpersonateResponse = (targetUser, adminUser, statusCode, res) => {
  // Generate token untuk TARGET user (bukan admin)
  const token = generateToken(targetUser.id);

  const cookieOptions = {
    expires: new Date(Date.now() + (process.env.JWT_COOKIE_EXPIRE || 30) * 24 * 60 * 60 * 1000),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === "production") {
    cookieOptions.secure = true;
  }

  res
    .status(statusCode)
    .cookie("token", token, cookieOptions)
    .json({
      success: true,
      token,
      isImpersonating: true,
      originalAdmin: {
        id: adminUser.id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
      },
      user: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        isFirstLogin: false, // Override: jangan force change password saat impersonate
        subscriptionExpiry: targetUser.subscriptionExpiry,
        maxConversations: targetUser.maxConversations,
        maxAiResponses: targetUser.maxAiResponses,
        features: targetUser.features,
      },
    });
};

// Fungsi utama untuk mengirim response (Token + Cookie + JSON)
export const sendTokenResponse = (user, statusCode, res) => {
  // 1. Buat Token
  const token = generateToken(user.id);

  // 2. Setup Opsi Cookie
  const cookieOptions = {
    expires: new Date(Date.now() + (process.env.JWT_COOKIE_EXPIRE || 30) * 24 * 60 * 60 * 1000),
    httpOnly: true, // Security: Mencegah XSS (JS client tidak bisa baca cookie)
  };

  // Security: Secure cookie hanya di Production (HTTPS)
  if (process.env.NODE_ENV === "production") {
    cookieOptions.secure = true;
  }

  // 3. Kirim Response
  res
    .status(statusCode)
    .cookie("token", token, cookieOptions) // Set Cookie
    .json({
      success: true,
      token, // Tetap dikirim di body sebagai opsi
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isFirstLogin: user.isFirstLogin,
        subscriptionExpiry: user.subscriptionExpiry,
        maxConversations: user.maxConversations,
        maxAiResponses: user.maxAiResponses,
        features: user.features,
        // Don't send n8nWebhookUrl to customer - security measure
        ...(user.role === "admin" ? { n8nWebhookUrl: user.n8nWebhookUrl } : {}),
      },
    });
};
