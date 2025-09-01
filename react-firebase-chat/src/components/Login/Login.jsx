// src/components/Login/Login.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../../config/firebase";
import { ensureUserDoc } from "../../services/users";   // ✅ جديد
import googleIcon from "../../assets/google.png";
import appleIcon from "../../assets/apple.png";
import AuthLayout from "../AuthLayout/AuthLayout";
import "./Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);

      // تأكد وجود مستند المستخدم (لن يلمس createdAt إذا كان موجودًا)
      await ensureUserDoc(cred.user);

      navigate("/chat", { replace: true });
    } catch (err) {
      setError(err.message || "Login failed");
    }
  };

  const signinWithGoogle = async () => {
    setError("");
    try {
      const res = await signInWithPopup(auth, googleProvider);

      await ensureUserDoc(res.user);

      navigate("/chat", { replace: true });
    } catch (err) {
      setError(err.message || "Google sign-in failed");
    }
  };

  return (
    <AuthLayout>
      <div className="login-container">
        <h1>Welcome back!</h1>
        <p>Enter your credentials to access your account</p>

        <form className="login-form" onSubmit={onSubmit}>
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            className="login-email"
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <div className="remember-checkbox">
            <input type="checkbox" id="login-remember" />
            <label htmlFor="login-remember">Remember me for 30 days</label>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit">Login</button>

          <div className="divider">
            <span>Or</span>
          </div>

          <div className="auth-buttons">
            <button className="auth-button" type="button" onClick={signinWithGoogle}>
              <img src={googleIcon} alt="Google" /> Login with Google
            </button>
            <button className="auth-button" type="button">
              <img src={appleIcon} alt="Apple" /> Login with Apple
            </button>
          </div>
        </form>

        <p className="auth-footer">
          Don’t have an account? <Link to="/signup">Sign up</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
