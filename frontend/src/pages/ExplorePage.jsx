import { useState, useEffect } from "react";
import { useNavigate }        from "react-router";
import { useRoomStore }       from "../store/useRoomStore";
import { useAuthStore }       from "../store/useAuthStore";
import { axiosInstance }      from "../lib/axios";
import RoomPasswordModal      from "../components/rooms/RoomPasswordModal";
import toast                  from "react-hot-toast";

// ─── Popular Room Card ────────────────────────────────────────────────────────
function PopularRoomCard({ room, rank, onJoin }) {
  const [hovered, setHovered] = useState(false);
  const accent = room.accentColor || "#4f8ef7";

  return (
    <div
      className="relative flex items-center gap-4 p-4 rounded-2xl border bg-[#111113] cursor-pointer transition-all duration-300"
      style={{
        borderColor: hovered ? `${accent}45` : "rgba(255,255,255,0.05)",
        boxShadow:   hovered ? `0 8px 32px ${accent}15` : "none",
        transform:   hovered ? "translateY(-2px)" : "translateY(0)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onJoin(room)}
    >
      {/* Rank badge */}
      <span
        className="absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black border border-white/10 bg-[#0d0d0f]"
        style={{ color: rank <= 3 ? accent : "#52525b" }}
      >
        {rank}
      </span>

      {/* Emoji */}
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
        style={{ background: `${accent}18` }}
      >
        {room.emoji || "💬"}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-white font-bold text-sm truncate">{room.name}</h3>
          {room.isPrivate && (
            <span className="text-[10px] text-zinc-500 flex-shrink-0">🔒</span>
          )}
        </div>
        {room.description && (
          <p className="text-zinc-600 text-xs mt-0.5 truncate">{room.description}</p>
        )}
        <div className="flex items-center gap-1.5 mt-1">
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: accent }} />
          <span className="text-xs text-zinc-500">{room.members?.length ?? 0} members</span>
        </div>
      </div>

      {/* Join arrow */}
      <span className="text-zinc-600 group-hover:text-white transition-colors flex-shrink-0 text-sm"
        style={{ color: hovered ? accent : undefined }}>
        →
      </span>
    </div>
  );
}

// ─── Explore Page ─────────────────────────────────────────────────────────────
export default function ExplorePage({ onJoin }) {
  const navigate = useNavigate();
  const { authUser } = useAuthStore();
  const { joinRoom, setActiveRoom } = useRoomStore();

  // Popular rooms
  const [popularRooms,    setPopularRooms]    = useState([]);
  const [popularLoading,  setPopularLoading]  = useState(true);

  // Code search
  const [code,            setCode]            = useState("");
  const [searching,       setSearching]       = useState(false);
  const [foundRoom,       setFoundRoom]       = useState(null);
  const [searchError,     setSearchError]     = useState("");

  // Password modal
  const [passwordRoom,    setPasswordRoom]    = useState(null);

  // ── Fetch popular rooms on mount ───────────────────────────────────────────
  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axiosInstance.get("/rooms/popular?limit=12");
        setPopularRooms(res.data);
      } catch {
        toast.error("Failed to load popular rooms");
      } finally {
        setPopularLoading(false);
      }
    };
    fetch();
  }, []);

  // ── Search by code ─────────────────────────────────────────────────────────
  const handleSearch = async (e) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;
    if (!/^\d{6}$/.test(trimmed)) {
      setSearchError("Code must be exactly 6 digits");
      setFoundRoom(null);
      return;
    }

    setSearching(true);
    setSearchError("");
    setFoundRoom(null);

    try {
      const res = await axiosInstance.get(`/rooms/code/${trimmed}`);
      const room = res.data;

      const isMember = room.members?.some(
        (m) => (m._id || m).toString() === authUser._id.toString()
      );

      if (room.isPrivate && !isMember) {
        // Private room — skip the result card, go straight to password modal
        setPasswordRoom(room);
      } else {
        // Public room or already a member — show result card
        setFoundRoom(room);
      }
    } catch (err) {
      setSearchError(err.response?.data?.message || "No room found with that code");
    } finally {
      setSearching(false);
    }
  };

  // ── Handle joining from search result (public rooms) or popular list ────────
  const handleJoin = async (room) => {
    if (onJoin) {
      onJoin(room);
      return;
    }

    // Private rooms from popular list — show password modal
    const isMember = room.members?.some(
      (m) => (m._id || m).toString() === authUser._id.toString()
    );
    if (room.isPrivate && !isMember) {
      setPasswordRoom(room);
      return;
    }

    await joinRoom(room._id);
    setActiveRoom(room);
    navigate(`/${room._id}`);
  };

  const handlePasswordSuccess = (updatedRoom) => {
    setPasswordRoom(null);
    setActiveRoom(updatedRoom);
    navigate(`/${updatedRoom._id}`);
  };

  return (
    <div
      className="min-h-screen bg-[#0d0d0f] text-white"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');`}</style>

      <div className="max-w-5xl mx-auto px-6 py-12 flex flex-col gap-14">

        {/* ── Back button ───────────────────────────────────────────────────── */}
        <button
          onClick={() => navigate("/")}
          className="self-start flex items-center gap-2 text-zinc-500 hover:text-white text-sm transition-colors"
        >
          ← Back to Lobby
        </button>

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <div className="text-center flex flex-col items-center gap-3">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Explore</p>
          <h1 className="text-5xl sm:text-6xl font-black tracking-tight leading-none">
            Find a Room
          </h1>
          <p className="text-zinc-500 text-sm max-w-sm">
            Enter a 6-digit room code to jump straight in, or browse the most popular rooms below.
          </p>
        </div>

        {/* ── Code Search ──────────────────────────────────────────────────── */}
        <div className="flex flex-col items-center gap-5">
          <form onSubmit={handleSearch} className="w-full max-w-sm flex flex-col gap-3">
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="Enter 6-digit code..."
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                  setSearchError("");
                  setFoundRoom(null);
                }}
                className="w-full px-5 py-4 rounded-2xl bg-[#1a1a1e] border border-white/10 text-white text-xl font-black tracking-[0.3em] text-center placeholder-zinc-700 outline-none focus:border-violet-500/50 transition-colors"
              />
            </div>

            {searchError && (
              <p className="text-red-400 text-xs text-center">{searchError}</p>
            )}

            <button
              type="submit"
              disabled={searching || code.length !== 6}
              className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm transition-colors"
            >
              {searching ? "Searching..." : "Find Room"}
            </button>
          </form>

          {/* ── Search Result ──────────────────────────────────────────────── */}
          {foundRoom && (
            <div className="w-full max-w-sm rounded-2xl border border-violet-500/30 bg-violet-500/5 p-5 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: `${foundRoom.accentColor || "#4f8ef7"}20` }}
                >
                  {foundRoom.emoji || "💬"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-bold truncate">{foundRoom.name}</h3>
                    <span className="text-xs text-zinc-500 flex-shrink-0">
                      {foundRoom.isPrivate ? "🔒 Private" : "🌐 Public"}
                    </span>
                  </div>
                  {foundRoom.description && (
                    <p className="text-zinc-500 text-xs mt-0.5 truncate">{foundRoom.description}</p>
                  )}
                  <p className="text-zinc-600 text-xs mt-1">
                    {foundRoom.members?.length ?? 0} members · by {foundRoom.createdBy?.fullName}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleJoin(foundRoom)}
                className="w-full py-2.5 rounded-xl font-bold text-sm transition-colors"
                style={{
                  background: `${foundRoom.accentColor || "#4f8ef7"}25`,
                  border: `1px solid ${foundRoom.accentColor || "#4f8ef7"}40`,
                  color: foundRoom.accentColor || "#4f8ef7",
                }}
              >
                {foundRoom.isPrivate ? "Enter Password & Join →" : "Join Room →"}
              </button>
            </div>
          )}
        </div>

        {/* ── Popular Rooms ─────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 mb-1">Most Popular</p>
            <h2 className="text-2xl font-black tracking-tight">Top Rooms</h2>
          </div>

          {popularLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1,2,3,4,5,6].map((i) => (
                <div key={i} className="h-20 rounded-2xl bg-[#111113] border border-white/5 animate-pulse" />
              ))}
            </div>
          ) : popularRooms.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-3 text-zinc-600">
              <span className="text-4xl">🏜️</span>
              <p className="text-sm">No rooms yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {popularRooms.map((room, i) => (
                <PopularRoomCard
                  key={room._id}
                  room={room}
                  rank={i + 1}
                  onJoin={handleJoin}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Password modal */}
      {passwordRoom && (
        <RoomPasswordModal
          room={passwordRoom}
          onSuccess={handlePasswordSuccess}
          onClose={() => setPasswordRoom(null)}
        />
      )}
    </div>
  );
}