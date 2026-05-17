import { useEffect } from "react";
import { useRoomStore } from "../../store/useRoomStore";
import { useAuthStore } from "../../store/useAuthStore";

export default function RoomMembersModal({ room, onClose }) {
  const { roomMembers, getRoomMembers } = useRoomStore();
  const { onlineUsers, authUser } = useAuthStore();

  useEffect(() => {
    getRoomMembers(room._id);
  }, [room._id]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-sm bg-[#111113] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl"
              style={{ background: `${room.accentColor}20` }}>
              {room.emoji}
            </div>
            <div>
              <h2 className="text-white font-bold text-sm tracking-tight">{room.name}</h2>
              <p className="text-zinc-500 text-xs">{roomMembers.length} member{roomMembers.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-colors">
            ✕
          </button>
        </div>

        {/* Member list */}
        <div className="flex flex-col divide-y divide-white/5 max-h-80 overflow-y-auto">
          {roomMembers.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-zinc-600">
              <span className="text-3xl">👥</span>
              <p className="text-sm">No members found</p>
            </div>
          ) : (
            roomMembers.map((member) => {
              const isOnline = onlineUsers.includes(member._id);
              const isYou    = member._id === authUser?._id;
              const isOwner  = room.createdBy === member._id || room.createdBy?._id === member._id;

              return (
                <div key={member._id} className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.03] transition-colors">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-9 h-9 rounded-xl overflow-hidden bg-zinc-800 flex items-center justify-center text-sm font-bold text-zinc-400">
                      {member.profilePic
                        ? <img src={member.profilePic} alt={member.fullName} className="w-full h-full object-cover" />
                        : member.fullName?.charAt(0).toUpperCase()
                      }
                    </div>
                    {/* Online dot */}
                    <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#111113] ${isOnline ? "bg-emerald-400" : "bg-zinc-600"}`} />
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-white truncate">{member.fullName}</span>
                      {isYou && <span className="text-[10px] text-zinc-500">(you)</span>}
                    </div>
                    <p className="text-xs text-zinc-600 truncate">{member.email}</p>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {isOwner && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/20">
                        Owner
                      </span>
                    )}
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      isOnline ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-800 text-zinc-500"
                    }`}>
                      {isOnline ? "Online" : "Offline"}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#34d399]" />
            <span className="text-xs text-zinc-500">
              {roomMembers.filter((m) => onlineUsers.includes(m._id)).length} online right now
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}