import "dotenv/config";

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

export async function sendTestEmail(email, otp) {
  try {
    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.SMTP_USER || "abhaykumar02006@gmail.com";
    const senderName = process.env.EMAIL_FROM_NAME || "Chatify";

    if (!apiKey) {
      console.error("BREVO_API_KEY is not defined in environment variables");
      return;
    }

    const response = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: {
          name: senderName,
          email: senderEmail,
        },
        to: [
          {
            email: email,
          },
        ],
        subject: "Your Chatify Verification Code",
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px;">
            <h2 style="color: #1e293b;">Email Verification</h2>
            <p style="color: #475569;">Use the code below to verify your email address. It expires in <strong>5 minutes</strong>.</p>
            <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #6366f1; text-align: center; padding: 16px 0;">
              ${otp}
            </div>
            <p style="color: #94a3b8; font-size: 12px;">If you didn't request this, you can safely ignore this email.</p>
          </div>
        `,
        textContent: `Your Chatify verification code is: ${otp}`,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Brevo API error:", data);
      return;
    }

    console.log("Email sent successfully via Brevo ✅ Message ID:", data.messageId);
  } catch (error) {
    console.error("Error sending email via Brevo:", error.message);
  }
}
