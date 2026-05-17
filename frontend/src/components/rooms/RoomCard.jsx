import { useState } from "react";

export default function RoomCard({ room, variant = "lobby", isOwner = false, onJoin, onEdit, onDelete, onLeave, onViewMembers }) {
  const [hovered, setHovered]   = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const accent      = room.accentColor || "#4f8ef7";
  const memberCount = room.members?.length ?? 0;
  const isDashboard = variant === "dashboard";

  const menuItems = isDashboard ? [
    ...(isOwner ? [{ label: "✏️  Edit Room",   action: () => onEdit?.(room),       cls: "text-zinc-300 hover:bg-white/5" }] : []),
    {              label: "👥  View Members", action: () => onViewMembers?.(room), cls: "text-zinc-300 hover:bg-white/5" },
    ...(isOwner
      ? [{ label: "🗑  Delete Room", action: () => onDelete?.(room), cls: "text-red-400 hover:bg-red-500/10" }]
      : [{ label: "🚪  Leave Room",  action: () => onLeave?.(room),  cls: "text-orange-400 hover:bg-orange-500/10" }]
    ),
  ] : [];

  return (
    <div
      className="relative flex flex-col rounded-2xl border bg-[#111113] overflow-hidden cursor-pointer transition-all duration-300"
      style={{
        borderColor: hovered ? `${accent}45` : "rgba(255,255,255,0.05)",
        transform:   hovered ? "translateY(-4px)" : "translateY(0)",
        boxShadow:   hovered ? `0 16px 48px ${accent}20` : "none",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => !isDashboard && onJoin?.(room)}
    >
      {/* Glow blob */}
      <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full blur-3xl pointer-events-none transition-opacity duration-300"
        style={{ background: accent, opacity: hovered ? 0.12 : 0.06 }} />

      {/* Banner */}
      <div className="w-full h-20 flex items-center justify-center text-4xl relative overflow-hidden flex-shrink-0"
        style={{ background: `${accent}14` }}>
        <div className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: `linear-gradient(${accent} 1px, transparent 1px), linear-gradient(90deg, ${accent} 1px, transparent 1px)`,
            backgroundSize: "20px 20px",
          }} />
        <span className="relative z-10">{room.emoji || "💬"}</span>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-2 p-4 flex-1">

        {/* Name + owner badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-white font-bold text-sm leading-tight truncate">{room.name}</h3>
            {room.description && (
              <p className="text-zinc-600 text-xs mt-0.5 line-clamp-1">{room.description}</p>
            )}
          </div>
          {isDashboard && isOwner && (
            <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/20">
              Owner
            </span>
          )}
        </div>

        {/* Meta */}
        <div className="flex items-center gap-2.5 mt-auto">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: accent }} />
            <span className="text-xs text-zinc-500">{memberCount.toLocaleString()} members</span>
          </div>
          <span className="text-zinc-700">·</span>
          <span className="text-xs text-zinc-500">{room.isPrivate ? "🔒 Private" : "🌐 Public"}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-1">
          <button
            className="flex-1 py-2 rounded-xl text-xs font-bold tracking-wide uppercase transition-all duration-150"
            style={{
              background: hovered ? `${accent}25` : `${accent}15`,
              border:     `1px solid ${accent}${hovered ? "50" : "30"}`,
              color:      accent,
            }}
            onClick={(e) => { e.stopPropagation(); onJoin?.(room); }}
          >
            {isDashboard ? "Enter →" : "Join Room →"}
          </button>

          {isDashboard && (
            <div className="relative">
              <button
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors text-lg leading-none"
                onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
              >
                ⋯
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }} />
                  <div className="absolute right-0 bottom-10 z-20 w-40 bg-[#1c1c1f] border border-white/10 rounded-xl shadow-2xl overflow-hidden py-1">
                    {menuItems.map((item, i) => (
                      <button key={i}
                        className={`w-full text-left px-4 py-2.5 text-xs font-medium transition-colors ${item.cls}`}
                        onClick={(e) => { e.stopPropagation(); setMenuOpen(false); item.action(); }}>
                        {item.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}