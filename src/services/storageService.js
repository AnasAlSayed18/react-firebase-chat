// src/services/storageService.js
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "../config/firebase";

export async function uploadUserAvatar(uid, file) {
  const ext = (file.name?.split(".").pop() || "jpg").toLowerCase();
  const path = `avatars/${uid}/avatar.${ext}`;
  const sref = ref(storage, path);

  await uploadBytes(sref, file, { contentType: file.type });
  const url = await getDownloadURL(sref);

  return { url, path };
}

export async function deleteByPath(path) {
  if (!path) return;
  try {
    const sref = ref(storage, path);
    await deleteObject(sref);
  } catch (e) {
    console.warn("deleteByPath:", e?.message || e);
  }
}
