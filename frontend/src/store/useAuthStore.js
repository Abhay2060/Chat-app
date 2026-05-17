import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:3000" : "/";

export const useAuthStore = create((set, get) => ({
  authUser:        null,
  isCheckingAuth:  true,
  isSigningUp:     false,
  isLoggingIn:     false,
  isVerifyingOtp:  false,
  isResendingOtp:  false,
  socket:          null,
  onlineUsers:     [],

  // holds the email between signup → OTP screens
  pendingEmail: null,

  // ── Auth check ────────────────────────────────────────────────────────────────

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");
      set({ authUser: res.data });
      get().connectSocket();
    } catch {
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  // ── Signup — sends OTP only, does NOT log user in yet ─────────────────────────

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      set({ pendingEmail: res.data.email });
      toast.success("Verification code sent to your email!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Signup failed");
    } finally {
      set({ isSigningUp: false });
    }
  },

  // ── Verify OTP — creates account if correct ───────────────────────────────────

  verifyOtp: async ({ email, otp }) => {
    set({ isVerifyingOtp: true });
    try {
      const res = await axiosInstance.post("/auth/verify-otp", { email, otp });
      set({ authUser: res.data, pendingEmail: null });
      toast.success("Account created successfully!");
      get().connectSocket();
      return null;
    } catch (error) {
      const data = error.response?.data;
      toast.error(data?.message || "Verification failed");
      return {
        attemptsLeft: data?.attemptsLeft,
        expired:      data?.expired,
        locked:       data?.locked,
      };
    } finally {
      set({ isVerifyingOtp: false });
    }
  },

  // ── Resend OTP ────────────────────────────────────────────────────────────────

  resendOtp: async (email) => {
    set({ isResendingOtp: true });
    try {
      await axiosInstance.post("/auth/resend-otp", { email });
      toast.success("New verification code sent!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to resend code");
    } finally {
      set({ isResendingOtp: false });
    }
  },

  // ── Login ─────────────────────────────────────────────────────────────────────

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data });
      toast.success("Logged in successfully");
      get().connectSocket();
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      set({ isLoggingIn: false });
    }
  },

  // ── Logout ────────────────────────────────────────────────────────────────────

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      toast.success("Logged out successfully");
      get().disconnectSocket();
    } catch {
      toast.error("Error logging out");
    }
  },

  // ── Update profile ────────────────────────────────────────────────────────────

  updateProfile: async (data) => {
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Update failed");
    }
  },

  // ── Socket ────────────────────────────────────────────────────────────────────

  connectSocket: () => {
    const { authUser } = get();
    if (!authUser || get().socket?.connected) return;
    const socket = io(BASE_URL, { withCredentials: true });
    socket.connect();
    set({ socket });
    socket.on("getOnlineUsers", (userIds) => set({ onlineUsers: userIds }));
  },

  disconnectSocket: () => {
    if (get().socket?.connected) get().socket.disconnect();
  },
}));