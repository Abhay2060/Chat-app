import RoomCard from "../rooms/RoomCard";

function RoomSkeletons() {
  return <>
    {[1, 2, 3].map((i) => (
      <div key={i} className="h-52 rounded-2xl bg-[#111113] border border-white/5 animate-pulse" />
    ))}
  </>;
}

function EmptyState({ emoji, message, action }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-14 gap-3 text-center">
      <span className="text-4xl">{emoji}</span>
      <p className="text-zinc-600 text-sm max-w-xs">{message}</p>
      {action}
    </div>
  );
}

export default function DashboardRoomsGrid({
  rooms, isOwnerFn, isLoading, activeTab,
  onEnter, onEdit, onDelete, onLeave, onViewMembers, onCreateClick,
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <RoomSkeletons />
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="grid grid-cols-1">
        {activeTab === "created" ? (
          <EmptyState emoji="🏠"
            message="You haven't created any rooms yet. Create your first room!"
            action={
              <button onClick={onCreateClick}
                className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold transition-colors mt-1">
                + Create Room
              </button>
            }
          />
        ) : (
          <EmptyState emoji="🚪"
            message="You haven't joined any rooms yet. Browse the lobby to find your community!"
            action={
              <a href="/rooms"
                className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-sm font-semibold transition-colors mt-1 border border-white/10">
                Browse Rooms →
              </a>
            }
          />
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {rooms.map((room) => (
        <RoomCard
          key={room._id}
          room={room}
          variant="dashboard"
          isOwner={isOwnerFn(room)}
          onJoin={onEnter}
          onEdit={onEdit}
          onDelete={onDelete}
          onLeave={onLeave}
          onViewMembers={onViewMembers}
        />
      ))}
    </div>
  );
}