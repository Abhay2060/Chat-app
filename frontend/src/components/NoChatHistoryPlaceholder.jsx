export default function NoChatHistoryPlaceholder({ name }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
      <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-2xl">
        👋
      </div>
      <div>
        <h3 className="text-white font-bold">Start chatting with {name}</h3>
        <p className="text-zinc-500 text-sm mt-1">
          This is the beginning of your conversation. Say hello!
        </p>
      </div>
    </div>
  );
}