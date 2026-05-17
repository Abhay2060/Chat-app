import { useEffect } from "react";
import { useChatStore }  from "../store/useChatStore";
import { useAuthStore }  from "../store/useAuthStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import NoChatsFound      from "./NoChatsFound";

export default function ChatsList() {
  const { getMyChatPartners, chats, isUsersLoading, setSelectedUser, selectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();

  useEffect(() => { getMyChatPartners(); }, []);

  if (isUsersLoading) return <UsersLoadingSkeleton />;
  if (chats.length === 0) return <NoChatsFound />;

  return (
    <>
      {chats.map((chat) => {
        const isOnline   = onlineUsers.includes(chat._id);
        const isSelected = selectedUser?._id === chat._id;

        return (
          <div
            key={chat._id}
            onClick={() => setSelectedUser(chat)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 ${
              isSelected
                ? "bg-violet-500/15 border border-violet-500/25"
                : "hover:bg-white/[0.04] border border-transparent"
            }`}
          >
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-zinc-800">
                <img src={chat.profilePic || "/avatar.png"} alt={chat.fullName} className="w-full h-full object-cover" />
              </div>
              <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0d0d0f] ${isOnline ? "bg-emerald-400" : "bg-zinc-600"}`} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold truncate ${isSelected ? "text-white" : "text-zinc-300"}`}>
                {chat.fullName}
              </p>
              <p className={`text-[11px] ${isOnline ? "text-emerald-400" : "text-zinc-600"}`}>
                {isOnline ? "Online" : "Offline"}
              </p>
            </div>
          </div>
        );
      })}
    </>
  );
}