import { useEffect, useRef, useState } from "react";
import { useAuthStore }  from "../store/useAuthStore";
import { useChatStore }  from "../store/useChatStore";
import ChatHeader        from "./ChatHeader";
import NoChatHistoryPlaceholder from "./NoChatHistoryPlaceholder";
import MessageInput      from "./MessageInput";
import MessagesLoadingSkeleton from "./MessagesLoadingSkeleton";
import EmojiPicker       from "emoji-picker-react";

const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

function formatTime(date) {
  return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ChatContainer() {
  const {
    selectedUser,
    getMessagesByUserId,
    messages,
    isMessagesLoading,
    subscribeToMessages,
    unsubscribeFromMessages,
    reactToMessage,
  } = useChatStore();
  const { authUser } = useAuthStore();

  const messageEndRef          = useRef(null);
  const hoverTimeoutRef        = useRef(null);
  const [hoveredMsgId,         setHoveredMsgId]         = useState(null);
  const [expandedPickerMsgId,  setExpandedPickerMsgId]  = useState(null);

  useEffect(() => {
    getMessagesByUserId(selectedUser._id);
    subscribeToMessages();
    return () => unsubscribeFromMessages();
  }, [selectedUser._id]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest(".reaction-zone")) {
        setExpandedPickerMsgId(null);
        setHoveredMsgId(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleMouseEnter = (msgId) => {
    clearTimeout(hoverTimeoutRef.current);
    setHoveredMsgId(msgId);
  };
  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      if (!expandedPickerMsgId) setHoveredMsgId(null);
    }, 300);
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <ChatHeader />

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 min-h-0">
        {isMessagesLoading ? (
          <MessagesLoadingSkeleton />
        ) : messages.length === 0 ? (
          <NoChatHistoryPlaceholder name={selectedUser.fullName} />
        ) : (
          <>
            {messages.map((msg) => {
              const isMine    = msg.senderId === authUser._id;
              const reactions = msg.reactions || {};

              return (
                <div
                  key={msg._id}
                  className={`flex gap-2.5 ${isMine ? "flex-row-reverse" : "flex-row"}`}
                >
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-xl overflow-hidden bg-zinc-800 flex-shrink-0 self-end">
                    <img
                      src={(isMine ? authUser.profilePic : selectedUser.profilePic) || "/avatar.png"}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className={`flex flex-col gap-1 max-w-[65%] ${isMine ? "items-end" : "items-start"}`}>
                    {/* Bubble */}
                    <div
                      className="relative reaction-zone"
                      onMouseEnter={() => handleMouseEnter(msg._id)}
                      onMouseLeave={handleMouseLeave}
                    >
                      <div
                        className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                          isMine
                            ? "bg-violet-600 text-white rounded-br-sm"
                            : "bg-[#1a1a1e] text-zinc-200 border border-white/5 rounded-bl-sm"
                        }`}
                      >
                        {msg.image && (
                          <img
                            src={msg.image}
                            alt="attachment"
                            className="rounded-xl max-w-xs max-h-52 object-cover mb-2 cursor-pointer"
                            onClick={() => window.open(msg.image, "_blank")}
                          />
                        )}
                        {msg.text && <p className="break-words">{msg.text}</p>}
                        <p className={`text-[10px] mt-1 ${isMine ? "text-violet-200/70" : "text-zinc-600"}`}>
                          {formatTime(msg.createdAt)}
                        </p>
                      </div>

                      {/* Quick reaction bar on hover */}
                      {hoveredMsgId === msg._id && (
                        <div
                          className={`absolute top-full mt-1.5 flex items-center gap-1 bg-[#1c1c1f] border border-white/10 rounded-full px-2 py-1 shadow-xl z-10 ${
                            isMine ? "right-0" : "left-0"
                          }`}
                          onMouseEnter={() => clearTimeout(hoverTimeoutRef.current)}
                        >
                          {QUICK_EMOJIS.map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => reactToMessage(msg._id, emoji)}
                              className="hover:scale-125 transition-transform text-base leading-none"
                            >
                              {emoji}
                            </button>
                          ))}
                          <button
                            onClick={() => setExpandedPickerMsgId(
                              expandedPickerMsgId === msg._id ? null : msg._id
                            )}
                            className="text-zinc-400 hover:text-white text-sm font-bold px-1 transition-colors"
                          >
                            +
                          </button>
                        </div>
                      )}

                      {/* Full emoji picker */}
                      {expandedPickerMsgId === msg._id && (
                        <div
                          className={`absolute z-20 ${isMine ? "right-0" : "left-0"}`}
                          style={{ top: "calc(100% + 40px)" }}
                          onMouseEnter={() => clearTimeout(hoverTimeoutRef.current)}
                        >
                          <EmojiPicker
                            theme="dark"
                            height={350}
                            width={300}
                            onEmojiClick={(emojiData) => {
                              reactToMessage(msg._id, emojiData.emoji);
                              setExpandedPickerMsgId(null);
                              setHoveredMsgId(null);
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Reactions */}
                    {Object.keys(reactions).length > 0 && (
                      <div className={`flex flex-wrap gap-1 ${isMine ? "justify-end" : "justify-start"}`}>
                        {Object.entries(reactions).map(([emoji, users]) =>
                          users.length > 0 ? (
                            <button
                              key={emoji}
                              onClick={() => reactToMessage(msg._id, emoji)}
                              className={`text-xs flex items-center gap-1 rounded-full px-2 py-0.5 border transition-colors ${
                                users.includes(authUser._id)
                                  ? "bg-violet-500/20 border-violet-500/40 text-violet-300"
                                  : "bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10"
                              }`}
                            >
                              {emoji} <span>{users.length}</span>
                            </button>
                          ) : null
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messageEndRef} />
          </>
        )}
      </div>

      <MessageInput />
    </div>
  );
}