import { useChatStore } from "../store/useChatStore";

export default function NoChatsFound() {
  const { setActiveTab } = useChatStore();

  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3 text-zinc-600">
      <span className="text-4xl">💬</span>
      <p className="text-sm font-medium text-zinc-500">No conversations yet</p>
      <p className="text-xs text-center px-4">Start a chat by picking a friend from Contacts</p>
      <button
        onClick={() => setActiveTab("contacts")}
        className="mt-1 px-4 py-2 rounded-xl bg-violet-500/15 border border-violet-500/25 text-violet-300 text-xs font-bold hover:bg-violet-500/25 transition-colors"
      >
        Go to Contacts
      </button>
    </div>
  );
}