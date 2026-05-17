import { useEffect } from "react";
import { useFriendStore } from "../store/useFriendStore";
import { useChatStore }   from "../store/useChatStore";
import { useAuthStore }   from "../store/useAuthStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";

export default function ContactList() {
  const { friends, getFriends, isLoading } = useFriendStore();
  const { setSelectedUser, selectedUser }  = useChatStore();
  const { onlineUsers }                    = useAuthStore();

  useEffect(() => { getFriends(); }, []);

  if (isLoading) return <UsersLoadingSkeleton />;

  if (friends.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3 text-zinc-600">
        <span className="text-4xl">👥</span>
        <p className="text-sm font-medium">No friends yet</p>
        <p className="text-xs text-zinc-700 text-center px-4">Add friends from room member lists</p>
      </div>
    );
  }

  return (
    <>
      {friends.map((friend) => {
        const isOnline   = onlineUsers.includes(friend._id);
        const isSelected = selectedUser?._id === friend._id;
        return (
          <div
            key={friend._id}
            onClick={() => setSelectedUser(friend)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 ${
              isSelected
                ? "bg-violet-500/15 border border-violet-500/25"
                : "hover:bg-white/[0.04] border border-transparent"
            }`}
          >
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-zinc-800">
                <img src={friend.profilePic || "/avatar.png"} alt={friend.fullName} className="w-full h-full object-cover" />
              </div>
              <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0d0d0f] ${isOnline ? "bg-emerald-400" : "bg-zinc-600"}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold truncate ${isSelected ? "text-white" : "text-zinc-300"}`}>{friend.fullName}</p>
              <p className={`text-[11px] ${isOnline ? "text-emerald-400" : "text-zinc-600"}`}>{isOnline ? "Online" : "Offline"}</p>
            </div>
          </div>
        );
      })}
    </>
  );
}