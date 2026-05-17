import { useState, useRef } from "react";
import { useRoomStore } from "../../../store/useRoomStore";
import useKeyboardSound from "../../../hooks/useKeyboardSound";
import toast from "react-hot-toast";

export default function RoomMessageInput() {
  const { sendRoomMessage, activeRoom } = useRoomStore();
  const { playRandomKeyStrokeSound } = useKeyboardSound();

  const [text, setText]         = useState("");
  const [imagePreview, setImagePreview] = useState(null); // base64 preview
  const [isSending, setIsSending]       = useState(false);
  const fileInputRef = useRef(null);

  const accent = activeRoom?.accentColor || "#4f8ef7";

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;
    if (isSending) return;

    setIsSending(true);
    try {
      await sendRoomMessage({ text: text.trim(), image: imagePreview });
      setText("");
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e) => {
    playRandomKeyStrokeSound();
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  return (
    <div className="px-4 py-3 border-t border-white/5 bg-[#111113] flex-shrink-0">

      {/* Image preview */}
      {imagePreview && (
        <div className="mb-3 relative inline-block">
          <img src={imagePreview} alt="preview" className="h-20 rounded-xl object-cover border border-white/10" />
          <button
            onClick={removeImage}
            className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-zinc-800 border border-white/10 text-zinc-400 hover:text-white text-xs flex items-center justify-center"
          >
            ✕
          </button>
        </div>
      )}

      <form onSubmit={handleSend} className="flex items-end gap-2">

        {/* Image attach button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
        >
          📎
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />

        {/* Text input */}
        <textarea
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Message ${activeRoom?.name || "room"}...`}
          className="flex-1 bg-[#1a1a1e] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-white/20 resize-none transition-colors leading-relaxed max-h-32"
          style={{ scrollbarWidth: "none" }}
        />

        {/* Send button */}
        <button
          type="submit"
          disabled={isSending || (!text.trim() && !imagePreview)}
          className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-xl text-white text-sm font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ background: accent, boxShadow: `0 0 12px ${accent}40` }}
        >
          {isSending ? "⏳" : "↑"}
        </button>
      </form>
    </div>
  );
}