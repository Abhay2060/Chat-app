import { useRoomStore } from "../../../store/useRoomStore";
import { useAuthStore } from "../../../store/useAuthStore";
import { useFriendStore } from "../../../store/useFriendStore";
import { axiosInstance } from "../../../lib/axios";
import toast from "react-hot-toast";

// ─── Single member row ────────────────────────────────────────────────────────
function MemberRow({ member, isOnline, isOwner, isYou, canManage, canAddFriend, accentColor }) {
  const { activeRoom } = useRoomStore();

  const handleKick = async () => {
    if (!confirm(`Kick ${member.fullName} from the room?`)) return;
    try {
      await axiosInstance.post(`/rooms/${activeRoom._id}/kick/${member._id}`);
      toast.success(`${member.fullName} has been kicked`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to kick member");
    }
  };

  const handleAddFriend = async () => {
    const { sendFriendRequest } = useFriendStore.getState();
    await sendFriendRequest(member._id);
  };

  // Show action buttons if: not yourself AND (can add friend OR can manage/kick)
  const showActions = !isYou && (canAddFriend || (canManage && !isOwner));

  return (
    <div className="group relative flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/[0.04] transition-colors">

      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className="w-8 h-8 rounded-xl overflow-hidden bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400">
          {member.profilePic
            ? <img src={member.profilePic} alt={member.fullName} className="w-full h-full object-cover" />
            : member.fullName?.charAt(0).toUpperCase()
          }
        </div>
        <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0d0d0f] ${isOnline ? "bg-emerald-400" : "bg-zinc-600"}`} />
      </div>

      {/* Name + badges */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-xs font-medium text-zinc-300 truncate">{member.fullName}</span>
          {isYou && <span className="text-[10px] text-zinc-600">(you)</span>}
        </div>
        {isOwner && (
          <span className="text-[10px] font-semibold" style={{ color: accentColor }}>Owner</span>
        )}
      </div>

      {/* Hover action buttons */}
      {showActions && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1 bg-[#1a1a1e] border border-white/10 rounded-lg px-1.5 py-1 shadow-xl z-10">

          {/* Add Friend — visible to ALL members */}
          {canAddFriend && (
            <button
              onClick={handleAddFriend}
              title={`Add ${member.fullName} as friend`}
              className="w-6 h-6 flex items-center justify-center rounded-md text-sm hover:bg-white/10 text-zinc-400 hover:text-emerald-400 transition-colors"
            >
              👤+
            </button>
          )}

          {/* Divider — only if both buttons are visible */}
          {canAddFriend && canManage && !isOwner && (
            <div className="w-px h-4 bg-white/10" />
          )}

          {/* Kick — only room owner, and not on owner's own row */}
          {canManage && !isOwner && (
            <button
              onClick={handleKick}
              title={`Kick ${member.fullName}`}
              className="w-6 h-6 flex items-center justify-center rounded-md text-sm hover:bg-red-500/10 text-zinc-400 hover:text-red-400 transition-colors"
            >
              🚫
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Members Sidebar ──────────────────────────────────────────────────────────
export default function RoomMembersSidebar({ isOpen }) {
  const { activeRoom, roomMembers } = useRoomStore();
  const { onlineUsers, authUser }   = useAuthStore();

  if (!isOpen) return null;

  const accent   = activeRoom?.accentColor || "#4f8ef7";
  const iAmOwner = activeRoom?.createdBy?._id === authUser._id ||
                   activeRoom?.createdBy === authUser._id;

  const online  = roomMembers.filter((m) => onlineUsers.includes(m._id));
  const offline = roomMembers.filter((m) => !onlineUsers.includes(m._id));

  const renderMember = (member) => {
    const memberIsOwner = activeRoom?.createdBy?._id === member._id ||
                          activeRoom?.createdBy === member._id;
    const isYou = member._id === authUser._id;

    return (
      <MemberRow
        key={member._id}
        member={member}
        isOnline={onlineUsers.includes(member._id)}
        isOwner={memberIsOwner}
        isYou={isYou}
        canManage={iAmOwner}        // only owner can kick
        canAddFriend={!isYou}       // any member can add friend (except yourself)
        accentColor={accent}
      />
    );
  };

  return (
    <div className="w-56 flex-shrink-0 border-l border-white/5 bg-[#0d0d0f] flex flex-col overflow-hidden">

      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5">
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">
          Members — {roomMembers.length}
        </p>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto py-2">
        {online.length > 0 && (
          <>
            <p className="px-4 py-1 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
              Online — {online.length}
            </p>
            {online.map(renderMember)}
          </>
        )}
        {offline.length > 0 && (
          <>
            <p className="px-4 py-1 mt-3 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
              Offline — {offline.length}
            </p>
            {offline.map(renderMember)}
          </>
        )}
      </div>
    </div>
  );
}