
import { generateToken } from "../lib/utils.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { ENV } from "../lib/env.js";
import cloudinary from "../lib/cloudinary.js";
import Tempuser from "../models/Tempuser.js";
import { sendTestEmail } from "../emails/emailHandlers.js";
import client from "../lib/redis.js";

// export const signup = async (req, res) => {
//   const { fullName, email, password } = req.body;

//   try {
//     // =========================
//     // ✅ VALIDATION
//     // =========================
//     if (!fullName || !email || !password) {
//       return res.status(400).json({ message: "All fields are required" });
//     }

//     if (password.length < 6) {
//       return res.status(400).json({
//         message: "Password must be at least 6 characters",
//       });
//     }

//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(email)) {
//       return res.status(400).json({ message: "Invalid email format" });
//     }

//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(400).json({ message: "Email already exists" });
//     }

//     const key = `user:${email}`;
//     const cachedUser = await client.get(key);

//     const otp = Math.floor(100000 + Math.random() * 900000);

//     // =========================
//     // ✅ CACHED USER FLOW
//     // =========================
//     if (cachedUser !== null) {
//       const data = JSON.parse(cachedUser);

//       // 🔒 Check block
//       if (data.blockedUntil && data.blockedUntil > Date.now()) {
//         return res.status(429).json({
//           message: "You are temporarily blocked. Try again later",
//         });
//       }

//       // 🔥 BLOCK LOGIC
//       if (data.verifyAttempts>= 3) {
//         const blockDuration = 10 * 60; // seconds

//         data.blockedUntil = Date.now() + blockDuration * 1000;

//         await client.set(key, JSON.stringify(data), {
//           EX: blockDuration, // ✅ simple & correct (your case)
//         });

//         return res.status(429).json({
//           message: "Too many attempts. Try again after 10 minutes",
//         });
//       }

//       data.otpAttempts = (data.otpAttempts || 0) + 1;
//       // 🔐 update password (optional for retry)
//       const salt = await bcrypt.genSalt(10);
//       data.password = await bcrypt.hash(password, salt);

//       // keep session alive (reset to 10 min again)
//       await client.set(key, JSON.stringify(data), {
//         KEEPTTL: true,
//       });

//     } else {
//       // =========================
//       // ✅ NEW USER FLOW
//       // =========================
//       const salt = await bcrypt.genSalt(10);
//       const hashedPassword = await bcrypt.hash(password, salt);

//       const userData = {
//         fullName,
//         email,
//         password: hashedPassword,
//         verifyAttempts: 0,
//         blockedUntil: null,    // ✅ initialized
//       };

//       const verifyData = {
//         verifyAttempts : 0,
//         blockedUntil: null
//       }

//       await client.set(key, JSON.stringify(userData), {
//         EX: 600, // 10 min session
//       });

//       await client.set(`verify:${email}`,JSON.stringify(verifyData),{ EX: 600});
//     }

//     // =========================
//     // ✅ COMMON OTP LOGIC
//     // =========================
//     await client.set(`otp:${email}`, otp, { EX: 300 });

//     sendTestEmail(email, otp);

//     return res.status(200).json({
//       message: "OTP sent",
//       email,
//     });

//   } catch (error) {
//     console.log("Error in signup:", error);
//     return res.status(500).json({ message: "Internal server error" });
//   }
// };

export const signup = async (req, res) => {
  const { fullName, email, password } = req.body;

  try {
    // =========================
    // ✅ VALIDATION
    // =========================
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const key = `user:${email}`;
    const cachedUser = await client.get(key);

    const otp = Math.floor(100000 + Math.random() * 900000);

    // =========================
    // ✅ CACHED USER FLOW
    // =========================
    if (cachedUser !== null) {
      const ttl = await client.ttl(`block:${email}`);
      
      if(ttl>0){
        return res.status(429).json({
          success:false,
          message:"you are temporarily blocked"
        })
      }
    }else{
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const userData = {
        fullName,
        email,
        password: hashedPassword,
      };

      await client.set(key, JSON.stringify(userData), {
        EX: 600, // 10 min session
      });
      await client.set(`verify:${email}`,0);
      await client.set(`block:${email}`,"1");
      await client.set(`resend_cool:${email}`,"1");
    }

    await client.set(`otp:${email}`, otp, { EX: 300 });

    sendTestEmail(email, otp);

    return res.status(200).json({
      message: "OTP sent",
      email
    });

  } catch (error) {
    console.log("Error in signup:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });
    // never tell the client which one is incorrect: password or email

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) return res.status(400).json({ message: "Invalid credentials" });

    generateToken(user._id, res);

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
    });
  } catch (error) {
    console.error("Error in login controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const logout = (_, res) => {
  res.cookie("jwt", "", {
    maxAge: 0,
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    secure: process.env.NODE_ENV === "production",
  });
  res.status(200).json({ message: "Logged out successfully" });
};

export const updateProfile = async (req, res) => {
  try {
    const { profilePic } = req.body;
    if (!profilePic) return res.status(400).json({ message: "Profile pic is required" });

    const userId = req.user._id;

    const uploadResponse = await cloudinary.uploader.upload(profilePic);

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePic: uploadResponse.secure_url },
      { new: true }
    );

    res.status(200).json(updatedUser);
  } catch (error) {
    console.log("Error in update profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
