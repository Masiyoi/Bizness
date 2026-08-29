import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
declare global {
  interface Window {
    google: any;
    grecaptcha: any;
  }
}
interface FormData {
  full_name: string; email: string; password: string; confirm_password: string;
}
interface FieldError {
  full_name?: string; email?: string; password?: string; confirm_password?: string;
}
const getPasswordStrength = (p: string) => {
  let s = 0;
  if (p.length >= 8) s++; if (/[A-Z]/.test(p)) s++;
  if (/[0-9]/.test(p)) s++;  if (/[^A-Za-z0-9]/.test(p)) s++;
  return s;
};
const strengthLabel = ["","Weak","Fair","Good","Strong"];
const strengthColor = ["","#ef4444","#f59e0b","#3b82f6","#22c55e"];
const getRecaptchaToken = (action: string): Promise<string> => {
  return new Promise((resolve) => {
    window.grecaptcha.ready(async () => {
      const token = await window.grecaptcha.execute(
        import.meta.env.VITE_RECAPTCHA_SITE_KEY,
        { action }
      );
      resolve(token);
    });
  });
};
export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Captures ?ref=CODE from a shared referral link, e.g. /register?ref=AB12CD34.
  // Passed through to /api/auth/register; the backend silently ignores
  // unknown/invalid codes, so this is safe even if the link is stale.
  const referralCode = searchParams.get("ref") || undefined;
  const [formData, setFormData] = useState<FormData>({ full_name:"", email:"", password:"", confirm_password:"" });
  const [errors, setErrors] = useState<FieldError>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState("");
  const [showEmailForm, setShowEmailForm] = useState(false);
  const passwordStrength = getPasswordStrength(formData.password);
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const didInit = useRef(false);
  const handleGoogleResponse = useCallback(async (response: { credential: string }) => {
    setGoogleLoading(true); setServerError("");
    try {
      const res = await axios.post("/api/auth/google", {
        credential: response.credential,
        referral_code: referralCode,
      }, {
        withCredentials: true,
      });
      localStorage.setItem("user", JSON.stringify(res.data.user));
      navigate("/");
    } catch (err: any) {
      setServerError(err.response?.data?.msg || "Google sign-in failed.");
    } finally { setGoogleLoading(false); }
  }, [navigate, referralCode]);
  useEffect(() => {
    const t = setTimeout(() => {
      // GSI rejects percentage widths ("Provided button width is invalid: 100%").
      // Measure the container's real pixel width and pass that number instead.
      if (window.google && googleBtnRef.current && !didInit.current) {
        didInit.current = true;
        const pxWidth = googleBtnRef.current.offsetWidth || 320;
        window.google.accounts.id.initialize({ client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID, callback: handleGoogleResponse });
        window.google.accounts.id.renderButton(googleBtnRef.current, { theme: "filled_white", size: "large", width: pxWidth, text: "signup_with", shape: "rectangular" });
      }
    }, 300);
    return () => clearTimeout(t);
  }, [handleGoogleResponse]);
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://www.google.com/recaptcha/api.js?render=6LdlHMQsAAAAAJ5Ft84oddhVF0cUKkU7u65Xlb2o";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
      const badge = document.querySelector(".grecaptcha-badge");
      if (badge) badge.remove();
    };
  }, []);
  const validate = (): boolean => {
    const e: FieldError = {};
    if (!formData.full_name.trim()) e.full_name = "Full name is required.";
    if (formData.full_name.trim().length > 100) e.full_name = "Name must be under 100 characters.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email = "Please enter a valid email.";
    if (formData.email.length > 254) e.email = "Email address is too long.";
    if (formData.password.length < 8) e.password = "Password must be at least 8 characters.";
    if (formData.password.length > 128) e.password = "Password must be under 128 characters.";
    if (formData.password !== formData.confirm_password) e.confirm_password = "Passwords do not match.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
    setErrors(p => ({ ...p, [name]: undefined }));
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true); setServerError("");
    try {
      const recaptchaToken = await getRecaptchaToken("register");
      await axios.post("/api/auth/register", {
        full_name: formData.full_name,
        email: formData.email,
        password: formData.password,
        recaptchaToken,
        referral_code: referralCode,
      });
      setRegisteredEmail(formData.email);
    } catch (err: any) {
      setServerError(err.response?.data?.msg || err.response?.data?.errors?.[0]?.msg || "Registration failed.");
    } finally { setLoading(false); }
  };
  const handleResend = async () => {
    setResendLoading(true); setResendMsg("");
    try {
      const res = await axios.post("/api/auth/resend-verification", { email: registeredEmail });
      setResendMsg(res.data.msg);
    } catch { setResendMsg("Failed to resend. Please try again."); }
    finally { setResendLoading(false); }
  };
  // -- Check inbox screen -------------------------------------------------
  if (registeredEmail) return (
    <div style={s.page}>
      <style>{css}</style>
      <div style={s.orb1} /><div style={s.orb2} /><div style={s.dots} />
      <div className="lp-card" style={{ ...s.card, textAlign: "center", maxWidth: 440 }}>
        <div style={s.ornRow}>
          <div style={s.ornLine} /><div style={s.ornDiamond} /><div style={s.ornLine} />
        </div>
        <div style={{ fontSize: 48, marginBottom: 14 }}>{"\u{1F4EC}"}</div>
        <div style={s.tag}>Almost There</div>
        <h1 style={{ ...s.heading, textAlign: "center", fontSize: "clamp(18px,4vw,22px)", marginBottom: 10 }}>Check your inbox!</h1>
        <p style={{ ...s.sub, marginBottom: 10 }}>We sent a verification link to</p>
        <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, padding: "9px 16px", color: "rgba(255,255,255,0.85)", fontWeight: 700, fontSize: 13, marginBottom: 22, display: "inline-block", fontFamily: "'DM Sans',sans-serif", wordBreak: "break-all" as const }}>
          {registeredEmail}
        </div>
        <p style={{ ...s.sub, marginBottom: 26, lineHeight: 1.7 }}>Click the link to activate your account. Check your <strong style={{ color: "rgba(255,255,255,0.55)" }}>spam folder</strong> too.</p>
        {resendMsg && <div style={s.successBox}>{resendMsg}</div>}
        <button onClick={handleResend} disabled={resendLoading} className="lp-outline-btn" style={{ opacity: resendLoading ? 0.6 : 1, cursor: resendLoading ? "not-allowed" : "pointer", marginBottom: 16 }}>
          {resendLoading ? "Sending…" : "Resend verification email"}
        </button>
        <p style={{ color: "rgba(255,255,255,0.28)", fontSize: 12, fontFamily: "'DM Sans',sans-serif" }}>
          Already verified? <Link to="/login" className="lp-link" style={{ textDecoration: "none" }}>Sign in here</Link>
        </p>
      </div>
    </div>
  );
  // -- Registration form ---------------------------------------------------
  return (
    <div style={s.page}>
      <style>{css}</style>
      <div style={s.orb1} /><div style={s.orb2} /><div style={s.dots} />
      <div style={s.centerWrap}>
        <div className="lp-card" style={s.card}>
          <div style={{ marginBottom: 22 }}>
            <div style={s.tag}>New Member</div>
            <h1 style={s.heading}>Create Account</h1>
            <p style={s.sub}>Join thousands of Luku Prime shoppers</p>
          </div>
          {referralCode && (
            <div style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 6, padding: "10px 16px", marginBottom: 18, fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "#bbf7d0" }}>
              {"\u{1F381}"} Referral code applied — you're all set to sign up.
            </div>
          )}
          {serverError && <div style={s.errorBox}>{serverError}</div>}
          <div style={{ marginBottom: 18, minHeight: 44 }}>
            {googleLoading ? <div style={s.gLoad}>Signing in with Google…</div> : <div ref={googleBtnRef} id="google-btn" style={{ width: "100%", minHeight: 44 }} />}
          </div>
          <div style={s.orRow}>
            <span style={s.divLine}/>
            <span style={s.divText}>OR</span>
            <span style={s.divLine}/>
          </div>
          <div
            style={{ ...s.emailToggle, cursor: "pointer" }}
            onClick={() => setShowEmailForm(x => !x)}
            role="button"
            aria-expanded={showEmailForm}
          >
            <span style={s.divText}>with email</span>
            <span
              style={{
                fontSize: 16,
                fontWeight: 400,
                lineHeight: 1,
                color: "rgba(255,255,255,0.5)",
                marginLeft: 6,
                transform: showEmailForm ? "rotate(45deg)" : "rotate(0deg)",
                transition: "transform 0.25s ease",
                display: "inline-block",
              }}
            >
              +
            </span>
          </div>
          <div className={`lp-collapse ${showEmailForm ? "lp-collapse-open" : ""}`}>
          <form onSubmit={handleSubmit} noValidate style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div>
              <label style={s.label}>Full Name</label>
              <input
                type="text"
                name="full_name"
                placeholder="Jane Wanjiku"
                value={formData.full_name}
                onChange={handleChange}
                autoComplete="name"
                maxLength={100}
                className="lp-inp"
                style={{ borderColor: errors.full_name ? "#ef4444" : "rgba(255,255,255,0.16)" }}
              />
              {errors.full_name && <span style={s.err}>{errors.full_name}</span>}
            </div>
            <div>
              <label style={s.label}>Email Address</label>
              <input
                type="email"
                name="email"
                placeholder="jane@example.com"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
                maxLength={254}
                className="lp-inp"
                style={{ borderColor: errors.email ? "#ef4444" : "rgba(255,255,255,0.16)" }}
              />
              {errors.email && <span style={s.err}>{errors.email}</span>}
            </div>
            <div>
              <label style={s.label}>Password</label>
              <div style={{ position:"relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Min. 8 characters"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  maxLength={128}
                  className="lp-inp"
                  style={{ paddingRight:50, borderColor: errors.password ? "#ef4444" : "rgba(255,255,255,0.16)" }}
                />
                <button type="button" onClick={() => setShowPassword(x => !x)} className="lp-eye">
                  {showPassword ? "\u{1F648}" : "\u{1F441}\uFE0F"}
                </button>
              </div>
              {formData.password && (
                <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:7 }}>
                  <div style={{ display:"flex", gap:4, flex:1 }}>
                    {[1,2,3,4].map(i => (
                      <div key={i} style={{ flex:1, height:3, borderRadius:3, transition:"background 0.3s", backgroundColor: passwordStrength >= i ? strengthColor[passwordStrength] : "rgba(255,255,255,0.15)" }}/>
                    ))}
                  </div>
                  <span style={{ fontSize:11, color:strengthColor[passwordStrength], fontWeight:500, fontFamily:"'DM Sans',sans-serif" }}>{strengthLabel[passwordStrength]}</span>
                </div>
              )}
              {errors.password && <span style={s.err}>{errors.password}</span>}
            </div>
            <div>
              <label style={s.label}>Confirm Password</label>
              <input
                type={showPassword ? "text" : "password"}
                name="confirm_password"
                placeholder="Repeat your password"
                value={formData.confirm_password}
                onChange={handleChange}
                autoComplete="new-password"
                maxLength={128}
                className="lp-inp"
                style={{ borderColor: errors.confirm_password ? "#ef4444" : "rgba(255,255,255,0.16)" }}
              />
              {errors.confirm_password && <span style={s.err}>{errors.confirm_password}</span>}
            </div>
            <button type="submit" disabled={loading} className="lp-submit">
              {loading ? "Creating account…" : "Create Account →"}
            </button>
          </form>
          </div>
          <div style={{ height: 1, background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.12),transparent)", margin:"24px 0" }}/>
          <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"rgba(255,255,255,0.4)", textAlign:"center", marginBottom:14 }}>
            Already have an account? <span className="lp-link" onClick={() => navigate("/login")}>Sign In</span>
          </p>
          <p style={{ textAlign:"center", color:"rgba(255,255,255,0.28)", fontSize:11, fontFamily:"'DM Sans',sans-serif" }}>
            By signing up you agree to our <Link to="/terms" className="lp-link" style={{ textDecoration:"none" }}>Terms</Link> &amp; <Link to="/privacy" className="lp-link" style={{ textDecoration:"none" }}>Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  .lp-inp{background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.16);border-radius:6px;padding:13px 16px;color:#fff;font-size:14px;font-family:'DM Sans',sans-serif;width:100%;outline:none;letter-spacing:0.2px;transition:border-color 0.2s,background 0.2s}
  .lp-inp:focus{border-color:rgba(255,255,255,0.7);background:rgba(255,255,255,0.1)}
  .lp-inp::placeholder{color:rgba(255,255,255,0.25)}
  .lp-submit{width:100%;border:none;border-radius:6px;padding:14px;font-family:'DM Sans',sans-serif;font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;cursor:pointer;background:#fff;color:#000;transition:all 0.22s;margin-top:4px}
  .lp-submit:hover:not(:disabled){background:#e8e8e8;transform:translateY(-1px);box-shadow:0 8px 24px rgba(0,0,0,0.5)}
  .lp-submit:disabled{opacity:0.4;cursor:not-allowed}
  .lp-link{color:#fff;cursor:pointer;font-weight:600;font-family:'DM Sans',sans-serif;font-size:12px;transition:opacity 0.2s;opacity:0.7}
  .lp-link:hover{opacity:1}
  .lp-eye{position:absolute;right:14px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:15px;color:rgba(255,255,255,0.4);transition:color 0.2s;padding:0}
  .lp-eye:hover{color:#fff}
  @keyframes lpFadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
  .lp-card{animation:lpFadeUp 0.45s ease both}
  .lp-collapse{display:grid;grid-template-rows:0fr;opacity:0;transition:grid-template-rows 0.3s ease,opacity 0.25s ease,margin-top 0.3s ease;margin-top:0}
  .lp-collapse > form{overflow:hidden;min-height:0}
  .lp-collapse-open{grid-template-rows:1fr;opacity:1;margin-top:4px}
  .lp-outline-btn{width:100%;border:1px solid rgba(255,255,255,0.3);border-radius:6px;padding:13px;font-family:'DM Sans',sans-serif;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;cursor:pointer;background:transparent;color:rgba(255,255,255,0.8);transition:all 0.2s}
  .lp-outline-btn:hover:not(:disabled){border-color:#fff;color:#fff;background:rgba(255,255,255,0.06)}
`;
const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "'DM Sans',sans-serif", background: "#ffffff", overflow: "hidden",
    padding: "clamp(20px,4vw,40px) clamp(16px,4vw,24px)", position: "relative",
  },
  orb1: { position: "fixed", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(255,255,255,0.05) 0%,transparent 70%)", top: -120, left: -120, pointerEvents: "none" },
  orb2: { position: "fixed", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(255,255,255,0.03) 0%,transparent 70%)", bottom: -100, right: -100, pointerEvents: "none" },
  dots: { position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, backgroundImage: "radial-gradient(rgba(255,255,255,0.03) 1px,transparent 1px)", backgroundSize: "28px 28px" },
  centerWrap: { width: "100%", maxWidth: 480, position: "relative", zIndex: 1 },
  card: {
    width: "100%",
    backgroundImage: "linear-gradient(180deg, rgba(0,0,0,0.72), rgba(0,0,0,0.55)), url('/Register.jpg')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20,
    padding: "clamp(28px,5vw,48px) clamp(20px,5vw,42px)",
    position: "relative", zIndex: 1,
  },
  tag: { fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "3px", color: "#ffffff", textTransform: "uppercase" as const, marginBottom: 10 },
  heading: { fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: "clamp(20px,4vw,26px)" as any, color: "#fff", marginBottom: 6 },
  sub: { fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 0 },
  label: { display: "block", fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "2px", color: "rgba(255,255,255,0.55)", textTransform: "uppercase" as const, marginBottom: 8 },
  err: { color: "#fca5a5", fontSize: 11, fontFamily: "'DM Sans',sans-serif", marginTop: 4, display: "block" },
  errorBox: { background: "rgba(192,57,43,0.15)", border: "1px solid rgba(192,57,43,0.35)", borderRadius: 6, padding: "12px 16px", color: "#fca5a5", fontFamily: "'DM Sans',sans-serif", fontSize: 13, marginBottom: 18 },
  successBox: { background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 6, padding: "12px 16px", color: "#bbf7d0", fontFamily: "'DM Sans',sans-serif", fontSize: 13, marginBottom: 18 },
  gLoad: { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6, padding: "12px", color: "rgba(255,255,255,0.5)", fontFamily: "'DM Sans',sans-serif", fontSize: 13, textAlign: "center" as const },
  orRow: { display: "flex", alignItems: "center", gap: 12, marginBottom: 14 },
  emailToggle: { display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 20, padding: "4px 0" },
  divLine: { flex: 1, height: 1, background: "rgba(255,255,255,0.15)", display: "block" },
  divText: { fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.45)", letterSpacing: "1px", textTransform: "uppercase" as const, whiteSpace: "nowrap" as const },
  ornRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 24, width: "100%" },
  ornLine: { flex: 1, height: 1, background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent)" },
  ornDiamond: { width: 5, height: 5, background: "#ffffff", transform: "rotate(45deg)", flexShrink: 0 },
};