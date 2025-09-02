import { useEffect, useMemo, useState } from "react";
import "./Sidebar.css";

import { getAuth } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { onSnapshot, collection } from "firebase/firestore";
import { db } from "../../config/firebase";
import {
  listenChats,
  findOrCreateDirectChat
} from "../../services/chatService";
export default function Sidebar({ activeId, onSelect }) {
  const auth = getAuth();
  const me = auth.currentUser;
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [chatsMap, setChatsMap] = useState({}); // otherUid -> { chatId, lastText, updatedAt }

  useEffect(() => {
    if (!me?.uid) return;
    const unsub = onSnapshot(
      collection(db, "users"),
      (snap) => {
        const list = [];
        snap.forEach((d) => {
          const u = { id: d.id, ...d.data() };
          if (u.id !== me.uid) list.push(u);
        });
        list.sort((a, b) => {
          if ((a.isOnline ? 1 : 0) === (b.isOnline ? 1 : 0)) {
            return (a.displayName || "").localeCompare(b.displayName || "");
          }
          return (b.isOnline ? 1 : 0) - (a.isOnline ? 1 : 0);
        });
        setUsers(list);
      },
      (err) => console.error("Users snapshot error:", err)
    );
    return () => unsub();
  }, [me?.uid]);

  useEffect(() => {
    if (!me?.uid) return;
    const unsub = listenChats(me.uid, (items) => {
      const map = {};
      items.forEach((c) => {
        map[c.otherUid] = {
          chatId: c.id,
          lastText: c.lastText,
          updatedAt: c.updatedAt,
        };
      });
      setChatsMap(map);
    });
    return () => unsub();
  }, [me?.uid]);

  const filteredUsers = useMemo(() => {
    const s = search?.trim()?.toLowerCase();
    if (!s) return users;
    return users.filter((u) =>
      (u.displayName || "").toLowerCase().includes(s)
    );
  }, [users, search]);

  const openOrCreateDirectChatHandler = async (otherUid) => {
    if (!me?.uid || !otherUid) return;
    try {
      const chat = await findOrCreateDirectChat(me.uid, otherUid);
      onSelect?.(chat.id);
      navigate(`/chat/${chat.id}`);
    } catch (err) {
      console.error("Failed to open or create chat:", err);
    }
  };

  const getTime = (t) => {
    if (!t) return "";
    try {
      if (t.toDate) return t.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      if (t._seconds) return new Date(t._seconds * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      return new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  return (
    <div className="sb">
      <div className="sb-header">
        <h2>Messages</h2>
        <div className="sb-search">
          <input
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="sb-list">
        {filteredUsers.length === 0 && <div className="sb-empty">No users found.</div>}
        {filteredUsers
          .sort((a, b) => {
            const aTime = chatsMap[a.id]?.updatedAt ? getTime(chatsMap[a.id]?.updatedAt) : 0;
            const bTime = chatsMap[b.id]?.updatedAt ? getTime(chatsMap[b.id]?.updatedAt) : 0;
            return bTime - aTime; 
          })
          .map((u) => {
            const chat = chatsMap[u.id];
            const time = getTime(chat?.updatedAt);
            const hasPhoto = !!u.photoURL;

            return (
              <button
                key={u.id}
                className={`sb-item ${activeId && chat?.chatId === activeId ? "active" : ""}`}
                onClick={() => openOrCreateDirectChatHandler(u.id)}
                title={u.isOnline ? "Online" : "Offline"}
              >
                <div className={`sb-avatar ${u.isOnline ? "online" : ""}`}>
                  {hasPhoto ? (
                    <img src={u.photoURL} alt={u.displayName || "user"} />
                  ) : (
                    initials(u.displayName || "U")
                  )}
                </div>

                <div className="sb-meta">
                  <div className="sb-row">
                    <span className="sb-name">{u.displayName || "User"}</span>
                    <span className="sb-time">{time || (u.isOnline ? "Online" : "")}</span>
                  </div>
                  <div className="sb-last">
                    {chat?.lastText || u.email || "No messages yet"}
                  </div>
                </div>
              </button>
            );
          })}
      </div>
    </div>
  );
}

/* Helpers */
function initials(name = "") {
  return name
    .split(" ")
    .slice(0, 2)
    .map((s) => s[0] || "")
    .join("")
    .toUpperCase();
}
