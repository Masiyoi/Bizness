import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

interface FormData {
  full_name: string;
  email: string;
  password: string;
  confirm_password: string;
}

interface FieldError {
  full_name?: string;
  email?: string;
  password?: string;
  confirm_password?: string;
}

declare global {
  interface Window { google: any; }
}

const getPasswordStrength = (password: string) => {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
};

const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"];
const strengthColor = ["", "#ef4444", "#f59e0b", "#3b82f6", "#22c55e"];

export default function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<FormData>({
    full_name: "", email: "", password: "", confirm_password: "",
  });

  const [errors, setErrors]               = useState<FieldError>({});
  const [serverError, setServerError]     = useState("");
  const [loading, setLoading]             = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword]   = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [resendLoading, setResendLoading]     = useState(false);
  const [resendMsg, setResendMsg]             = useState("");

  const passwordStrength = getPasswordStrength(formData.password);

  // ── Google Sign-In ──────────────────────────────────────────────────────
  const handleGoogleResponse = useCallback(
    async (response: { credential: string }) => {
      setGoogleLoading(true);
      setServerError("");
      try {
        const res = await axios.post("/api/auth/google", { credential: response.credential });
        // Save BOTH token and user so Homepage detects login immediately
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        navigate("/");
      } catch (err: any) {
        setServerError(err.response?.data?.msg || "Google sign-in failed. Please try again.");
      } finally {
        setGoogleLoading(false);
      }
    },
    [navigate]
  );

  useEffect(() => {
    const initGoogle = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
        });
        window.google.accounts.id.renderButton(
          document.getElementById("google-btn"),
          { theme: "outline", size: "large", width: "100%", text: "signup_with", shape: "rectangular" }
        );
      }
    };
    const timer = setTimeout(initGoogle, 300);
    return () => clearTimeout(timer);
  }, [handleGoogleResponse]);

  // ── Validation ──────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const newErrors: FieldError = {};
    if (!formData.full_name.trim()) newErrors.full_name = "Full name is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Please enter a valid email.";
    if (formData.password.length < 8) newErrors.password = "Password must be at least 8 characters.";
    if (formData.password !== formData.confirm_password) newErrors.confirm_password = "Passwords do not match.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  // ── Submit ──────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setServerError("");
    try {
      await axios.post("/api/auth/register", {
        full_name: formData.full_name,
        email: formData.email,
        password: formData.password,
      });
      // Show "check your email" screen — do NOT log user in yet
      setRegisteredEmail(formData.email);
    } catch (err: any) {
      setServerError(
        err.response?.data?.msg ||
        err.response?.data?.errors?.[0]?.msg ||
        "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Resend verification ─────────────────────────────────────────────────
  const handleResend = async () => {
    setResendLoading(true);
    setResendMsg("");
    try {
      const res = await axios.post("/api/auth/resend-verification", { email: registeredEmail });
      setResendMsg(res.data.msg);
    } catch {
      setResendMsg("Failed to resend. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  // ── "Check your email" screen ───────────────────────────────────────────
  if (registeredEmail) {
    return (
      <div style={styles.page}>
        <div style={styles.bgOrb1} />
        <div style={styles.bgOrb2} />
        <div style={{ ...styles.card, textAlign: "center", padding: "52px 40px" }}>
          <div style={{ fontSize: 56, marginBottom: 20 }}>📬</div>
          <h1 style={{ ...styles.heading, textAlign: "center", fontSize: 24, marginBottom: 12 }}>
            Check your inbox!
          </h1>
          <p style={{ color: "#8888aa", fontSize: 14, lineHeight: 1.7, marginBottom: 8 }}>
            We sent a verification link to
          </p>
          <div style={{
            background: "#1e1e38", border: "1px solid #2e2e4a",
            borderRadius: 10, padding: "10px 20px",
            color: "#fff", fontWeight: 600, fontSize: 15,
            marginBottom: 28, display: "inline-block",
          }}>
            {registeredEmail}
          </div>
          <p style={{ color: "#555577", fontSize: 13, marginBottom: 28, lineHeight: 1.6 }}>
            Click the link in the email to activate your account.<br />
            Don't forget to check your <strong style={{ color: "#8888aa" }}>spam / junk folder</strong>.
          </p>
          {resendMsg && (
            <div style={{
              background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)",
              borderRadius: 10, padding: "10px 16px",
              color: "#86efac", fontSize: 13, marginBottom: 20,
            }}>
              {resendMsg}
            </div>
          )}
          <button
            onClick={handleResend}
            disabled={resendLoading}
            style={{
              ...styles.submitBtn,
              background: "transparent",
              border: "1px solid #2e2e4a",
              color: "#aaaacc",
              marginBottom: 16,
              opacity: resendLoading ? 0.6 : 1,
              cursor: resendLoading ? "not-allowed" : "pointer",
            }}
          >
            {resendLoading ? "Sending…" : "Resend verification email"}
          </button>
          <p style={{ color: "#555577", fontSize: 13 }}>
            Already verified?{" "}
            <Link to="/login" style={styles.loginLink}>Sign in here</Link>
          </p>
        </div>
      </div>
    );
  }

  // ── Registration form ───────────────────────────────────────────────────
  return (
    <div style={styles.page}>
      <div style={styles.bgOrb1} />
      <div style={styles.bgOrb2} />

      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoRow}>
          <div style={styles.logoIcon}>
            A<span style={{ color: "#C4703A" }}>&</span>I
          </div>
          <span style={styles.logoText}>A&I Store</span>
        </div>

        <h1 style={styles.heading}>Create your account</h1>
        <p style={styles.subheading}>Join thousands of happy shoppers at A&I</p>

        {serverError && <div style={styles.errorBanner}>{serverError}</div>}

        {/* Google Sign-In */}
        <div style={styles.googleWrapper}>
          {googleLoading
            ? <div style={styles.googleLoadingBtn}>Signing in with Google…</div>
            : <div id="google-btn" style={{ width: "100%", minHeight: 44 }} />
          }
        </div>

        {/* Divider */}
        <div style={styles.divider}>
          <span style={styles.dividerLine} />
          <span style={styles.dividerText}>or sign up with email</span>
          <span style={styles.dividerLine} />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate style={styles.form}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Full Name</label>
            <input
              type="text" name="full_name" placeholder="Jane Wanjiku"
              value={formData.full_name} onChange={handleChange} autoComplete="name"
              style={{ ...styles.input, borderColor: errors.full_name ? "#ef4444" : "#2e2e4a" }}
            />
            {errors.full_name && <span style={styles.fieldError}>{errors.full_name}</span>}
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Email Address</label>
            <input
              type="email" name="email" placeholder="jane@example.com"
              value={formData.email} onChange={handleChange} autoComplete="email"
              style={{ ...styles.input, borderColor: errors.email ? "#ef4444" : "#2e2e4a" }}
            />
            {errors.email && <span style={styles.fieldError}>{errors.email}</span>}
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Password</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                name="password" placeholder="Min. 8 characters"
                value={formData.password} onChange={handleChange} autoComplete="new-password"
                style={{ ...styles.input, paddingRight: 50, borderColor: errors.password ? "#ef4444" : "#2e2e4a" }}
              />
              <button type="button" onClick={() => setShowPassword(s => !s)} style={styles.eyeBtn}>
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
            {formData.password && (
              <div style={styles.strengthRow}>
                <div style={styles.strengthBarBg}>
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} style={{
                      ...styles.strengthSegment,
                      backgroundColor: passwordStrength >= i ? strengthColor[passwordStrength] : "#2e2e4a",
                    }} />
                  ))}
                </div>
                <span style={{ fontSize: 12, color: strengthColor[passwordStrength], fontWeight: 600 }}>
                  {strengthLabel[passwordStrength]}
                </span>
              </div>
            )}
            {errors.password && <span style={styles.fieldError}>{errors.password}</span>}
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Confirm Password</label>
            <input
              type={showPassword ? "text" : "password"}
              name="confirm_password" placeholder="Repeat your password"
              value={formData.confirm_password} onChange={handleChange} autoComplete="new-password"
              style={{ ...styles.input, borderColor: errors.confirm_password ? "#ef4444" : "#2e2e4a" }}
            />
            {errors.confirm_password && <span style={styles.fieldError}>{errors.confirm_password}</span>}
          </div>

          <button
            type="submit" disabled={loading}
            style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer" }}
          >
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        {/* ── Sign In link — uses navigate to work correctly with HashRouter ── */}
        <p style={styles.loginPrompt}>
          Already have an account?{" "}
          <span
            onClick={() => navigate("/login")}
            style={{ ...styles.loginLink, cursor: "pointer" }}
          >
            Sign in
          </span>
        </p>

        <p style={styles.termsText}>
          By signing up you agree to our{" "}
          <Link to="/terms" style={styles.termsLink}>Terms of Service</Link> and{" "}
          <Link to="/privacy" style={styles.termsLink}>Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#0b0b1a",
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
  errorBanner: {
    background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)",
    borderRadius: 10, padding: "12px 16px", color: "#fca5a5",
    fontSize: 14, marginBottom: 20,
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
  fieldError: { color: "#f87171", fontSize: 12 },
  strengthRow: { display: "flex", alignItems: "center", gap: 10, marginTop: 6 },
  strengthBarBg: { display: "flex", gap: 4, flex: 1 },
  strengthSegment: { flex: 1, height: 4, borderRadius: 4, transition: "background-color 0.3s" },
  submitBtn: {
    background: "linear-gradient(135deg, #C4703A 0%, #E8944A 100%)",
    color: "#fff", border: "none", borderRadius: 10,
    padding: "14px 0", fontWeight: 700, fontSize: 15,
    marginTop: 4, width: "100%", fontFamily: "inherit", transition: "opacity 0.2s",
  },
  loginPrompt: { textAlign: "center", color: "#8888aa", fontSize: 14, marginTop: 22, marginBottom: 12 },
  loginLink: { color: "#E8944A", fontWeight: 600 },
  termsText: { textAlign: "center", color: "#555577", fontSize: 12, margin: 0 },
  termsLink: { color: "#C4703A", textDecoration: "none" },
};