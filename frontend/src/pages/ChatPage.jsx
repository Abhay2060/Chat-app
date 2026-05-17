import { useNavigate }           from "react-router";
import { useChatStore }          from "../store/useChatStore";
import ChatsList                 from "../components/ChatsList";
import ContactList               from "../components/ContactList";
import ChatContainer             from "../components/ChatContainer";
import NoConversationPlaceholder from "../components/NoConversationPlaceholder";
import ActiveTabSwitch           from "../components/ActiveTabSwitch";
import ProfileHeader             from "../components/ProfileHeader";

export default function ChatPage() {
  const { activeTab, selectedUser } = useChatStore();
  const navigate = useNavigate();

  return (
    <div
      className="h-screen flex flex-col bg-[#0d0d0f] overflow-hidden"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');`}</style>

      {/* Top bar */}
      <div className="flex-shrink-0 flex items-center gap-4 px-6 py-4 border-b border-white/5">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-zinc-500 hover:text-white text-sm transition-colors"
        >
          ← Lobby
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-sm">
            💬
          </div>
          <span className="text-white font-black text-lg tracking-tight">
            Direct <span className="text-violet-400">Messages</span>
          </span>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex flex-1 min-h-0">

        {/* LEFT — sidebar */}
        <div className="w-72 flex-shrink-0 border-r border-white/5 flex flex-col bg-[#0d0d0f]">
          <ProfileHeader />
          <ActiveTabSwitch />
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 min-h-0">
            {activeTab === "chats" ? <ChatsList /> : <ContactList />}
          </div>
        </div>

        {/* RIGHT — chat area */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0 bg-[#0a0a0c]">
          {selectedUser ? <ChatContainer /> : <NoConversationPlaceholder />}
        </div>
      </div>
    </div>
  );
}