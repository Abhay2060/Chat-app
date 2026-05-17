import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { useRoomStore }   from "../../store/useRoomStore";
import { useAuthStore }   from "../../store/useAuthStore";
import { useFriendStore } from "../../store/useFriendStore";
import FriendRequestsPanel from "./FriendRequestsPanel";

// ─── Friends Dropdown ─────────────────────────────────────────────────────────
function FriendsDropdown() {
  const { friends, getFriends } = useFriendStore();
  const { onlineUsers } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => { getFriends(); }, []);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const onlineCount = friends.filter((f) => onlineUsers.includes(f._id)).length;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen((v) => !v)}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 flex items-center gap-2 ${
          isOpen ? "text-white bg-white/10" : "text-zinc-400 hover:text-white hover:bg-white/5"
        }`}
      >
        Friends
        {friends.length > 0 && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 font-bold">
            {friends.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-11 left-0 w-64 bg-[#111113] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">

          {/* Header */}
          <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-white text-sm font-bold">Friends</h3>
            {onlineCount > 0 && (
              <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                {onlineCount} online
              </span>
            )}
          </div>

          {/* List */}
          <div className="max-h-72 overflow-y-auto py-1">
            {friends.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2 text-zinc-600">
                <span className="text-3xl">👥</span>
                <p className="text-xs">No friends yet</p>
                <p className="text-[11px] text-zinc-700">Add friends from room member lists</p>
              </div>
            ) : (
              friends.map((friend) => {
                const isOnline = onlineUsers.includes(friend._id);
                return (
                  <div key={friend._id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.04] transition-colors">
                    <div className="relative flex-shrink-0">
                      <div className="w-8 h-8 rounded-xl overflow-hidden bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400">
                        {friend.profilePic
                          ? <img src={friend.profilePic} alt={friend.fullName} className="w-full h-full object-cover" />
                          : friend.fullName?.charAt(0).toUpperCase()
                        }
                      </div>
                      <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#111113] ${isOnline ? "bg-emerald-400" : "bg-zinc-600"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{friend.fullName}</p>
                      <p className="text-[11px] text-zinc-500">{isOnline ? "Online" : "Offline"}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Header ──────────────────────────────────────────────────────────────
export default function RoomsHeader() {
  const navigate = useNavigate();
  const { rooms } = useRoomStore();
  const { logout } = useAuthStore();
  const totalMembers = rooms.reduce((sum, r) => sum + (r.members?.length ?? 0), 0);

  return (
    <header className="w-full border-b border-white/5 bg-[#0d0d0f]/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">

        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-lg shadow-lg shadow-violet-500/20">
            💠
          </div>
          <span className="text-white font-black text-xl tracking-tight">
            Chat<span className="text-violet-400">Rooms</span>
          </span>
        </div>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-1">
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-all duration-150"
          >
            Rooms
          </button>
          {/* Explore — now navigates to /explore */}
          <button
            onClick={() => navigate("/explore")}
            className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-all duration-150"
          >
            Explore
          </button>
          <button
            onClick={() => navigate("/chat")}
            className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-all duration-150 flex items-center gap-1.5"
          >
            💬 DMs
          </button>
          <FriendsDropdown />
        </nav>

        {/* Right */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 text-xs font-semibold">{totalMembers.toLocaleString()} members</span>
          </div>

          {/* Friend request bell */}
          <FriendRequestsPanel />

          {/* Profile / Dashboard */}
          <button
            onClick={() => navigate("/dashboard")}
            className="w-9 h-9 rounded-xl bg-zinc-800 border border-white/10 flex items-center justify-center hover:bg-zinc-700 transition-colors text-base"
            title="Dashboard"
          >
            👤
          </button>

          {/* Logout */}
          <button
            onClick={logout}
            className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center hover:bg-red-500/20 transition-colors text-base"
            title="Logout"
          >
            🚪
          </button>
        </div>
      </div>
    </header>
  );
}