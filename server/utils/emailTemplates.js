// Style dasar
const style = {
  container:
    "max-width: 600px; margin: 0 auto; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0;",
  header: "background-color: #1e293b; padding: 30px; text-align: center;",
  logoText: "color: #ffffff; font-size: 24px; font-weight: bold; text-decoration: none;",
  body: "padding: 40px 30px; color: #334155; line-height: 1.6;",
  h1: "font-size: 22px; font-weight: 700; color: #0f172a; margin-bottom: 20px;",
  p: "margin-bottom: 16px; font-size: 16px;",
  highlightBox:
    "background-color: #f1f5f9; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0; border-radius: 4px;",
  code: "font-family: monospace; font-weight: bold; font-size: 18px; color: #2563eb;",
  buttonContainer: "text-align: center; margin: 30px 0;",
  button:
    "background-color: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;",
  footer:
    "background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;",
};

// 1. Template Welcome (Akun Baru dibuat Admin)
export const getWelcomeTemplate = (name, email, password, loginUrl) => {
  return `
    <div style="${style.container}">
      <div style="${style.header}">
        <a href="#" style="${style.logoText}">Sapaku.ai</a>
      </div>
      <div style="${style.body}">
        <h1 style="${style.h1}">Selamat Datang, ${name}!</h1>
        <p style="${
          style.p
        }">Akun Anda telah berhasil dibuat oleh Administrator. Berikut adalah kredensial login Anda:</p>
        
        <div style="${style.highlightBox}">
          <p style="margin: 5px 0; font-size: 14px; color: #64748b;">Email Login:</p>
          <div style="${style.code}">${email}</div>
          <div style="height: 10px;"></div>
          <p style="margin: 5px 0; font-size: 14px; color: #64748b;">Password Sementara:</p>
          <div style="${style.code}">${password}</div>
        </div>

        <p style="${
          style.p
        }">Demi keamanan, Anda <strong>diwajibkan mengganti password</strong> ini saat pertama kali login.</p>

        <div style="${style.buttonContainer}">
          <a href="${loginUrl}" style="${style.button}">Login Sekarang</a>
        </div>
      </div>
      <div style="${style.footer}">
        <p>&copy; ${new Date().getFullYear()} Sapaku.ai Platform. All rights reserved.</p>
      </div>
    </div>
  `;
};

// 2. Template Reset Password
export const getPasswordResetTemplate = (resetUrl) => {
  return `
    <div style="${style.container}">
      <div style="${style.header}">
        <a href="#" style="${style.logoText}">Sapaku.ai</a>
      </div>
      <div style="${style.body}">
        <h1 style="${style.h1}">Permintaan Reset Password</h1>
        <p style="${
          style.p
        }">Kami menerima permintaan untuk mereset password akun Anda. Klik tombol di bawah ini untuk melanjutkan:</p>
        
        <div style="${style.buttonContainer}">
          <a href="${resetUrl}" style="${style.button}">Reset Password Saya</a>
        </div>
        
        <p style="${
          style.p
        }">Tautan ini hanya berlaku selama 10 menit. Jika Anda tidak merasa melakukan permintaan ini, abaikan saja email ini.</p>
      </div>
      <div style="${style.footer}">
        <p>&copy; ${new Date().getFullYear()} Sapaku.ai Platform. All rights reserved.</p>
      </div>
    </div>
  `;
};
