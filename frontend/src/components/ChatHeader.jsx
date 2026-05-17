import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";

export default function ChatHeader() {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const isOnline = onlineUsers.includes(selectedUser?._id);

  return (
    <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5 bg-[#0d0d0f] flex-shrink-0">
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-9 h-9 rounded-xl overflow-hidden bg-zinc-800">
            <img
              src={selectedUser?.profilePic || "/avatar.png"}
              alt={selectedUser?.fullName}
              className="w-full h-full object-cover"
            />
          </div>
          <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0d0d0f] ${isOnline ? "bg-emerald-400" : "bg-zinc-600"}`} />
        </div>

        {/* Name + status */}
        <div>
          <p className="text-white text-sm font-bold leading-tight">{selectedUser?.fullName}</p>
          <p className={`text-[11px] font-medium ${isOnline ? "text-emerald-400" : "text-zinc-600"}`}>
            {isOnline ? "Online" : "Offline"}
          </p>
        </div>
      </div>

      {/* Close */}
      <button
        onClick={() => setSelectedUser(null)}
        className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-500 hover:text-white transition-colors text-lg"
      >
        ×
      </button>
    </div>
  );
}