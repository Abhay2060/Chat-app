import express from "express";
import { signup, login, logout, updateProfile } from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { arcjetProtection } from "../middleware/arcjet.middleware.js";
import { verifyOTP } from "../middleware/verifyOtp.js";
import { resendOTP, resendOtp } from "../controllers/otp.controller.js";

const router = express.Router();

router.use(arcjetProtection);
router.post("/verify-otp",verifyOTP);
router.post("/resend-otp",resendOTP);
router.post("/signup",signup);
router.post("/login", login);
router.post("/logout", logout);

router.put("/update-profile", protectRoute, updateProfile);

router.get("/check", protectRoute, (req, res) => res.status(200).json(req.user));

export default router;
