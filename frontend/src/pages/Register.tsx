import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  const [formData, setFormData] = useState<FormData>({ full_name:"", email:"", password:"", confirm_password:"" });
  const [errors, setErrors] = useState<FieldError>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState("");
  const passwordStrength = getPasswordStrength(formData.password);

  const handleGoogleResponse = useCallback(async (response: { credential: string }) => {
    setGoogleLoading(true); setServerError("");
    try {
      const res = await axios.post("/api/auth/google", { credential: response.credential }, {
        withCredentials: true,
      });
      localStorage.setItem("user", JSON.stringify(res.data.user));
      navigate("/");
    } catch (err: any) {
      setServerError(err.response?.data?.msg || "Google sign-in failed.");
    } finally { setGoogleLoading(false); }
  }, [navigate]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (window.google) {
        window.google.accounts.id.initialize({ client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID, callback: handleGoogleResponse });
        window.google.accounts.id.renderButton(document.getElementById("google-btn"), { theme:"outline", size:"large", width:"100%", text:"signup_with", shape:"rectangular" });
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

  // ── Check inbox screen ───────────────────────────────────────────────────
  if (registeredEmail) return (
    <div style={s.page}>
      <style>{css}</style>
      <div style={s.right}>
        <div className="lp-card" style={{ ...s.card, textAlign: "center" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:22, width:"100%" }}>
            <div style={{ flex:1, height:1, background:"linear-gradient(90deg,transparent,rgba(0,0,0,0.15))" }} />
            <div style={{ width:4, height:4, background:"rgba(0,0,0,0.2)", transform:"rotate(45deg)", flexShrink:0 }} />
            <div style={{ flex:1, height:1, background:"linear-gradient(90deg,rgba(0,0,0,0.15),transparent)" }} />
          </div>
          <div style={{ fontSize:48, marginBottom:14 }}>📬</div>
          <h1 style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:"clamp(17px,4vw,21px)", color:"#0a0a0a", textAlign:"center", marginBottom:10 }}>Check your inbox!</h1>
          <p style={s.sub}>We sent a verification link to</p>
          <div style={{ background:"rgba(0,0,0,0.03)", border:"1px solid rgba(0,0,0,0.1)", borderRadius:6, padding:"9px 16px", color:"rgba(0,0,0,0.6)", fontSize:13, marginBottom:22, display:"inline-block", fontFamily:"'DM Sans',sans-serif", wordBreak:"break-all" as const }}>
            {registeredEmail}
          </div>
          <p style={{ ...s.sub, marginBottom:22 }}>Click the link to activate your account. Check your <strong style={{ color:"rgba(0,0,0,0.5)" }}>spam folder</strong> too.</p>
          {resendMsg && <div style={s.successBox}>{resendMsg}</div>}
          <button onClick={handleResend} disabled={resendLoading} className="lp-outline-btn" style={{ opacity:resendLoading?0.6:1, cursor:resendLoading?"not-allowed":"pointer", marginBottom:16 }}>
            {resendLoading ? "Sending…" : "Resend verification email"}
          </button>
          <p style={{ color:"rgba(0,0,0,0.35)", fontSize:13, fontFamily:"'DM Sans',sans-serif" }}>
            Already verified? <Link to="/login" style={{ color:"#000", fontWeight:600, textDecoration:"none" }}>Sign in here</Link>
          </p>
        </div>
      </div>
    </div>
  );

  // ── Registration form ────────────────────────────────────────────────────
  return (
    <div style={s.page}>
      <style>{css}</style>

      {/* Left brand panel */}
      <div className="lp-left">
        <div style={{ position:"absolute", top:28, left:28, width:80, height:80, border:"1px solid rgba(0,0,0,0.06)", borderRadius:4, pointerEvents:"none" }} />
        <div style={{ position:"absolute", bottom:28, right:28, width:60, height:60, border:"1px solid rgba(0,0,0,0.04)", borderRadius:4, pointerEvents:"none" }} />

        <div style={s.logoMark}>
          <span style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:22, color:"#fff" }}>LP</span>
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:10, width:"100%", marginBottom:22, zIndex:1, position:"relative" }}>
          <div style={{ flex:1, height:1, background:"linear-gradient(90deg,transparent,rgba(0,0,0,0.15))" }} />
          <div style={{ width:4, height:4, background:"rgba(0,0,0,0.2)", transform:"rotate(45deg)", flexShrink:0 }} />
          <div style={{ flex:1, height:1, background:"linear-gradient(90deg,rgba(0,0,0,0.15),transparent)" }} />
        </div>

        <h2 style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:300, fontSize:28, color:"#0a0a0a", textAlign:"center", lineHeight:1.2, marginBottom:14, zIndex:1, position:"relative" }}>
          Join<br />
          <span style={{ color:"rgba(0,0,0,0.4)", fontWeight:300 }}>Luku Prime Shop</span>
        </h2>
        <p style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:300, fontSize:13, color:"rgba(0,0,0,0.4)", textAlign:"center", lineHeight:1.8, maxWidth:260, zIndex:1, position:"relative" }}>
          Kenya's premium destination for the finest fashion.
        </p>

        <div style={{ marginTop:44, display:"flex", flexDirection:"column", gap:14, width:"100%", zIndex:1, position:"relative" }}>
          {[["👑","Exclusive drops & deals"],["🚚","Fast delivery across Kenya"],["🔒","Secure M-Pesa checkout"],["↩️","30-day hassle-free returns"]].map(([icon,text]) => (
            <div key={text} style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:32, height:32, borderRadius:3, flexShrink:0, background:"rgba(0,0,0,0.04)", border:"1px solid rgba(0,0,0,0.08)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13 }}>{icon}</div>
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"rgba(0,0,0,0.45)" }}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div style={s.right}>
        <div className="lp-card" style={s.card}>

          {/* Mobile-only logo */}
          <div className="lp-mobile-logo">
            <div style={{ width:40, height:40, borderRadius:3, background:"#000", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:13, color:"#fff" }}>LP</span>
            </div>
            <span style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:500, fontSize:15, color:"#0a0a0a" }}>Luku Prime Shop</span>
          </div>

          <div style={{ marginBottom:22 }}>
            <div style={s.tag}>New Member</div>
            <h1 style={s.heading}>Create Account</h1>
            <p style={s.sub}>Join thousands of Luku Prime shoppers</p>
          </div>

          {serverError && <div style={s.errorBox}>{serverError}</div>}

          <div style={{ marginBottom:18, minHeight:44 }}>
            {googleLoading ? <div style={s.gLoad}>Signing in with Google…</div> : <div id="google-btn" style={{ width:"100%", minHeight:44 }} />}
          </div>

          <div style={s.divider}><span style={s.divLine}/><span style={s.divText}>or sign up with email</span><span style={s.divLine}/></div>

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
                style={{ borderColor: errors.full_name ? "#ef4444" : "rgba(0,0,0,0.12)" }}
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
                style={{ borderColor: errors.email ? "#ef4444" : "rgba(0,0,0,0.12)" }}
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
                  style={{ paddingRight:50, borderColor: errors.password ? "#ef4444" : "rgba(0,0,0,0.12)" }}
                />
                <button type="button" onClick={() => setShowPassword(x => !x)} className="lp-eye">
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
              {formData.password && (
                <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:7 }}>
                  <div style={{ display:"flex", gap:4, flex:1 }}>
                    {[1,2,3,4].map(i => (
                      <div key={i} style={{ flex:1, height:3, borderRadius:3, transition:"background 0.3s", backgroundColor: passwordStrength >= i ? strengthColor[passwordStrength] : "rgba(0,0,0,0.08)" }}/>
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
                style={{ borderColor: errors.confirm_password ? "#ef4444" : "rgba(0,0,0,0.12)" }}
              />
              {errors.confirm_password && <span style={s.err}>{errors.confirm_password}</span>}
            </div>

            <button type="submit" disabled={loading} className="lp-submit">
              {loading ? "Creating account…" : "Create Account →"}
            </button>
          </form>

          <div style={{ height:1, background:"rgba(0,0,0,0.07)", margin:"24px 0" }}/>
          <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"rgba(0,0,0,0.4)", textAlign:"center", marginBottom:14 }}>
            Already have an account? <span className="lp-link" onClick={() => navigate("/login")}>Sign In</span>
          </p>
          <p style={{ textAlign:"center", color:"rgba(0,0,0,0.25)", fontSize:11, fontFamily:"'DM Sans',sans-serif" }}>
            By signing up you agree to our <Link to="/terms" style={{ color:"rgba(0,0,0,0.5)", textDecoration:"none", fontWeight:500 }}>Terms</Link> &amp; <Link to="/privacy" style={{ color:"rgba(0,0,0,0.5)", textDecoration:"none", fontWeight:500 }}>Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

  .lp-inp{background:#fff;border:1px solid rgba(0,0,0,0.12);border-radius:6px;padding:13px 16px;color:#0a0a0a;font-size:14px;font-family:'DM Sans',sans-serif;width:100%;outline:none;letter-spacing:0.2px;transition:border-color 0.2s,box-shadow 0.2s}
  .lp-inp:focus{border-color:rgba(0,0,0,0.4);box-shadow:0 0 0 3px rgba(0,0,0,0.06)}
  .lp-inp::placeholder{color:rgba(0,0,0,0.25)}

  .lp-submit{width:100%;border:none;border-radius:6px;padding:14px;font-family:'DM Sans',sans-serif;font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;cursor:pointer;background:#000;color:#fff;transition:all 0.22s;margin-top:4px}
  .lp-submit:hover:not(:disabled){background:#222;transform:translateY(-1px);box-shadow:0 6px 20px rgba(0,0,0,0.15)}
  .lp-submit:disabled{opacity:0.4;cursor:not-allowed}

  .lp-link{color:#000;cursor:pointer;font-weight:600;font-family:'DM Sans',sans-serif;font-size:12px;transition:opacity 0.2s;opacity:0.6}
  .lp-link:hover{opacity:1}

  .lp-eye{position:absolute;right:14px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:15px;color:rgba(0,0,0,0.3);transition:color 0.2s;padding:0}
  .lp-eye:hover{color:#000}

  @keyframes lpFadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
  .lp-card{animation:lpFadeUp 0.4s ease both}

  .lp-left{width:420px;flex-shrink:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 44px;position:relative;overflow:hidden;border-right:1px solid rgba(0,0,0,0.07);background:#f9f9f9}

  .lp-mobile-logo{display:none;align-items:center;gap:12px;margin-bottom:28px}

  .lp-outline-btn{width:100%;border:1px solid rgba(0,0,0,0.2);border-radius:6px;padding:13px;font-family:'DM Sans',sans-serif;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;cursor:pointer;background:transparent;color:rgba(0,0,0,0.6);transition:all 0.2s}
  .lp-outline-btn:hover:not(:disabled){border-color:#000;color:#000;background:rgba(0,0,0,0.03)}

  @media(max-width:768px){
    .lp-left{display:none !important}
    .lp-mobile-logo{display:flex !important}
  }
`;

const s: Record<string, React.CSSProperties> = {
  page:     { minHeight:"100vh", display:"flex", fontFamily:"'DM Sans',sans-serif", background:"#fff", overflow:"hidden" },
  logoMark: { width:72, height:72, borderRadius:6, marginBottom:36, background:"#000", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 20px rgba(0,0,0,0.12)", position:"relative", zIndex:1 },
  right:    { flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:"clamp(20px,4vw,40px) clamp(16px,4vw,24px)", background:"#fff", position:"relative", overflow:"hidden" },
  card:     { width:"100%", maxWidth:440, background:"#fff", border:"1px solid rgba(0,0,0,0.08)", borderRadius:12, padding:"clamp(24px,5vw,48px) clamp(18px,5vw,42px)", boxShadow:"0 2px 24px rgba(0,0,0,0.06)", position:"relative", zIndex:1 },
  tag:      { fontFamily:"'DM Sans',sans-serif", fontSize:10, fontWeight:700, letterSpacing:"3px", color:"rgba(0,0,0,0.35)", textTransform:"uppercase" as const, marginBottom:10 },
  heading:  { fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:"clamp(20px,4vw,26px)" as any, color:"#0a0a0a", marginBottom:6 },
  sub:      { fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"rgba(0,0,0,0.4)", fontWeight:300, marginBottom:0 },
  label:    { display:"block", fontFamily:"'DM Sans',sans-serif", fontSize:10, fontWeight:700, letterSpacing:"2px", color:"rgba(0,0,0,0.5)", textTransform:"uppercase" as const, marginBottom:8 },
  err:      { color:"#dc2626", fontSize:11, fontFamily:"'DM Sans',sans-serif", marginTop:4, display:"block" },
  errorBox: { background:"rgba(220,38,38,0.05)", border:"1px solid rgba(220,38,38,0.18)", borderRadius:6, padding:"12px 16px", color:"#991b1b", fontFamily:"'DM Sans',sans-serif", fontSize:13, marginBottom:18 },
  successBox:{ background:"rgba(22,163,74,0.06)", border:"1px solid rgba(22,163,74,0.2)", borderRadius:6, padding:"12px 16px", color:"#166534", fontFamily:"'DM Sans',sans-serif", fontSize:13, marginBottom:18 },
  gLoad:    { background:"rgba(0,0,0,0.03)", border:"1px solid rgba(0,0,0,0.08)", borderRadius:6, padding:"12px", color:"rgba(0,0,0,0.3)", fontFamily:"'DM Sans',sans-serif", fontSize:13, textAlign:"center" as const },
  divider:  { display:"flex", alignItems:"center", gap:12, marginBottom:18 },
  divLine:  { flex:1, height:1, background:"rgba(0,0,0,0.08)", display:"block" },
  divText:  { fontFamily:"'DM Sans',sans-serif", fontSize:10, color:"rgba(0,0,0,0.3)", letterSpacing:"1.5px", textTransform:"uppercase" as const, whiteSpace:"nowrap" as const },
};
