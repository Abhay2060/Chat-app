import "dotenv/config";
import nodemailer from "nodemailer";

// Create a transporter using SMTP (Port 587 with STARTTLS for cloud deployment)
export const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // false for port 587 (uses STARTTLS)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendTestEmail(email, otp) {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: email,
      subject: "Verification of your Email ID",
      text: `Your OTP is: ${otp}`,
    });

    console.log("Email sent successfully ✅");
  } catch (error) {
    console.error("Error sending email:", error.message);
  }
}
