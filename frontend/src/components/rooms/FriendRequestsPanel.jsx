import { useState, useEffect, useRef } from "react";
import { useFriendStore } from "../../store/useFriendStore";

// ─── Single Request Card ──────────────────────────────────────────────────────
function RequestCard({ request, onAccept, onReject }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors">

      {/* Avatar */}
      <div className="w-9 h-9 rounded-xl overflow-hidden bg-zinc-800 flex-shrink-0 flex items-center justify-center text-sm font-bold text-zinc-400">
        {request.sender.profilePic
          ? <img src={request.sender.profilePic} alt={request.sender.fullName} className="w-full h-full object-cover" />
          : request.sender.fullName?.charAt(0).toUpperCase()
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-white text-xs font-semibold truncate">{request.sender.fullName}</p>
        <p className="text-zinc-500 text-[11px]">Wants to be your friend</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          onClick={() => onAccept(request._id)}
          className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-xs font-semibold transition-colors border border-emerald-500/20"
        >
          ✓
        </button>
        <button
          onClick={() => onReject(request._id)}
          className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold transition-colors border border-red-500/20"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

// ─── Friend Requests Bell ─────────────────────────────────────────────────────
export default function FriendRequestsPanel() {
  const { pendingRequests, getPendingRequests, acceptRequest, rejectRequest, subscribeToFriendEvents, unsubscribeFromFriendEvents } = useFriendStore();
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    getPendingRequests();
    subscribeToFriendEvents();
    return () => unsubscribeFromFriendEvents();
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const count = pendingRequests.length;

  return (
    <div className="relative" ref={panelRef}>

      {/* Bell button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="relative w-9 h-9 rounded-xl bg-zinc-800 border border-white/10 flex items-center justify-center hover:bg-zinc-700 transition-colors"
      >
        🔔
        {/* Red badge */}
        {count > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow-lg">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-72 bg-[#111113] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">

          {/* Header */}
          <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-white text-sm font-bold">Friend Requests</h3>
            {count > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/20 font-semibold">
                {count} pending
              </span>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {count === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-zinc-600">
                <span className="text-3xl">👥</span>
                <p className="text-xs">No pending requests</p>
              </div>
            ) : (
              pendingRequests.map((request) => (
                <RequestCard
                  key={request._id}
                  request={request}
                  onAccept={acceptRequest}
                  onReject={rejectRequest}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}