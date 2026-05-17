import { useRef, useState } from "react";
import { useChatStore }     from "../store/useChatStore";
import useKeyboardSound     from "../hooks/useKeyboardSound";
import toast                from "react-hot-toast";

export default function MessageInput() {
  const { sendMessage, isSoundEnabled } = useChatStore();
  const { playRandomKeyStrokeSound }    = useKeyboardSound();

  const [text,         setText]         = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;
    if (isSoundEnabled) playRandomKeyStrokeSound();
    sendMessage({ text: text.trim(), image: imagePreview });
    setText("");
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file?.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex-shrink-0 px-5 py-4 border-t border-white/5 bg-[#0d0d0f]">

      {/* Image preview */}
      {imagePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <img src={imagePreview} alt="Preview" className="w-16 h-16 object-cover rounded-xl border border-white/10" />
            <button
              onClick={() => { setImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white text-xs"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSend} className="flex items-center gap-2">
        {/* Image button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors flex-shrink-0 ${
            imagePreview
              ? "bg-violet-500/20 text-violet-400 border border-violet-500/30"
              : "bg-white/5 text-zinc-500 hover:text-white hover:bg-white/10 border border-white/5"
          }`}
        >
          🖼
        </button>
        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />

        {/* Text input */}
        <input
          type="text"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (isSoundEnabled) playRandomKeyStrokeSound();
          }}
          placeholder="Type a message..."
          className="flex-1 bg-[#1a1a1e] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-violet-500/40 transition-colors"
        />

        {/* Send button */}
        <button
          type="submit"
          disabled={!text.trim() && !imagePreview}
          className="w-10 h-10 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors flex-shrink-0"
        >
          <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </form>
    </div>
  );
}