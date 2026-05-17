export default function UsersLoadingSkeleton() {
  return (
    <div className="space-y-1 px-1">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl animate-pulse">
          <div className="w-10 h-10 rounded-xl bg-zinc-800 flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 bg-zinc-800 rounded-lg w-3/4" />
            <div className="h-2.5 bg-zinc-800/60 rounded-lg w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}