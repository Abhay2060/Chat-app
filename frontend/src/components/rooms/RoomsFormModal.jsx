import { useState } from "react";
import { useRoomStore } from "../../store/useRoomStore";

const EMOJI_OPTIONS = ["💬", "🎮", "🎨", "🎵", "💻", "🎬", "⚽", "🌊", "📚", "🍕", "🚀", "🎯"];
const COLOR_OPTIONS = [
  "#4f8ef7", "#e8533a", "#a259ff", "#f7c948",
  "#3ecf8e", "#f75e8e", "#ff9048", "#48c4ff",
];

export default function RoomFormModal({ room = null, onClose }) {
  const { createRoom, updateRoom, isCreatingRoom } = useRoomStore();
  const isEdit = Boolean(room);

  const [form, setForm] = useState({
    name:        room?.name        ?? "",
    description: room?.description ?? "",
    emoji:       room?.emoji       ?? "💬",
    accentColor: room?.accentColor ?? "#4f8ef7",
    isPrivate:   room?.isPrivate   ?? false,
    maxMembers:  room?.maxMembers  ?? 100,
    password:    "",
  });
  const [showPassword, setShowPassword] = useState(false);

  // Was already private when edit modal opened
  const wasAlreadyPrivate = isEdit && room?.isPrivate;
  // Need password if: creating private room OR editing and switching public→private
  const needsPassword = form.isPrivate && !wasAlreadyPrivate;

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handlePrivateToggle = () => {
    const next = !form.isPrivate;
    setForm((prev) => ({ ...prev, isPrivate: next, password: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    // Password required when making a room private (create or edit)
    if (needsPassword && !form.password.trim()) return;

    const payload = { ...form };
    // Only send password when actually setting private for first time
    if (!needsPassword) delete payload.password;

    const result = isEdit
      ? await updateRoom(room._id, payload)
      : await createRoom(payload);

    if (result) onClose(result);
  };

  const accent = form.accentColor;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose(null)}
    >
      <div className="w-full max-w-md bg-[#111113] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
          <div>
            <h2 className="text-white font-bold text-lg tracking-tight">
              {isEdit ? "Edit Room" : "Create a Room"}
            </h2>
            <p className="text-zinc-500 text-xs mt-0.5">
              {isEdit ? "Update your room settings" : "Set up your space and invite people"}
            </p>
          </div>
          <button onClick={() => onClose(null)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-colors">
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-5 max-h-[75vh] overflow-y-auto">

          {/* Emoji */}
          <div>
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2 block">Icon</label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map((emoji) => (
                <button key={emoji} type="button" onClick={() => set("emoji", emoji)}
                  className={`w-10 h-10 rounded-xl text-xl transition-all duration-150 ${
                    form.emoji === emoji
                      ? "bg-white/15 scale-110 border border-white/25"
                      : "bg-white/5 hover:bg-white/10 border border-transparent"
                  }`}>
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Accent color */}
          <div>
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2 block">Accent Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLOR_OPTIONS.map((color) => (
                <button key={color} type="button" onClick={() => set("accentColor", color)}
                  className={`w-8 h-8 rounded-full transition-all duration-150 ${
                    form.accentColor === color ? "scale-125 ring-2 ring-white/40 ring-offset-2 ring-offset-[#111113]" : ""
                  }`}
                  style={{ background: color }} />
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2 block">
              Room Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text" maxLength={100} placeholder="e.g. Gaming Zone"
              value={form.name} onChange={(e) => set("name", e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#1a1a1e] border border-white/5 text-white text-sm placeholder-zinc-600 outline-none focus:border-white/20 transition-colors"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2 block">Description</label>
            <textarea
              maxLength={500} rows={2} placeholder="What's this room about?"
              value={form.description} onChange={(e) => set("description", e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#1a1a1e] border border-white/5 text-white text-sm placeholder-zinc-600 outline-none focus:border-white/20 transition-colors resize-none"
            />
          </div>

          {/* Max members + Private toggle */}
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2 block">Max Members</label>
              <input
                type="number" min={2} max={1000}
                value={form.maxMembers} onChange={(e) => set("maxMembers", Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl bg-[#1a1a1e] border border-white/5 text-white text-sm outline-none focus:border-white/20 transition-colors"
              />
            </div>
            <div className="flex flex-col items-center gap-2 pt-5">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Private</label>
              <button type="button" onClick={handlePrivateToggle}
                className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${form.isPrivate ? "bg-violet-500" : "bg-zinc-700"}`}>
                <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${form.isPrivate ? "translate-x-6" : "translate-x-0"}`} />
              </button>
            </div>
          </div>

          {/* ── Password field — only shown when isPrivate is ON and creating ── */}
          {needsPassword && (
            <div className="flex flex-col gap-2 p-4 rounded-xl border border-violet-500/20 bg-violet-500/5">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">🔒</span>
                <label className="text-xs font-semibold text-violet-300 uppercase tracking-widest">
                  Room Password <span className="text-red-400">*</span>
                </label>
              </div>
              <p className="text-zinc-500 text-xs">
                Members will need this password to enter the room.
              </p>
              <div className="relative mt-1">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter a strong password..."
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-[#1a1a1e] border border-violet-500/30 text-white text-sm placeholder-zinc-600 outline-none focus:border-violet-500/60 transition-colors"
                  required={form.isPrivate && !isEdit}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-sm transition-colors"
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>
          )}

          {/* Live preview */}
          <div className="flex items-center gap-3 p-3 rounded-xl border"
            style={{ background: `${accent}10`, borderColor: `${accent}30` }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: `${accent}20` }}>
              {form.emoji}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold truncate">{form.name || "Room Name"}</p>
              <p className="text-xs truncate" style={{ color: accent }}>
                {form.isPrivate ? "🔒 Private" : "🌐 Public"} · Max {form.maxMembers} members
              </p>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isCreatingRoom || !form.name.trim() || (needsPassword && !form.password.trim())}
            className="w-full py-3 rounded-xl font-bold text-sm tracking-wide transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed text-white"
            style={{ background: accent, boxShadow: `0 4px 20px ${accent}40` }}
          >
            {isCreatingRoom
              ? (isEdit ? "Saving..." : "Creating...")
              : (isEdit ? "Save Changes ✦" : "Create Room ✦")}
          </button>
        </form>
      </div>
    </div>
  );
}