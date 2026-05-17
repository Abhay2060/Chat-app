import { useState, useRef } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

export default function ProfileHeader() {
  const { authUser, updateProfile } = useAuthStore();
  const { isSoundEnabled, toggleSound } = useChatStore();
  const [selectedImg, setSelectedImg] = useState(null);
  const fileInputRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      setSelectedImg(reader.result);
      await updateProfile({ profilePic: reader.result });
    };
  };

  return (
    <div className="px-4 py-4 border-b border-white/5 flex items-center gap-3">

      {/* Avatar */}
      <div className="relative flex-shrink-0 cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
        <div className="w-10 h-10 rounded-xl overflow-hidden bg-zinc-800">
          <img
            src={selectedImg || authUser?.profilePic || "/avatar.png"}
            alt={authUser?.fullName}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 rounded-xl bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
          <span className="text-[9px] text-white font-bold">Edit</span>
        </div>
        {/* Online dot */}
        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#0d0d0f]" />
        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-semibold truncate">{authUser?.fullName}</p>
        <p className="text-emerald-400 text-[11px] font-medium">Online</p>
      </div>

      {/* Sound toggle */}
      <button
        onClick={toggleSound}
        title={isSoundEnabled ? "Mute sounds" : "Unmute sounds"}
        className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-500 hover:text-white transition-colors text-sm"
      >
        {isSoundEnabled ? "🔊" : "🔇"}
      </button>
    </div>
  );
}