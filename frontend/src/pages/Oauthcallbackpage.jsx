import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useAuthStore } from "../store/useAuthStore";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

// This page handles the redirect from Google OAuth
// URL: /auth/callback?token=<tempToken>
// It exchanges the temp token for a real JWT cookie, then redirects to lobby
export default function OAuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    const token = searchParams.get("token");
    const error = searchParams.get("error");

    if (error || !token) {
      toast.error("Google sign-in failed. Please try again.");
      navigate("/login");
      return;
    }

    // Exchange temp token for real httpOnly JWT cookie
    axiosInstance.get(`/auth/google/token?token=${token}`)
      .then(async (res) => {
        // Cookie is now set — run checkAuth to load user into store
        await checkAuth();
        navigate("/");
      })
      .catch(() => {
        toast.error("Google sign-in failed. Please try again.");
        navigate("/login");
      });
  }, []);

  return (
    <div className="h-screen flex items-center justify-center bg-[#0d0d0f]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-zinc-400 text-sm">Signing you in with Google...</p>
      </div>
    </div>
  );
}