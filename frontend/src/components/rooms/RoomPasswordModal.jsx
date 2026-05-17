import { useState } from "react";
import { axiosInstance } from "../../lib/axios";
import toast from "react-hot-toast";

/**
 * RoomPasswordModal
 *
 * Props:
 *   room      — the private room the user is trying to enter
 *   onSuccess — called with updated room object after correct password
 *   onClose   — called when user cancels
 */
export default function RoomPasswordModal({ room, onSuccess, onClose }) {
  const [password,    setPassword]    = useState("");
  const [showPass,    setShowPass]    = useState(false);
  const [isLoading,   setIsLoading]   = useState(false);
  const [error,       setError]       = useState("");

  const accent = room?.accentColor || "#4f8ef7";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim()) return;

    setIsLoading(true);
    setError("");

    try {
      const res = await axiosInstance.post(`/rooms/${room._id}/verify-password`, { password });
      toast.success(`Joined "${room.name}"!`);
      onSuccess(res.data);
    } catch (err) {
      const msg = err.response?.data?.message || "Something went wrong";
      setError(msg); // show inline error instead of toast for wrong password
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-sm bg-[#111113] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">

        {/* Top accent bar */}
        <div className="h-1 w-full" style={{ background: accent }} />

        {/* Body */}
        <div className="px-6 py-6 flex flex-col gap-5">

          {/* Room info */}
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ background: `${accent}20` }}
            >
              {room?.emoji || "🔒"}
            </div>
            <div>
              <h2 className="text-white font-bold text-base leading-tight">{room?.name}</h2>
              <p className="text-zinc-500 text-xs mt-0.5">This room is private · Enter password to join</p>
            </div>
          </div>

          {/* Password input */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2 block">
                Room Password
              </label>
              <div className="relative">
                <input
                  autoFocus
                  type={showPass ? "text" : "password"}
                  placeholder="Enter password..."
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-[#1a1a1e] text-white text-sm placeholder-zinc-600 outline-none transition-colors"
                  style={{
                    border: error
                      ? "1px solid rgba(239,68,68,0.5)"
                      : `1px solid ${password ? `${accent}50` : "rgba(255,255,255,0.05)"}`,
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-sm transition-colors"
                >
                  {showPass ? "🙈" : "👁️"}
                </button>
              </div>

              {/* Inline error */}
              {error && (
                <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
                  <span>✕</span> {error}
                </p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-3 mt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-sm font-semibold transition-colors border border-white/5"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !password.trim()}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: accent, boxShadow: `0 4px 16px ${accent}30` }}
              >
                {isLoading ? "Checking..." : "Enter Room →"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}