import { Navigate, Route, Routes, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";

import LoginPage        from "./pages/LoginPage";
import SignUpPage       from "./pages/SignUpPage";
import OtpPage          from "./pages/OtpPage";
import RoomsPage        from "./pages/Roomspage";
import UserDashboard    from "./pages/Userdashboard";
import RoomChatPage     from "./pages/RoomChatPage";
import ExplorePage      from "./pages/ExplorePage";
import ChatPage         from "./pages/ChatPage";
import PageLoader       from "./components/PageLoader";
import RoomPasswordModal from "./components/rooms/RoomPasswordModal";

import { useAuthStore }   from "./store/useAuthStore";
import { useFriendStore } from "./store/useFriendStore";
import { useRoomStore }   from "./store/useRoomStore";

function AppRoutes() {
  const navigate = useNavigate();
  const { authUser, pendingEmail } = useAuthStore();
  const { joinRoom, setActiveRoom } = useRoomStore();

  const [passwordRoom, setPasswordRoom] = useState(null);

  const handleJoin = async (room) => {
    const isMember = room.members?.some(
      (m) => (m._id || m).toString() === authUser._id.toString()
    );
    if (room.isPrivate && !isMember) {
      setPasswordRoom(room);
      return;
    }
    await joinRoom(room._id);
    setActiveRoom(room);
    navigate(`/${room._id}`);
  };

  const handlePasswordSuccess = (updatedRoom) => {
    setPasswordRoom(null);
    setActiveRoom(updatedRoom);
    navigate(`/${updatedRoom._id}`);
  };

  const handleEnterRoom = (room) => {
    setActiveRoom(room);
    navigate(`/${room._id}`);
  };

  return (
    <>
      <Routes>
        {/* protected routes */}
        <Route path="/"          element={authUser ? <RoomsPage onJoin={handleJoin} /> : <Navigate to="/login" />} />
        <Route path="/explore"   element={authUser ? <ExplorePage onJoin={handleJoin} /> : <Navigate to="/login" />} />
        <Route path="/chat"      element={authUser ? <ChatPage /> : <Navigate to="/login" />} />
        <Route path="/:roomId"   element={authUser ? <RoomChatPage /> : <Navigate to="/login" />} />
        <Route path="/dashboard" element={authUser ? <UserDashboard onEnterRoom={handleEnterRoom} /> : <Navigate to="/login" />} />

        {/* auth routes */}
        <Route path="/login"     element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
        <Route path="/signup"    element={!authUser ? <SignUpPage /> : <Navigate to="/" />} />

        {/* OTP route — only accessible when there is a pendingEmail */}
        <Route
          path="/verify-otp"
          element={
            authUser
              ? <Navigate to="/" />
              : pendingEmail
                ? <OtpPage />
                : <Navigate to="/signup" />
          }
        />
      </Routes>

      {passwordRoom && (
        <RoomPasswordModal
          room={passwordRoom}
          onSuccess={handlePasswordSuccess}
          onClose={() => setPasswordRoom(null)}
        />
      )}
    </>
  );
}

function App() {
  const { checkAuth, isCheckingAuth } = useAuthStore();
  const { getPendingRequests, subscribeToFriendEvents, unsubscribeFromFriendEvents } = useFriendStore();

  useEffect(() => { checkAuth(); }, [checkAuth]);

  const { authUser, socket } = useAuthStore();

  useEffect(() => {
    if (!authUser || !socket) return;
    getPendingRequests();
    subscribeToFriendEvents();
    return () => unsubscribeFromFriendEvents();
  }, [authUser?._id, socket]);

  if (isCheckingAuth) return <PageLoader />;

  return (
    <div className="min-h-screen bg-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px]" />
      <div className="absolute top-0 -left-4 size-96 bg-pink-500 opacity-20 blur-[100px]" />
      <div className="absolute bottom-0 -right-4 size-96 bg-cyan-500 opacity-20 blur-[100px]" />
      <div className="relative z-10 h-screen">
        <AppRoutes />
      </div>
      <Toaster />
    </div>
  );
}

export default App;