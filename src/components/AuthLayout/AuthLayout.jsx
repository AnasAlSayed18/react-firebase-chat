import back from "../../assets/back.jpg";
import "./AuthLayout.css";

export default function AuthLayout({ children, image = back }) {
  return (
    <div className="auth-layout">
      <div className="auth-left">{children}</div>

      <section className="auth-right">
        <img src={image} alt="Auth visual" />
      </section>
    </div>
  );
}
