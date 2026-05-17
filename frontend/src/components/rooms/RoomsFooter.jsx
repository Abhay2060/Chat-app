export default function RoomsFooter() {
  return (
    <footer className="w-full border-t border-white/5 bg-[#0d0d0f]">
      <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-white font-black tracking-tight">
            Chat<span className="text-violet-400">Rooms</span>
          </span>
          <span className="text-zinc-700 text-sm">— connect with anyone, anywhere.</span>
        </div>
        <div className="flex items-center gap-5">
          {["Privacy", "Terms", "Support"].map((link) => (
            <a key={link} href="#" className="text-zinc-600 hover:text-zinc-300 text-sm transition-colors">{link}</a>
          ))}
        </div>
        <p className="text-zinc-700 text-xs">© {new Date().getFullYear()} ChatRooms. All rights reserved.</p>
      </div>
    </footer>
  );
}