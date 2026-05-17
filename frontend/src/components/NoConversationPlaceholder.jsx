export default function NoConversationPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
      <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-3xl">
        💬
      </div>
      <div>
        <h3 className="text-white font-bold text-lg">Your messages</h3>
        <p className="text-zinc-500 text-sm mt-1 max-w-xs">
          Select a friend from the sidebar to start chatting privately.
        </p>
      </div>
    </div>
  );
}