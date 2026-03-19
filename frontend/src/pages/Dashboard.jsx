import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useSocket } from "../context/SocketContext";
import { Hash, Users, LogOut, Send, MessageSquare } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import EmojiPicker from "../components/EmojiPicker";

const CHANNELS = [
  { name: "General", description: "General discussion for everyone" },
  { name: "Dev", description: "Development talk, code reviews, and tech discussions" },
  { name: "Random", description: "Memes, fun stuff, and off-topic chatter" },
];

// Deterministic avatar color from name
const AVATAR_COLORS = [
  "bg-indigo-500", "bg-blue-500", "bg-purple-500", "bg-pink-500",
  "bg-green-600", "bg-teal-500", "bg-orange-500", "bg-red-500",
];
const getAvatarColor = (name = "") => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
};

const Avatar = ({ name, size = "w-9 h-9", textSize = "text-sm" }) => (
  <div className={`${size} ${getAvatarColor(name)} rounded-full flex items-center justify-center font-bold ${textSize} text-white flex-shrink-0 select-none`}>
    {name?.charAt(0)?.toUpperCase() || "?"}
  </div>
);

const formatDateDivider = (date) => {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMMM d, yyyy");
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const [user, setUser] = useState(null);
  const [activeChannel, setActiveChannel] = useState("General");
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [typingUsers, setTypingUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef({});
  const isTypingRef = useRef(false);
  const activeChannelRef = useRef("General");

  // Keep ref in sync with state for socket callbacks
  useEffect(() => {
    activeChannelRef.current = activeChannel;
  }, [activeChannel]);

  // Load user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) { navigate("/"); return; }
    setUser(JSON.parse(storedUser));
  }, [navigate]);

  // Setup socket listeners (only once)
  useEffect(() => {
    if (!socket) return;

    const handleMessage = (msg) => {
      if (msg.channel === activeChannelRef.current) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    const handleUserTyping = (name) => {
      setTypingUsers((prev) => prev.includes(name) ? prev : [...prev, name]);
      // Clear previous timeout for this user
      if (typingTimeoutRef.current[name]) clearTimeout(typingTimeoutRef.current[name]);
      typingTimeoutRef.current[name] = setTimeout(() => {
        setTypingUsers((prev) => prev.filter((u) => u !== name));
      }, 3000);
    };

    const handleStopTyping = (name) => {
      if (typingTimeoutRef.current[name]) clearTimeout(typingTimeoutRef.current[name]);
      setTypingUsers((prev) => prev.filter((u) => u !== name));
    };

    const handleUsersOnline = (users) => {
      setOnlineUsers(users);
    };

    socket.on("receive_message", handleMessage);
    socket.on("user_typing", handleUserTyping);
    socket.on("user_stop_typing", handleStopTyping);
    socket.on("users_online", handleUsersOnline);

    return () => {
      socket.off("receive_message", handleMessage);
      socket.off("user_typing", handleUserTyping);
      socket.off("user_stop_typing", handleStopTyping);
      socket.off("users_online", handleUsersOnline);
    };
  }, [socket]);

  // Connect socket & register user when user is available
  useEffect(() => {
    if (!socket || !user) return;
    socket.connect();
    socket.emit("register_user", { userId: user.id, name: user.name });
  }, [socket, user]);

  // Join channel & fetch messages on channel change
  useEffect(() => {
    if (!user) return;

    const fetchMessages = async () => {
      setLoadingMessages(true);
      setMessages([]);
      setTypingUsers([]);
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`/api/messages/${activeChannel}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMessages(res.data);
      } catch (err) {
        console.error("Failed to fetch messages:", err);
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchMessages();
    if (socket) socket.emit("join_room", activeChannel);
  }, [activeChannel, user, socket]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  const handleSendMessage = useCallback((e) => {
    e.preventDefault();
    if (!messageText.trim() || !socket || !user) return;
    socket.emit("send_message", {
      channel: activeChannel,
      text: messageText.trim(),
      senderId: user.id,
      senderName: user.name,
    });
    // Stop typing
    socket.emit("stop_typing", { channel: activeChannel, name: user.name });
    isTypingRef.current = false;
    setMessageText("");
  }, [messageText, socket, user, activeChannel]);

  const handleInputChange = useCallback((e) => {
    setMessageText(e.target.value);
    if (!socket || !user) return;
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit("typing", { channel: activeChannel, name: user.name });
    }
    // Clear existing stop-typing timeout
    if (typingTimeoutRef.current._self) clearTimeout(typingTimeoutRef.current._self);
    typingTimeoutRef.current._self = setTimeout(() => {
      socket.emit("stop_typing", { channel: activeChannel, name: user.name });
      isTypingRef.current = false;
    }, 2000);
  }, [socket, user, activeChannel]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      handleSendMessage(e);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    if (socket) socket.disconnect();
    navigate("/");
  };

  // Group messages: show avatar/name only if prev sender is different or >5min gap
  const shouldShowHeader = (msg, idx) => {
    if (idx === 0) return true;
    const prev = messages[idx - 1];
    if (prev.sender?._id !== msg.sender?._id) return true;
    const timeDiff = new Date(msg.createdAt) - new Date(prev.createdAt);
    return timeDiff > 5 * 60 * 1000;
  };

  const shouldShowDateDivider = (msg, idx) => {
    if (idx === 0) return true;
    const prev = messages[idx - 1];
    const prevDate = new Date(prev.createdAt);
    const currDate = new Date(msg.createdAt);
    return prevDate.toDateString() !== currDate.toDateString();
  };

  const channelInfo = CHANNELS.find((c) => c.name === activeChannel);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}>
      
      {/* ── Left Sidebar ── */}
      <div className="w-60 flex flex-col flex-shrink-0" style={{ background: "var(--bg-secondary)", borderRight: "1px solid var(--border-color)" }}>
        {/* App Header */}
        <div className="px-4 py-3 flex items-center gap-2.5 border-b" style={{ borderColor: "var(--border-color)" }}>
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <MessageSquare size={16} className="text-white" />
          </div>
          <span className="font-bold text-white text-base tracking-tight">DevChat</span>
        </div>

        {/* Channels */}
        <div className="flex-1 overflow-y-auto py-4">
          <div className="px-4 mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Channels
            </span>
          </div>
          <ul className="space-y-0.5 px-2">
            {CHANNELS.map(({ name }) => (
              <li key={name}>
                <button
                  onClick={() => setActiveChannel(name)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
                    ${activeChannel === name
                      ? "bg-indigo-600/20 text-indigo-300"
                      : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                    }`}
                >
                  <Hash size={16} className={activeChannel === name ? "text-indigo-400" : "opacity-60"} />
                  {name}
                  {activeChannel === name && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400" />}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* User Profile Footer */}
        <div className="p-3 border-t flex items-center gap-2.5" style={{ borderColor: "var(--border-color)", background: "var(--bg-tertiary)" }}>
          <div className="relative flex-shrink-0">
            <Avatar name={user?.name} size="w-8 h-8" textSize="text-xs" />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 online-dot" style={{ borderColor: "var(--bg-tertiary)" }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">{user?.name}</div>
            <div className="text-xs text-green-400">Online</div>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            className="p-1.5 rounded-md transition-colors text-gray-500 hover:text-red-400 hover:bg-red-500/10"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* ── Main Chat ── */}
      <div className="flex-1 flex flex-col overflow-hidden" style={{ background: "var(--bg-secondary)" }}>
        {/* Chat Header */}
        <div className="px-5 py-3 flex items-center gap-3 border-b flex-shrink-0" style={{ borderColor: "var(--border-color)" }}>
          <Hash size={20} className="text-gray-400" />
          <div>
            <span className="font-semibold text-white">{activeChannel}</span>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{channelInfo?.description}</p>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {loadingMessages ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-3">
                <svg className="animate-spin h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                <span className="text-sm" style={{ color: "var(--text-muted)" }}>Loading messages...</span>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <Hash size={32} className="text-indigo-400 opacity-60" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-white">Welcome to #{activeChannel}</p>
                <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                  This is the very beginning of the <strong className="text-gray-400">#{activeChannel}</strong> channel.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-0.5">
              {messages.map((msg, idx) => {
                const showHeader = shouldShowHeader(msg, idx);
                const showDate = msg.createdAt && shouldShowDateDivider(msg, idx);
                return (
                  <div key={msg._id || idx}>
                    {/* Date divider */}
                    {showDate && msg.createdAt && (
                      <div className="flex items-center gap-3 my-4">
                        <div className="flex-1 h-px" style={{ background: "var(--border-color)" }} />
                        <span className="text-xs font-medium px-2 rounded-full py-0.5 border" style={{ color: "var(--text-muted)", borderColor: "var(--border-color)" }}>
                          {formatDateDivider(new Date(msg.createdAt))}
                        </span>
                        <div className="flex-1 h-px" style={{ background: "var(--border-color)" }} />
                      </div>
                    )}
                    {/* Message row */}
                    <div className={`message-row flex gap-3 px-2 py-0.5 rounded-lg ${showHeader ? "mt-3" : "mt-0"} hover:bg-white/[0.02] group`}>
                      {/* Avatar column */}
                      <div className="w-9 flex-shrink-0 flex items-start pt-0.5">
                        {showHeader ? (
                          <Avatar name={msg.sender?.name} />
                        ) : (
                          <span className="w-9 text-center text-xs opacity-0 group-hover:opacity-100 transition-opacity select-none" style={{ color: "var(--text-muted)" }}>
                            {msg.createdAt ? format(new Date(msg.createdAt), "HH:mm") : ""}
                          </span>
                        )}
                      </div>
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {showHeader && (
                          <div className="flex items-baseline gap-2 mb-0.5">
                            <span className="font-semibold text-sm text-white">{msg.sender?.name || "Unknown"}</span>
                            {msg.createdAt && (
                              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                                {format(new Date(msg.createdAt), "HH:mm")}
                              </span>
                            )}
                          </div>
                        )}
                        <p className="text-sm leading-relaxed break-words" style={{ color: "var(--text-primary)" }}>
                          {msg.text}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Typing Indicator */}
          {typingUsers.length > 0 && (
            <div className="flex items-center gap-2 px-2 mt-2">
              <div className="flex items-center gap-0.5">
                <div className="typing-dot w-1.5 h-1.5 rounded-full bg-indigo-400" />
                <div className="typing-dot w-1.5 h-1.5 rounded-full bg-indigo-400" />
                <div className="typing-dot w-1.5 h-1.5 rounded-full bg-indigo-400" />
              </div>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                <strong className="text-gray-400">{typingUsers.join(", ")}</strong>{" "}
                {typingUsers.length === 1 ? "is" : "are"} typing...
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="px-4 pb-4 pt-2 flex-shrink-0">
          <form
            onSubmit={handleSendMessage}
            className="flex items-center gap-2 rounded-xl px-3 py-2 border"
            style={{ background: "var(--bg-hover)", borderColor: "var(--border-color)" }}
          >
            <EmojiPicker onSelect={(emoji) => setMessageText((prev) => prev + emoji)} />
            <input
              type="text"
              value={messageText}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={`Message #${activeChannel}`}
              className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none py-1"
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={!messageText.trim()}
              className="p-2 rounded-lg transition-all bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-indigo-600"
              title="Send message"
            >
              <Send size={16} className="text-white" />
            </button>
          </form>
          <p className="text-xs mt-1.5 text-center" style={{ color: "var(--text-muted)" }}>
            Press <kbd className="px-1 py-0.5 rounded text-xs border" style={{ borderColor: "var(--border-color)" }}>Enter</kbd> to send
          </p>
        </div>
      </div>

      {/* ── Right Sidebar — Members ── */}
      <div className="w-56 flex-shrink-0 hidden lg:flex flex-col" style={{ background: "var(--bg-secondary)", borderLeft: "1px solid var(--border-color)" }}>
        <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: "var(--border-color)" }}>
          <Users size={16} className="text-gray-400" />
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            Members
          </span>
        </div>
        <div className="flex-1 overflow-y-auto py-3 px-3">
          {/* Online users */}
          {onlineUsers.length > 0 && (
            <div className="mb-4">
              <div className="text-xs font-semibold uppercase tracking-wider mb-2 px-1" style={{ color: "var(--text-muted)" }}>
                Online — {onlineUsers.length}
              </div>
              <ul className="space-y-0.5">
                {onlineUsers.map((u) => (
                  <li
                    key={u.socketId || u.userId}
                    className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <div className="relative flex-shrink-0">
                      <Avatar name={u.name} size="w-8 h-8" textSize="text-xs" />
                      <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-[1.5px] online-dot" style={{ borderColor: "var(--bg-secondary)" }} />
                    </div>
                    <span className="text-sm font-medium truncate text-gray-300">
                      {u.name}
                      {u.userId === user?.id && <span className="ml-1 text-xs text-gray-500">(you)</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Current user always shown */}
          {onlineUsers.length === 0 && user && (
            <div className="mb-4">
              <div className="text-xs font-semibold uppercase tracking-wider mb-2 px-1" style={{ color: "var(--text-muted)" }}>
                Online — 1
              </div>
              <ul>
                <li className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors">
                  <div className="relative flex-shrink-0">
                    <Avatar name={user.name} size="w-8 h-8" textSize="text-xs" />
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-[1.5px] online-dot" style={{ borderColor: "var(--bg-secondary)" }} />
                  </div>
                  <span className="text-sm font-medium truncate text-gray-300">
                    {user.name} <span className="text-xs text-gray-500">(you)</span>
                  </span>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;