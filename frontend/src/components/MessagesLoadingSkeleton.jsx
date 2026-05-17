export default function MessagesLoadingSkeleton() {
  return (
    <div className="space-y-4 px-2">
      {[...Array(6)].map((_, i) => (
        <div key={i} className={`flex gap-2.5 animate-pulse ${i % 2 === 0 ? "flex-row" : "flex-row-reverse"}`}>
          <div className="w-8 h-8 rounded-xl bg-zinc-800 flex-shrink-0 self-end" />
          <div className={`flex flex-col gap-1 ${i % 2 === 0 ? "items-start" : "items-end"}`}>
            <div
              className="rounded-2xl bg-zinc-800"
              style={{ width: `${120 + (i * 23) % 100}px`, height: "40px" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}