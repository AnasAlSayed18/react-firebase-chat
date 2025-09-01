import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { auth } from "../config/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function PublicRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [u, setU] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setU(user);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) return null;
  if (u) return <Navigate to="/chat" replace />;
  return children;
}
