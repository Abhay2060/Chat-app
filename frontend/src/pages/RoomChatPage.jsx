import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useRoomStore }  from "../store/useRoomStore";
import { useAuthStore }  from "../store/useAuthStore";

import RoomChatHeader     from "../components/rooms/chat/RoomChatHeader";
import RoomMessagesList   from "../components/rooms/chat/RoomMessagesList";
import RoomMessageInput   from "../components/rooms/chat/RoomMessageInput";
import RoomMembersSidebar from "../components/rooms/chat/RoomMembersSidebar";

export default function RoomChatPage() {
  const { roomId }  = useParams();
  const navigate    = useNavigate();
  const { socket }  = useAuthStore();

  const {
    activeRoom,
    setActiveRoom,
    clearActiveRoom,
    getRoomMessages,
    getRoomMembers,
    subscribeToRoomMessages,
    unsubscribeFromRoomMessages,
    getMyRooms,
  } = useRoomStore();

  const [isLoading, setIsLoading] = useState(true);
  const [showMembers, setShowMembers] = useState(false);

  // Redirect to lobby if kicked (activeRoom cleared by socket event)
  useEffect(() => {
    if (!activeRoom && !isLoading) {
      navigate("/");
    }
  }, [activeRoom]);

  // ── Step 1: load room, messages, members ──────────────────────────────────
  useEffect(() => {
    const initRoom = async () => {
      await getMyRooms();
      const freshMyRooms = useRoomStore.getState().myRooms;

      const found = freshMyRooms.find((r) => r._id === roomId);
      if (!found) {
        navigate("/");
        return;
      }

      setActiveRoom(found);
      setIsLoading(false);
      await getRoomMessages(roomId);
      await getRoomMembers(roomId);
    };

    initRoom();

    return () => {
      unsubscribeFromRoomMessages();
      clearActiveRoom();
    };
  }, [roomId]);

  // ── Step 2: join socket room AFTER activeRoom is set in store ─────────────
  // This runs only when activeRoom changes, guaranteeing the store
  // has the correct activeRoom before subscribeToRoomMessages() reads it.
  useEffect(() => {
    if (!activeRoom || activeRoom._id !== roomId) return;
    if (!socket) return;

    console.log("Joining socket room:", roomId);
    socket.emit("joinRoom", roomId);
    subscribeToRoomMessages();

    return () => {
      console.log("Leaving socket room:", roomId);
      socket.emit("leaveRoom", roomId);
      unsubscribeFromRoomMessages();
    };
  }, [activeRoom?._id, socket]);

  // ── Loading state ─────────────────────────────────────────────────────────
  if (!activeRoom) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-[#0d0d0f] text-zinc-500 text-sm">
        Loading room...
      </div>
    );
  }

  return (
    <div
      className="flex h-screen bg-[#0d0d0f] overflow-hidden"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');`}</style>

      {/* Main chat column */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <RoomChatHeader onToggleMembers={() => setShowMembers((v) => !v)} />
        <RoomMessagesList />
        <RoomMessageInput />
      </div>

      {/* Members sidebar */}
      <RoomMembersSidebar isOpen={showMembers} />
    </div>
  );
}