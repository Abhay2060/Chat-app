import "dotenv/config";
import nodemailer from "nodemailer";

// Create a transporter using SMTP
export const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // use STARTTLS (upgrade connection to TLS after connecting)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendTestEmail(email,otp) {
  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: email, // put your email here
    subject: "verfication of your Email_Id",
    text: `this is Abhay${otp}`,
  });

  console.log("Email sent successfully ✅");
}
