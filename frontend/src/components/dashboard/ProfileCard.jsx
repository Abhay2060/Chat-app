import { useState } from "react";
import { useAuthStore } from "../../store/useAuthStore";

function StatCard({ label, value, emoji }) {
  return (
    <div className="flex flex-col gap-1 px-5 py-4 rounded-2xl bg-[#0d0d0f] border border-white/5">
      <span className="text-2xl">{emoji}</span>
      <span className="text-2xl font-black text-white tracking-tight leading-none">{value}</span>
      <span className="text-xs text-zinc-500 font-medium mt-0.5">{label}</span>
    </div>
  );
}

export default function ProfileCard({ createdCount, joinedCount }) {
  const { authUser, updateProfile, onlineUsers } = useAuthStore();
  const [uploading, setUploading] = useState(false);
  const isMeOnline = onlineUsers?.includes(authUser?._id);

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      await updateProfile({ profilePic: reader.result });
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="relative flex flex-col sm:flex-row items-center sm:items-end gap-6 p-6 rounded-2xl bg-[#111113] border border-white/5 overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.06]"
        style={{ backgroundImage: "radial-gradient(circle at 80% 10%, #7c3aed 0%, transparent 55%)" }} />

      {/* Avatar */}
      <div className="relative flex-shrink-0 z-10">
        <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-white/10 bg-zinc-800 flex items-center justify-center text-4xl font-black text-zinc-400">
          {authUser?.profilePic
            ? <img src={authUser.profilePic} alt="avatar" className="w-full h-full object-cover" />
            : authUser?.fullName?.charAt(0).toUpperCase()
          }
        </div>
        <span className={`absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full border-2 border-[#111113] ${isMeOnline ? "bg-emerald-400" : "bg-zinc-600"}`} />
        <label className="absolute -bottom-2 -right-2 w-8 h-8 flex items-center justify-center rounded-xl bg-violet-600 hover:bg-violet-500 border border-white/10 cursor-pointer text-sm transition-colors shadow-lg">
          {uploading ? "⏳" : "📷"}
          <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </label>
      </div>

      {/* Info */}
      <div className="flex-1 text-center sm:text-left z-10">
        <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
          <h1 className="text-2xl font-black tracking-tight leading-none text-white">{authUser?.fullName}</h1>
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
            isMeOnline ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25" : "bg-zinc-800 text-zinc-500"
          }`}>
            {isMeOnline ? "● Online" : "Offline"}
          </span>
        </div>
        <p className="text-zinc-500 text-sm mt-1">{authUser?.email}</p>
        <p className="text-zinc-600 text-xs mt-1">
          Member since {new Date(authUser?.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Stats */}
      <div className="flex gap-3 z-10 flex-shrink-0 flex-wrap justify-center sm:justify-end">
        <StatCard emoji="🏠" value={createdCount}                  label="Created" />
        <StatCard emoji="🚀" value={joinedCount}                   label="Joined"  />
        <StatCard emoji="👥" value={onlineUsers?.length ?? 0}      label="Online"  />
      </div>
    </div>
  );
}