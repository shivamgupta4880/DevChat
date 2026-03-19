import { useState, useRef, useEffect } from "react";
import { Smile } from "lucide-react";

const EMOJI_CATEGORIES = {
  "😊 Smileys": ["😀","😃","😄","😁","😆","😅","🤣","😂","🙂","😉","😊","😇","🥰","😍","🤩","😘","😗","😚","😙","🥲"],
  "👍 People": ["👋","🤚","✋","🖖","👌","🤌","✌️","🤞","🤟","🤘","👈","👉","👆","👇","☝️","👍","👎","✊","👊","🤛"],
  "❤️ Hearts": ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","❤️‍🔥","💔","❣️","💕","💞","💓","💗","💖","💘","💝","💟"],
  "🎉 Fun": ["🎉","🎊","🎈","🎁","🎀","🏆","🥇","🎯","🎮","🎲","🃏","🎭","🎨","🎤","🎵","🎶","🔥","💯","✨","⭐"],
  "💻 Dev": ["💻","🖥️","⌨️","🖱️","📱","🔌","💾","💿","📀","🖨️","🔋","📡","🔭","🔬","⚙️","🔧","🔩","🛠️","💡","🚀"],
};

const EmojiPicker = ({ onSelect }) => {
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("😊 Smileys");
  const pickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={pickerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`p-2 rounded-lg transition-colors ${open ? "text-indigo-400 bg-indigo-500/10" : "text-gray-400 hover:text-gray-200 hover:bg-gray-700"}`}
        title="Add emoji"
      >
        <Smile size={20} />
      </button>

      {open && (
        <div className="absolute bottom-12 right-0 w-80 rounded-xl border border-gray-700 bg-gray-900 shadow-2xl z-50 overflow-hidden">
          {/* Category tabs */}
          <div className="flex overflow-x-auto border-b border-gray-700 p-1 gap-0.5 scrollbar-none">
            {Object.keys(EMOJI_CATEGORIES).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-2 py-1.5 text-base rounded-lg flex-shrink-0 transition-colors ${
                  activeCategory === cat ? "bg-indigo-500/20 text-white" : "text-gray-400 hover:bg-gray-800"
                }`}
                title={cat}
              >
                {cat.split(" ")[0]}
              </button>
            ))}
          </div>

          {/* Category label */}
          <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-800">
            {activeCategory.split(" ").slice(1).join(" ")}
          </div>

          {/* Emoji grid */}
          <div className="grid grid-cols-10 gap-0 p-2 max-h-48 overflow-y-auto">
            {EMOJI_CATEGORIES[activeCategory].map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => { onSelect(emoji); setOpen(false); }}
                className="text-xl p-1 rounded hover:bg-gray-700 transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmojiPicker;
