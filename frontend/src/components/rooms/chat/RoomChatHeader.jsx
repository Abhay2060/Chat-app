import { useState, useRef, useEffect } from "react";
import { useNavigate }   from "react-router";
import { useRoomStore }  from "../../../store/useRoomStore";
import { useAuthStore }  from "../../../store/useAuthStore";
import { axiosInstance } from "../../../lib/axios";
import toast             from "react-hot-toast";

// ─── Room Info Dropdown ───────────────────────────────────────────────────────
// Shows room code + password (for private rooms) to all members
function RoomInfoDropdown({ room }) {
  const [isOpen,       setIsOpen]       = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [password,     setPassword]     = useState(null);   // fetched on demand
  const [loadingPass,  setLoadingPass]  = useState(false);
  const ref = useRef(null);

  const accent = room.accentColor || "#4f8ef7";

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false);
        setShowPassword(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Fetch plain-text password from backend when user clicks "Show Password"
  // We add a dedicated endpoint for this — only members can access it
  const handleShowPassword = async () => {
    if (password !== null) {
      setShowPassword((v) => !v);
      return;
    }
    setLoadingPass(true);
    try {
      const res = await axiosInstance.get(`/rooms/${room._id}/room-info`);
      setPassword(res.data.password || "—");
      setShowPassword(true);
    } catch {
      toast.error("Failed to load room info");
    } finally {
      setLoadingPass(false);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen((v) => !v)}
        title="Room Info"
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
          isOpen
            ? "text-white bg-white/10"
            : "text-zinc-400 hover:text-white hover:bg-white/5"
        }`}
      >
        <span>🔑</span>
        <span className="hidden sm:inline">Room Info</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-11 w-72 bg-[#111113] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">

          {/* Header */}
          <div className="px-4 py-3 border-b border-white/5 flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
              style={{ background: `${accent}20` }}
            >
              {room.emoji || "💬"}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-bold truncate">{room.name}</p>
              <p className="text-zinc-600 text-[11px]">
                {room.isPrivate ? "🔒 Private Room" : "🌐 Public Room"}
              </p>
            </div>
          </div>

          {/* Room Code */}
          <div className="px-4 py-3 border-b border-white/5">
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-2">
              Room Code
            </p>
            <div className="flex items-center justify-between gap-2 bg-[#1a1a1e] rounded-xl px-3 py-2.5">
              <span
                className="text-2xl font-black tracking-[0.25em]"
                style={{ color: accent }}
              >
                {room.roomCode || "------"}
              </span>
              <button
                onClick={() => copyToClipboard(room.roomCode, "Room code")}
                className="text-zinc-500 hover:text-white transition-colors text-xs px-2 py-1 rounded-lg hover:bg-white/5"
                title="Copy code"
              >
                Copy
              </button>
            </div>
            <p className="text-zinc-700 text-[11px] mt-2">
              Share this code so others can find and join the room on the Explore page.
            </p>
          </div>

          {/* Password — only shown for private rooms */}
          {room.isPrivate && (
            <div className="px-4 py-3">
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-2">
                Room Password
              </p>
              <div className="flex items-center justify-between gap-2 bg-[#1a1a1e] rounded-xl px-3 py-2.5">
                <span className="text-sm font-mono text-zinc-300 flex-1 min-w-0 truncate">
                  {loadingPass
                    ? "Loading..."
                    : showPassword && password
                    ? password
                    : "••••••••"
                  }
                </span>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {showPassword && password && password !== "—" && (
                    <button
                      onClick={() => copyToClipboard(password, "Password")}
                      className="text-zinc-500 hover:text-white transition-colors text-xs px-2 py-1 rounded-lg hover:bg-white/5"
                    >
                      Copy
                    </button>
                  )}
                  <button
                    onClick={handleShowPassword}
                    disabled={loadingPass}
                    className="text-zinc-500 hover:text-white transition-colors text-xs px-2 py-1 rounded-lg hover:bg-white/5 disabled:opacity-40"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Room Chat Header ─────────────────────────────────────────────────────────
export default function RoomChatHeader({ onToggleMembers }) {
  const navigate = useNavigate();
  const { activeRoom } = useRoomStore();
  const { onlineUsers } = useAuthStore();

  if (!activeRoom) return null;

  const onlineMembersCount = activeRoom.members?.filter((m) =>
    onlineUsers.includes(m._id || m)
  ).length ?? 0;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#111113] flex-shrink-0">

      {/* Left: back + room info */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/")}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-colors"
        >
          ←
        </button>

        {/* Room emoji + name */}
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: `${activeRoom.accentColor || "#4f8ef7"}20` }}
        >
          {activeRoom.emoji || "💬"}
        </div>

        <div>
          <h2 className="text-white font-bold text-sm leading-tight">{activeRoom.name}</h2>
          <p className="text-zinc-500 text-xs">
            {activeRoom.members?.length ?? 0} members · {onlineMembersCount} online
          </p>
        </div>
      </div>

      {/* Right: room info dropdown + members toggle */}
      <div className="flex items-center gap-1">
        {/* Room Info — visible to all members */}
        <RoomInfoDropdown room={activeRoom} />

        {/* Members toggle */}
        <button
          onClick={onToggleMembers}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors text-sm"
        >
          <span>👥</span>
          <span className="hidden sm:inline text-xs font-medium">Members</span>
        </button>
      </div>
    </div>
  );
}