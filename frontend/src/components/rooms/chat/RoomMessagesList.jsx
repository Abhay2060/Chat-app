import { useEffect, useRef } from "react";
import { useRoomStore } from "../../../store/useRoomStore";
import RoomMessage from "./RoomMessage";

function MessageSkeleton() {
  return (
    <div className="flex gap-3 animate-pulse">
      <div className="w-8 h-8 rounded-xl bg-zinc-800 flex-shrink-0" />
      <div className="flex flex-col gap-2 flex-1">
        <div className="h-3 w-24 bg-zinc-800 rounded" />
        <div className="h-10 w-48 bg-zinc-800 rounded-2xl" />
      </div>
    </div>
  );
}

export default function RoomMessagesList() {
  const { roomMessages, isRoomMessagesLoading } = useRoomStore();
  const bottomRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [roomMessages]);

  if (isRoomMessagesLoading) {
    return (
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
        {[1, 2, 3, 4].map((i) => <MessageSkeleton key={i} />)}
      </div>
    );
  }

  if (roomMessages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-zinc-600">
        <span className="text-5xl">💬</span>
        <p className="text-sm">No messages yet. Say hello!</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-5">
      {roomMessages.map((message) => (
        <RoomMessage key={message._id} message={message} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}