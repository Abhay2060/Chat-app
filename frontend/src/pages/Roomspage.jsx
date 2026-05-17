import RoomsFooter from "../components/rooms/Roomsfooter";
import RoomsGrid from "../components/rooms/Roomsgrid";
import RoomsHeader from "../components/rooms/Roomsheader";


export default function RoomsPage({ onJoin }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#0d0d0f]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');`}</style>
      <RoomsHeader />
      <RoomsGrid onJoin={onJoin} />
      <RoomsFooter />
    </div>
  );
}