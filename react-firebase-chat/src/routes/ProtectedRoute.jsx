import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { auth } from "../config/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function ProtectedRoute({ children }) {
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
  if (!u) return <Navigate to="/login" replace />;
  return children;
}
