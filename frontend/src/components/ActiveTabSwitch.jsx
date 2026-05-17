import { useChatStore } from "../store/useChatStore";

export default function ActiveTabSwitch() {
  const { activeTab, setActiveTab } = useChatStore();

  return (
    <div className="px-3 py-3 flex gap-1 border-b border-white/5">
      {["chats", "contacts"].map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all duration-150 ${
            activeTab === tab
              ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
              : "text-zinc-600 hover:text-zinc-400 hover:bg-white/5"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}