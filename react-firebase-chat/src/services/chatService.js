import {
  collection,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  serverTimestamp
} from "firebase/firestore";
import { db } from "../config/firebase";





export async function sendMessage(chatId, senderId, messageText) {
  const chatRef = doc(db, "chats", chatId); // Reference to the chat document
  const messagesRef = collection(chatRef, "messages"); // Messages subcollection

  // Create the new message object
  const newMessage = {
    text: messageText,
    senderId: senderId,
    createdAt: serverTimestamp(), // Automatically sets the timestamp when the message is created
  };

  try {
    // Add new message to the messages subcollection
    await addDoc(messagesRef, newMessage);

    // Update the main chat document with last text and sender information
    await updateDoc(chatRef, {
      lastText: messageText,
      lastSender: senderId,
      updatedAt: serverTimestamp(),
    });

    console.log("Message sent successfully!");
  } catch (error) {
    console.error("Error sending message: ", error);
  }
}


export async function findOrCreateDirectChat(myUid, otherUid) {
  if (!myUid || !otherUid || myUid === otherUid) throw new Error("Invalid UIDs");

  const q = query(
    collection(db, "chats"),
    where("participants", "array-contains", myUid),
    orderBy("updatedAt", "desc")
  );
  const snap = await getDocs(q);

  let existingId = null;
  snap.forEach((doc) => {
    const participants = doc.data()?.participants || [];
    if (participants.includes(otherUid)) existingId = doc.id;
  });

  if (existingId) {
    // If chat already exists, return the existing chat ID
    return { id: existingId };
  }

  // Fetch the other user's name and avatar for new chat creation
  let otherName = "";
  let otherAvatar = "";
  try {
    const uSnap = await getDoc(doc(db, "users", otherUid));
    if (uSnap.exists()) {
      const u = uSnap.data();
      otherName = u.displayName || "User";
      otherAvatar = u.photoURL || "";
    }
  } catch (err) {
    console.error("Failed to fetch other user profile:", err);
  }

  const now = serverTimestamp();

  // Create a new chat document with the updated structure
  const newDoc = await addDoc(collection(db, "chats"), {
    participants: [myUid, otherUid],
    lastText: "",          
    lastSender: null,      
    updatedAt: now,
    createdAt: now,
    otherName,
    otherAvatar,
  });

  return { id: newDoc.id }; // Return new chat ID
}



export function listenChats(myUid, onData) {
  const q = query(
    collection(db, "chats"),
    where("participants", "array-contains", myUid),
    orderBy("updatedAt", "desc")
  );

  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) => {
      const data = d.data() || {};
      const participants = data.participants || [];
      const otherUid = participants.find((p) => p !== myUid) || participants[0];

      return {
        id: d.id,
        otherUid,
        lastText: data.lastText || "",
        lastSender: data.lastSender || null,
        lastTime: fmtTime(data.updatedAt),
        updatedAt: data.updatedAt,
      };
    });

    onData(items);
  });
}


export function listenMessages(chatId, myUid, onData) {
  if (!chatId) return () => {};

  const chatRef = doc(db, "chats", chatId);
  const messagesRef = collection(chatRef, "messages");

  const q = query(messagesRef, orderBy("createdAt", "asc"));

  return onSnapshot(q, (snap) => {
    const list = snap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        me: data.senderId === myUid,        
        text: data.text || "",
        time: fmtTime(data.createdAt?.toDate?.() || new Date()),
      };
    });

    onData(list); // Pass the chronologically ordered messages
  });
}



export function listenUser(uid, cb) {
  if (!uid) return () => { };
  const ref = doc(db, "users", uid);
  return onSnapshot(ref, (snap) => {
    const u = snap.exists() ? snap.data() : null;
    cb(u ? {
      name: u.displayName || "User",
      status: u.isOnline ? "Online" : (u.status || ""),
      photoURL: u.photoURL || "",
      email: u.email || "",
    } : { name: "User", status: "", photoURL: "" });
  });
}
const pad2 = (n) => String(n).padStart(2, "0");
const fmtTime = (dateLike) => {
  if (!dateLike) return "";
  const d = dateLike instanceof Date ? dateLike : (dateLike.toDate?.() || new Date(dateLike));
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};