import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

declare global {
  interface Window { google: any; }
}

export default function Login() {
  const navigate  = useNavigate();
  const location  = useLocation();

  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError]             = useState("");
  const [verifiedMsg, setVerifiedMsg] = useState("");
  const [unverified, setUnverified]   = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMsg, setResendMsg]     = useState("");

  // Show success message if redirected from email verification
  useEffect(() => {
    if (location.search.includes("verified=true")) {
      setVerifiedMsg("✅ Email verified! You can now sign in.");
    }
  }, [location]);

  // ── Google Sign-In ──────────────────────────────────────────────────────
  const handleGoogleResponse = useCallback(
    async (response: { credential: string }) => {
      setGoogleLoading(true);
      setError("");
      try {
        const res = await axios.post("/api/auth/google", { credential: response.credential });
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        navigate("/");
      } catch (err: any) {
        setError(err.response?.data?.msg || "Google sign-in failed. Please try again.");
      } finally {
        setGoogleLoading(false);
      }
    },
    [navigate]
  );

  useEffect(() => {
    const init = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
        });
        window.google.accounts.id.renderButton(
          document.getElementById("google-login-btn"),
          { theme: "outline", size: "large", width: "100%", text: "signin_with", shape: "rectangular" }
        );
      }
    };
    const timer = setTimeout(init, 300);
    return () => clearTimeout(timer);
  }, [handleGoogleResponse]);

  // ── Email/password login ────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    setError("");
    setUnverified(false);
    try {
      const res = await axios.post("/api/auth/login", { email, password });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      navigate("/");
    } catch (err: any) {
      const msg = err.response?.data?.msg || "Login failed. Please try again.";
      setError(msg);
      if (err.response?.data?.unverified) setUnverified(true);
    } finally {
      setLoading(false);
    }
  };

  // ── Resend verification email ───────────────────────────────────────────
  const handleResend = async () => {
    setResendLoading(true);
    setResendMsg("");
    try {
      const res = await axios.post("/api/auth/resend-verification", { email });
      setResendMsg(res.data.msg);
    } catch {
      setResendMsg("Failed to resend. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.bgOrb1} />
      <div style={s.bgOrb2} />

      <div style={s.card}>
        {/* Logo */}
        <div style={s.logoRow}>
          <div style={s.logoIcon}>A<span style={{ color: "#C4703A" }}>&</span>I</div>
          <span style={s.logoText}>A&I Store</span>
        </div>

        <h1 style={s.heading}>Welcome back</h1>
        <p style={s.subheading}>Sign in to your A&I account</p>

        {/* Verified success message */}
        {verifiedMsg && (
          <div style={s.successBanner}>{verifiedMsg}</div>
        )}

        {/* Error */}
        {error && (
          <div style={s.errorBanner}>
            {error}
            {unverified && (
              <div style={{ marginTop: 10 }}>
                <button
                  onClick={handleResend}
                  disabled={resendLoading}
                  style={s.resendBtn}
                >
                  {resendLoading ? "Sending…" : "Resend verification email"}
                </button>
                {resendMsg && <div style={{ marginTop: 8, fontSize: 12, color: "#86efac" }}>{resendMsg}</div>}
              </div>
            )}
          </div>
        )}

        {/* Google Sign-In */}
        <div style={s.googleWrapper}>
          {googleLoading
            ? <div style={s.googleLoadingBtn}>Signing in with Google…</div>
            : <div id="google-login-btn" style={{ width: "100%", minHeight: 44 }} />
          }
        </div>

        {/* Divider */}
        <div style={s.divider}>
          <span style={s.dividerLine} />
          <span style={s.dividerText}>or sign in with email</span>
          <span style={s.dividerLine} />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate style={s.form}>
          <div style={s.fieldGroup}>
            <label style={s.label}>Email Address</label>
            <input
              type="email"
              placeholder="jane@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              style={s.input}
            />
          </div>

          <div style={s.fieldGroup}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label style={s.label}>Password</label>
              <span
                style={{ fontSize: 12, color: "#C4703A", cursor: "pointer", fontWeight: 500 }}
                onClick={() => navigate("/forgot-password")}
              >
                Forgot password?
              </span>
            </div>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                style={{ ...s.input, paddingRight: 50 }}
              />
              <button type="button" onClick={() => setShowPassword(x => !x)} style={s.eyeBtn}>
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ ...s.submitBtn, opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer" }}
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p style={s.registerPrompt}>
          Don't have an account?{" "}
          <span onClick={() => navigate("/register")} style={{ ...s.registerLink, cursor: "pointer" }}>
            Join Free
          </span>
        </p>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh", backgroundColor: "#0b0b1a",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    padding: "40px 16px", position: "relative", overflow: "hidden",
  },
  bgOrb1: {
    position: "fixed", width: 500, height: 500, borderRadius: "50%",
    background: "radial-gradient(circle, rgba(196,112,58,0.12) 0%, transparent 70%)",
    top: -100, left: -100, pointerEvents: "none",
  },
  bgOrb2: {
    position: "fixed", width: 400, height: 400, borderRadius: "50%",
    background: "radial-gradient(circle, rgba(90,138,90,0.1) 0%, transparent 70%)",
    bottom: -80, right: -80, pointerEvents: "none",
  },
  card: {
    background: "#13132a", border: "1px solid #2e2e4a",
    borderRadius: 20, padding: "48px 40px",
    width: "100%", maxWidth: 460,
    position: "relative", zIndex: 1,
    boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
  },
  logoRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 28 },
  logoIcon: {
    width: 38, height: 38, borderRadius: 10,
    background: "linear-gradient(135deg, #2C1A0E, #C4703A)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 800, color: "#fff", fontSize: 16,
  },
  logoText: { color: "#fff", fontWeight: 700, fontSize: 18, letterSpacing: "-0.3px" },
  heading: { color: "#fff", fontSize: 26, fontWeight: 800, margin: "0 0 8px 0", letterSpacing: "-0.5px" },
  subheading: { color: "#8888aa", fontSize: 14, margin: "0 0 28px 0" },
  successBanner: {
    background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.3)",
    borderRadius: 10, padding: "12px 16px", color: "#86efac",
    fontSize: 14, marginBottom: 20,
  },
  errorBanner: {
    background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)",
    borderRadius: 10, padding: "12px 16px", color: "#fca5a5",
    fontSize: 14, marginBottom: 20,
  },
  resendBtn: {
    background: "transparent", border: "1px solid rgba(239,68,68,0.4)",
    borderRadius: 8, padding: "7px 14px", color: "#fca5a5",
    fontSize: 12, cursor: "pointer", fontFamily: "inherit",
  },
  googleWrapper: { marginBottom: 20, minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center" },
  googleLoadingBtn: {
    width: "100%", padding: "12px 0", background: "#1e1e38",
    border: "1px solid #2e2e4a", borderRadius: 8, color: "#8888aa",
    textAlign: "center", fontSize: 14,
  },
  divider: { display: "flex", alignItems: "center", gap: 10, marginBottom: 24 },
  dividerLine: { flex: 1, height: 1, background: "#2e2e4a", display: "block" },
  dividerText: { color: "#555577", fontSize: 12, whiteSpace: "nowrap" },
  form: { display: "flex", flexDirection: "column", gap: 18 },
  fieldGroup: { display: "flex", flexDirection: "column", gap: 6 },
  label: { color: "#aaaacc", fontSize: 13, fontWeight: 600, letterSpacing: "0.3px" },
  input: {
    background: "#0e0e22", border: "1px solid #2e2e4a",
    borderRadius: 10, padding: "12px 16px", color: "#fff",
    fontSize: 15, outline: "none", width: "100%", boxSizing: "border-box",
  },
  eyeBtn: {
    position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
    background: "none", border: "none", cursor: "pointer", fontSize: 16, padding: 0,
  },
  submitBtn: {
    background: "linear-gradient(135deg, #C4703A 0%, #E8944A 100%)",
    color: "#fff", border: "none", borderRadius: 10,
    padding: "14px 0", fontWeight: 700, fontSize: 15,
    marginTop: 4, width: "100%", fontFamily: "inherit", transition: "opacity 0.2s",
  },
  registerPrompt: { textAlign: "center", color: "#8888aa", fontSize: 14, marginTop: 22, marginBottom: 0 },
  registerLink: { color: "#E8944A", fontWeight: 600 },
};