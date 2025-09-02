// App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login/Login";
import Signup from "./components/Signup/Signup";
import Chat from "./components/Chat/Chat";          
import ProtectedRoute from "./routes/ProtectedRoute";
import PublicRoute from "./routes/PublicRoute";
import Settings from "./components/Settings/Settings";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<PublicRoute><Login/></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><Signup/></PublicRoute>} />
      <Route path="/chat" element={<ProtectedRoute><Chat/></ProtectedRoute>} />
      <Route path="/chat/:chatId" element={<ProtectedRoute><Chat/></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings/></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
