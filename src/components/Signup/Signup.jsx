// src/components/Signup/Signup.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { auth, googleProvider } from "../../config/firebase";
import { ensureUserDoc } from "../../services/users";   // ✅ جديد
import googleIcon from "../../assets/google.png";
import appleIcon from "../../assets/apple.png";
import AuthLayout from "../AuthLayout/AuthLayout";
import "./Signup.css";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      // اختياري: حدث بروفايل Firebase Auth للاسم
      if (name) {
        await updateProfile(cred.user, { displayName: name });
      }

      // أنشئ/حدّث مستند المستخدم في Firestore
      await ensureUserDoc(cred.user, { displayName: name });

      navigate("/chat", { replace: true });
    } catch (err) {
      setError(err.message || "Signup failed");
    }
  };

const signinWithGoogle = async () => {
  setError("");
  try {
    const res = await signInWithPopup(auth, googleProvider);
    const user = res.user;

    // Update Firebase Auth profile (optional, but ensures displayName + photo)
    await updateProfile(user, {
      displayName: user.displayName || name || "",
      photoURL: user.photoURL || "",
    });

    // Save user data to Firestore explicitly including Google photoURL
    await ensureUserDoc(user, {
      displayName: user.displayName,
      photoURL: user.photoURL,
      isOnline: "Online",
    });

    navigate("/chat", { replace: true });
  } catch (err) {
    setError(err.message || "Google sign-in failed");
  }
};

  return (
    <AuthLayout>
      <div className="signup-container">
        <h1>Get Started Now</h1>

        <form className="signup-form" onSubmit={onSubmit}>
          <label htmlFor="signup-name">Name</label>
          <input
            id="signup-name"
            className="signup-name"
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <label htmlFor="signup-email">Email</label>
          <input
            id="signup-email"
            className="signup-email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label htmlFor="signup-password">Password</label>
          <input
            id="signup-password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div className="policy-checkbox">
            <input type="checkbox" id="signup-policy" required />
            <label htmlFor="signup-policy">
              I agree to the <Link to="/terms" className="terms-link">Terms & Policy</Link>
            </label>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit">Signup</button>

          <div className="divider"><span>Or</span></div>

          <div className="auth-buttons">
            <button className="auth-button" type="button" onClick={signinWithGoogle}>
              <img src={googleIcon} alt="Google" /> Sign up with Google
            </button>
            <button className="auth-button" type="button">
              <img src={appleIcon} alt="Apple" /> Sign up with Apple
            </button>
          </div>
        </form>

        <p className="auth-footer">
          Have an account? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
