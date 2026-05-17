import { useAuthStore } from "../../../store/useAuthStore";
import { useRoomStore } from "../../../store/useRoomStore";

const EMOJI_LIST = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function RoomMessage({ message }) {
  const { authUser } = useAuthStore();
  const { reactToRoomMessage, activeRoom } = useRoomStore();

  const senderId  = message.senderId?._id || message.senderId;
  const isMine    = senderId?.toString() === authUser._id?.toString();
  const sender    = typeof message.senderId === "object" ? message.senderId : null;
  const name      = isMine ? "You" : (sender?.fullName || "Unknown");
  const avatar    = sender?.profilePic;
  const accent    = activeRoom?.accentColor || "#4f8ef7";

  // Flatten reactions map → [{ emoji, count, iReacted }]
  const reactions = Object.entries(message.reactions || {})
    .filter(([, users]) => users.length > 0)
    .map(([emoji, users]) => ({
      emoji,
      count: users.length,
      iReacted: users.includes(authUser._id),
    }));

  return (
    <div className={`flex gap-3 group ${isMine ? "flex-row-reverse" : "flex-row"}`}>

      {/* Avatar */}
      <div className="w-8 h-8 rounded-xl overflow-hidden bg-zinc-800 flex-shrink-0 flex items-center justify-center text-sm font-bold text-zinc-400 self-end">
        {avatar
          ? <img src={avatar} alt={name} className="w-full h-full object-cover" />
          : name.charAt(0).toUpperCase()
        }
      </div>

      <div className={`flex flex-col gap-1 max-w-[70%] ${isMine ? "items-end" : "items-start"}`}>

        {/* Sender name + time */}
        <div className={`flex items-center gap-2 px-1 ${isMine ? "flex-row-reverse" : "flex-row"}`}>
          <span className="text-xs font-semibold" style={{ color: isMine ? accent : "#a1a1aa" }}>
            {name}
          </span>
          <span className="text-[10px] text-zinc-600">{formatTime(message.createdAt)}</span>
        </div>

        {/* Bubble */}
        <div
          className="relative rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
          style={isMine
            ? { background: `${accent}25`, border: `1px solid ${accent}35`, color: "#f0ede8" }
            : { background: "#1a1a1e", border: "1px solid rgba(255,255,255,0.05)", color: "#d4d4d8" }
          }
        >
          {message.text && <p className="break-words">{message.text}</p>}
          {message.image && (
            <img
              src={message.image}
              alt="attachment"
              className="mt-2 rounded-xl max-w-xs max-h-60 object-cover cursor-pointer"
              onClick={() => window.open(message.image, "_blank")}
            />
          )}
          {message.isOptimistic && (
            <span className="text-[10px] text-zinc-600 mt-1 block text-right">sending...</span>
          )}
        </div>

        {/* Reactions */}
        {reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 px-1">
            {reactions.map(({ emoji, count, iReacted }) => (
              <button
                key={emoji}
                onClick={() => reactToRoomMessage(message._id, emoji)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all ${
                  iReacted
                    ? "bg-violet-500/20 border border-violet-500/40 text-violet-300"
                    : "bg-white/5 border border-white/10 text-zinc-400 hover:bg-white/10"
                }`}
              >
                {emoji} <span>{count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Emoji picker — shows on hover */}
        <div className={`flex gap-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity ${isMine ? "flex-row-reverse" : "flex-row"}`}>
          {EMOJI_LIST.map((emoji) => (
            <button
              key={emoji}
              onClick={() => reactToRoomMessage(message._id, emoji)}
              className="text-sm hover:scale-125 transition-transform"
              title={`React with ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}