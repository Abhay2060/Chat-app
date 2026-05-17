import { useEffect, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useRoomStore } from "../store/useRoomStore";
import ProfileCard from "../components/dashboard/ProfileCard";
import RoomsTabs from "../components/dashboard/RoomsTabs";
import DashboardRoomsGrid from "../components/dashboard/DashboardRoomsGrid";
import RoomFormModal from "../components/rooms/RoomsFormModal";
import RoomMembersModal from "../components/rooms/RoomMembersModal";
import ConfirmDialog from "../components/dashboard/ConfirmDialog";



export default function UserDashboard({ onEnterRoom }) {
  const { authUser } = useAuthStore();
  const { myRooms, getMyRooms, deleteRoom, leaveRoom, isRoomsLoading } = useRoomStore();

  const [activeTab,     setActiveTab]     = useState("created");
  const [createModal,   setCreateModal]   = useState(false);
  const [editRoom,      setEditRoom]      = useState(null);
  const [membersRoom,   setMembersRoom]   = useState(null);
  const [confirmAction, setConfirmAction] = useState(null); // { type, room }

  useEffect(() => { getMyRooms(); }, [getMyRooms]);

  const isOwner = (room) =>
    room.createdBy === authUser?._id || room.createdBy?._id === authUser?._id;

  const createdRooms = myRooms.filter(isOwner);
  const joinedRooms  = myRooms.filter((r) => !isOwner(r));
  const displayed    = activeTab === "created" ? createdRooms : joinedRooms;

  const handleConfirm = async () => {
    if (!confirmAction) return;
    if (confirmAction.type === "delete") await deleteRoom(confirmAction.room._id);
    if (confirmAction.type === "leave")  await leaveRoom(confirmAction.room._id);
    setConfirmAction(null);
  };

  return (
    <div className="min-h-screen bg-[#0d0d0f] text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');`}</style>

      <div className="max-w-5xl mx-auto px-5 py-10 flex flex-col gap-8">

        <ProfileCard createdCount={createdRooms.length} joinedCount={joinedRooms.length} />

        <div className="relative z-10 flex flex-col gap-5">
          <RoomsTabs
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            createdCount={createdRooms.length}
            joinedCount={joinedRooms.length}
            onCreateClick={() => setCreateModal(true)}
          />

          <DashboardRoomsGrid
            rooms={displayed}
            isOwnerFn={isOwner}
            isLoading={isRoomsLoading}
            activeTab={activeTab}
            onEnter={onEnterRoom}
            onEdit={(r)         => setEditRoom(r)}
            onDelete={(r)       => setConfirmAction({ type: "delete", room: r })}
            onLeave={(r)        => setConfirmAction({ type: "leave",  room: r })}
            onViewMembers={(r)  => setMembersRoom(r)}
            onCreateClick={() => setCreateModal(true)}
          />
        </div>
      </div>

      {/* Modals */}
      {createModal && (
        <RoomFormModal onClose={(r) => { setCreateModal(false); if (r) getMyRooms(); }} />
      )}
      {editRoom && (
        <RoomFormModal room={editRoom} onClose={(r) => { setEditRoom(null); if (r) getMyRooms(); }} />
      )}
      {membersRoom && (
        <RoomMembersModal room={membersRoom} onClose={() => setMembersRoom(null)} />
      )}
      {confirmAction?.type === "delete" && (
        <ConfirmDialog
          title="Delete Room"
          message={`Are you sure you want to delete "${confirmAction.room.name}"? This cannot be undone.`}
          confirmLabel="Delete" confirmClass="bg-red-600 hover:bg-red-500"
          onConfirm={handleConfirm} onCancel={() => setConfirmAction(null)}
        />
      )}
      {confirmAction?.type === "leave" && (
        <ConfirmDialog
          title="Leave Room"
          message={`Are you sure you want to leave "${confirmAction.room.name}"?`}
          confirmLabel="Leave" confirmClass="bg-orange-600 hover:bg-orange-500"
          onConfirm={handleConfirm} onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}