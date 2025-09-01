import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./Chat.css";

import Sidebar from "../../widgets/Sidebar/Sidebar";
import ChatHeader from "../../widgets/ChatHeader/ChatHeader";
import MessageList from "../../widgets/MessageList/MessageList";
import MessageInput from "../../widgets/MessageInput/MessageInput";
import LeftRail from "../../widgets/LeftRail/LeftRail";

import { auth, db } from "../../config/firebase";
import {
  listenChats,
  listenMessages,
  sendMessage,
} from "../../services/chatService";

import { doc, getDoc, onSnapshot } from "firebase/firestore";

// Custom hook for media query
function useMediaQuery(query) {
  const get = () => window.matchMedia(query).matches;
  const [matches, setMatches] = useState(get());
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = (e) => setMatches(e.matches);
    try { mql.addEventListener("change", onChange); }
    catch { mql.addListener(onChange); }
    return () => {
      try { mql.removeEventListener("change", onChange); }
      catch { mql.removeListener(onChange); }
    };
  }, [query]);
  return matches;
}

export default function Chat() {
  const navigate = useNavigate();
  const { chatId } = useParams();

  const [chats, setchats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [peer, setPeer] = useState(null);

  const isMobile = useMediaQuery("(max-width: 767px)");

  // Listen to chats
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    const unsub = listenChats(currentUser.uid, (list) => {
      setchats(list);
      if (!isMobile && !chatId && list.length) {
        navigate(`/chat/${list[0].id}`, { replace: true });
      }
    });
    return () => unsub?.();
  }, [chatId, isMobile, navigate]);

  // Listen to messages for the selected chat
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser || !chatId) { setMessages([]); return; }
    const unsub = listenMessages(chatId, currentUser.uid, (newMessages) => {
      setMessages(newMessages); // Update the messages in real-time
    });
    return () => unsub?.();
  }, [chatId]);

  // Fetch peer user data for the chat header
  useEffect(() => {
    let unsubUser = null;

    async function loadPeer() {
      setPeer(null);
      if (!chatId) return;

      try {
        const snap = await getDoc(doc(db, "chats", chatId));
        if (!snap.exists()) return;

        const data = snap.data() || {};
        const myUid = auth.currentUser?.uid;
        const participants = data.participants || [];
        const otherUid = participants.find((p) => p !== myUid) || participants[0];

        if (!otherUid) return;

        // Listen for the other user's status
        unsubUser = onSnapshot(doc(db, "users", otherUid), (uSnap) => {
          const u = uSnap.exists() ? uSnap.data() : null;
          setPeer(
            u
              ? {
                  name: u.displayName || u.name || "User",
                  status: u.isOnline ? "Online" : (u.status || ""),
                  photoURL: u.photoURL || "",
                }
              : { name: "User", status: "", photoURL: "" }
          );
        });
      } catch (err) {
        console.error("Failed to load peer user:", err);
      }
    }

    loadPeer();
    return () => unsubUser?.();
  }, [chatId]);

  const active = useMemo(
    () => chats.find((c) => c.id === chatId) || null,
    [chats, chatId]
  );

  const headerUser = peer || {
    name: active?.user?.name || "",
    status: active?.user?.status || "",
    photoURL: active?.user?.avatar || "",
  };

  const showSidebar = !isMobile || !chatId;
  const showChat = !isMobile || !!chatId;

  // Handle back button on mobile
  const handleBack = () => navigate("/chat");

  // Send a message
  const handleSend = async (text) => {
    if (!text.trim() || !chatId) return;
    const u = auth.currentUser;
    if (!u) return;
    await sendMessage(chatId, u.uid, text); // Send message to Firestore
  };

  // Define openConversation to handle selecting a conversation
  const openConversation = (id) => {
    navigate(`/chat/${id}`);
  };

  return (
    <div className="chat-layout">
      <nav className="left-rail-slot">
  <LeftRail
    onChange={(id) => {
      if (id === "settings") return navigate("/settings");
      if (id === "chat" || id === "home") return navigate("/chat");
    }}
  />
</nav>
      {showSidebar && (
        <aside className="chat-sidebar">
          <Sidebar activeId={chatId} onSelect={openConversation} />
        </aside>
      )}

      {showChat && (
  <section className="chat-window">
    <ChatHeader
      user={headerUser}
      showBack={isMobile && !!chatId}
      onBack={handleBack}
    />

    {chatId && messages.length === 0 ? (
      // No messages yet, show placeholder
      <div className="chat-placeholder">
        <p>Select a user to start the chat</p>
      </div>
    ) : chatId ? (
      // Messages exist
      <MessageList messages={messages} />
    ) : (
      // No chat selected (on desktop)
      <div className="chat-placeholder">
        <p>Select a user to start the chat</p>
      </div>
    )}

    {/* Only show input if a chat is selected */}
    {chatId && <MessageInput onSend={handleSend} />}
  </section>
)}

    </div>
  );
}
