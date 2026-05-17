export default function RoomsTabs({ activeTab, setActiveTab, createdCount, joinedCount, onCreateClick }) {
  const tabs = [
    { key: "created", label: "My Rooms", count: createdCount },
    { key: "joined",  label: "Joined",   count: joinedCount  },
  ];

  return (
    <div className="relative z-10 flex items-center justify-between gap-4 flex-wrap">
      {/* Tab switcher */}
      <div className="flex items-center gap-1 bg-[#111113] border border-white/5 rounded-xl p-1">
        {tabs.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 flex items-center gap-2 ${
              activeTab === tab.key ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300"
            }`}>
            {tab.label}
            <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ${
              activeTab === tab.key ? "bg-violet-500/25 text-violet-300" : "bg-white/5 text-zinc-600"
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Create button */}
      <button onClick={onCreateClick}
        className="relative z-10 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold transition-colors shadow-lg shadow-violet-500/20">
        <span className="text-base leading-none">+</span> Create Room
      </button>
    </div>
  );
}