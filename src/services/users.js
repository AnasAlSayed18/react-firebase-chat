// src/services/users.js
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../config/firebase";


export async function ensureUserDoc(user, overrides = {}) {
  if (!user?.uid) return;

  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  const fallbackName =
    overrides.displayName ||
    user.displayName ||
    (user.email ? user.email.split("@")[0] : "User");

  const base = {
    uid: user.uid,
    displayName: fallbackName,
    email: user.email || "",
    photoURL: overrides.photoURL || user.photoURL || "", 
    isOnline: overrides.isOnline ?? "Online",
    ...overrides,
  };

  if (!snap.exists()) {
    base.createdAt = serverTimestamp();
  }

  await setDoc(ref, base, { merge: true });
}


