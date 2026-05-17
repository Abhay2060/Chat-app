import { useState, useEffect } from "react";
import { useRoomStore } from "../../store/useRoomStore";
import RoomCard from "./RoomCard";


function RoomSkeletons() {
  return <>
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="h-52 rounded-2xl bg-[#111113] border border-white/5 animate-pulse" />
    ))}
  </>;
}

export default function RoomsGrid({ onJoin }) {
  const { rooms, getAllRooms, isRoomsLoading } = useRoomStore();
  const [query, setQuery] = useState("");

  useEffect(() => { getAllRooms(); }, [getAllRooms]);

  const filtered = rooms.filter((r) =>
    r.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-12">

      {/* Heading + search */}
      <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 mb-2">Live Rooms</p>
          <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-none">
            Pick your room
          </h2>
          <p className="mt-3 text-zinc-500 text-sm">{rooms.length} rooms available</p>
        </div>
        <div className="relative w-full sm:w-72">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 text-sm pointer-events-none">🔍</span>
          <input
            type="text" placeholder="Search rooms..."
            value={query} onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#1a1a1e] border border-white/5 text-white text-sm placeholder-zinc-600 outline-none focus:border-white/20 transition-colors"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {isRoomsLoading ? (
          <RoomSkeletons />
        ) : filtered.length === 0 ? (
          <div className="col-span-full flex flex-col items-center py-24 gap-3 text-zinc-600">
            <span className="text-5xl">🔎</span>
            <p className="text-sm">No rooms match &quot;{query}&quot;</p>
          </div>
        ) : (
          filtered.map((room) => (
            <RoomCard key={room._id} room={room} variant="lobby" onJoin={onJoin} />
          ))
        )}
      </div>
    </main>
  );
}