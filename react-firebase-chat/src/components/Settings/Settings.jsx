// src/pages/Settings/Settings.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import "./Settings.css";

import LeftRail from "../../widgets/LeftRail/LeftRail";
import Sidebar from "../../widgets/Sidebar/Sidebar";
import ChatHeader from "../../widgets/ChatHeader/ChatHeader";

import { useNavigate } from "react-router-dom";
import {
  doc, getDoc, setDoc, updateDoc, serverTimestamp,
} from "firebase/firestore";
import { updateProfile, onAuthStateChanged } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage, auth, db } from "../../config/firebase";

import { uploadUserAvatar, deleteByPath } from "../../services/storageService";

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

export default function Settings() {
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width: 767px)");

  const [me, setMe] = useState(auth.currentUser || null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [displayName, setDisplayName] = useState("");
  const [status, setStatus] = useState("");
  const [email, setEmail] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [photoPath, setPhotoPath] = useState(""); 
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");

  const fileInputRef = useRef(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setMe(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    let ok = true;
    (async () => {
      try {
        setError(""); setSuccess("");
        if (!me?.uid) { setLoading(false); return; }

        setEmail(me.email || "");
        setDisplayName(me.displayName || "");
        setPhotoURL(me.photoURL || "");

        const refUser = doc(db, "users", me.uid);
        const snap = await getDoc(refUser);

        if (!snap.exists()) {
          await setDoc(
            refUser,
            {
              uid: me.uid,
              email: me.email || "",
              displayName: me.displayName || "",
              photoURL: me.photoURL || "",
              photoPath: "",         // ✅ seed storage path
              isOnline: true,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        } else {
          const u = snap.data() || {};
          if (u.displayName) setDisplayName(u.displayName);
          if (u.photoURL) setPhotoURL(u.photoURL);
          if (u.photoPath) setPhotoPath(u.photoPath); 
          if (u.status) setStatus(u.status);
        }
      } catch (e) {
        console.error(e);
        setError("Failed to load profile.");
      } finally {
        if (ok) setLoading(false);
      }
    })();
    return () => { ok = false; };
  }, [me?.uid]);

  const canSave = useMemo(
    () => !!me?.uid && !saving && !!displayName.trim(),
    [me?.uid, saving, displayName]
  );

  const onPickFile = () => fileInputRef.current?.click();

  const onFileChange = (e) => {
    const f = e.target.files?.[0];
    setFile(null); setPreview(""); setError(""); setSuccess("");
    if (!f) return;
    if (!f.type.startsWith("image/")) return setError("Please choose an image file.");
    if (f.size > 3 * 1024 * 1024) return setError("Image must be ≤ 3 MB.");
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!canSave) return;

    setSaving(true);
    setError(""); setSuccess("");

    try {
      const userRef = doc(db, "users", me.uid);
      // ensure doc exists
      await setDoc(userRef, { uid: me.uid }, { merge: true });

      let newPhotoURL = photoURL || "";
      let newPhotoPath = photoPath || "";

      if (file) {
        // replace previous avatar
        if (photoPath) {
          await deleteByPath(photoPath);
        }
        const { url, path } = await uploadUserAvatar(me.uid, file);
        newPhotoURL = url;
        newPhotoPath = path;
      } else {
        // if user pressed "Remove" and photoURL is empty, delete old file
        if (!photoURL && photoPath) {
          await deleteByPath(photoPath);
          newPhotoURL = "";
          newPhotoPath = "";
        }
      }

      // Update Auth profile
      await updateProfile(auth.currentUser, {
        displayName: displayName.trim(),
        photoURL: newPhotoURL || null,
      });

      // Update Firestore (url + path)
      await updateDoc(userRef, {
        displayName: displayName.trim(),
        status: status?.trim() || "",
        photoURL: newPhotoURL,
        photoPath: newPhotoPath,
        updatedAt: serverTimestamp(),
      });

      await auth.currentUser.reload();
      setMe(auth.currentUser);

      const bust = newPhotoURL ? `${newPhotoURL}?v=${Date.now()}` : "";
      setPhotoURL(bust);
      setPhotoPath(newPhotoPath);
      setFile(null);
      setPreview("");
      setSuccess("Profile saved successfully.");
    } catch (e) {
      console.error(e);
      setError(e?.message || "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  if (!me) {
    return (
      <div className="chat-layout">
        <nav className="left-rail-slot">
          {/* keep same look; highlight settings initially */}
          <LeftRail initial="settings" onChange={(id)=> {
            if(id==="chat"||id==="home") navigate("/chat");
            if(id==="settings") navigate("/settings");
          }}/>
        </nav>
        <aside className="chat-sidebar">
          <Sidebar onSelect={(id)=>navigate(`/chat/${id}`)} />
        </aside>
        <section className="chat-window">
          <div className="settings-panel">
            <div className="settings-card">Please sign in.</div>
          </div>
        </section>
      </div>
    );
  }

  // build header like chat
  const headerUser = {
    name: me.displayName || me.email?.split("@")[0] || "Me",
    status: "Online",
    photoURL: preview || photoURL || "",
  };

  return (
    <div className="chat-layout">
      <nav className="left-rail-slot">
        {/* highlight Settings on this page */}
        <LeftRail
          initial="settings"
          onChange={(id) => {
            if (id === "settings") return;        // already here
            if (id === "chat" || id === "home") return navigate("/chat");
          }}
        />
      </nav>

      {/* message list kept on the left like Chat */}
      <aside className="chat-sidebar">
        <Sidebar onSelect={(id) => navigate(`/chat/${id}`)} />
      </aside>

      {/* main settings area styled like chat window */}
      <section className="chat-window">
        <div className="ch">
          <ChatHeader user={headerUser} showBack={false} onBack={() => {}} />
        </div>

        <div className="settings-panel">
          <form className="settings-card" onSubmit={handleSave}>
            <h1 className="st-title">Account Settings</h1>

            {loading ? (
              <div className="st-row"><div className="st-loading">Loading…</div></div>
            ) : (
              <>
                {/* Avatar */}
                <div className="st-row st-avatar-row">
                  <div className="st-avatar">
                    {preview ? (
                      <img src={preview} alt="Preview" />
                    ) : photoURL ? (
                      <img src={photoURL} alt="Avatar" />
                    ) : (
                      <div className="st-avatar-fallback">
                        {(displayName || email || "U")
                          .split(" ").slice(0, 2).map(s => s[0] || "").join("").toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="st-avatar-actions">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={onFileChange}
                      hidden
                    />
                    <button type="button" className="st-btn outline" onClick={onPickFile}>
                      Change Photo
                    </button>
                    {(photoURL || preview) && (
                      <button
                        type="button"
                        className="st-btn text"
                        onClick={() => { setFile(null); setPreview(""); setPhotoURL(""); }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>

                {/* Name */}
                <div className="st-row">
                  <label>Display name</label>
                  <input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your name"
                    maxLength={60}
                  />
                </div>

                {/* Email */}
                <div className="st-row">
                  <label>Email</label>
                  <input value={email} readOnly />
                </div>

                {/* Status */}
                <div className="st-row">
                  <label>Status (optional)</label>
                  <input
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    placeholder="Online / Busy / …"
                    maxLength={120}
                  />
                </div>

                <div className="st-actions">
                  <button type="button" className="st-btn ghost" onClick={() => navigate(-1)}>Back</button>
                  <button type="submit" className={`st-btn primary ${!canSave ? "disabled" : ""}`} disabled={!canSave}>
                    {saving ? "Saving..." : "Save changes"}
                  </button>
                </div>

                {(error || success) && (
                  <div className={`st-alert ${error ? "err" : "ok"}`}>{error || success}</div>
                )}
              </>
            )}
          </form>
        </div>
      </section>
    </div>
  );
}
