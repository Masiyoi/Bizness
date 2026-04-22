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

const T = {
  navy:'#0D1B3E', navyMid:'#152348', navyLight:'#1E2F5A',
  gold:'#C8A951', goldLight:'#DEC06A', cream:'#F9F5EC', muted:'rgba(255,255,255,0.38)',
};

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
      const res = await axios.post("/api/auth/google", { credential: response.credential });
      localStorage.setItem("token", res.data.token);
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
      const recaptchaToken = await getRecaptchaToken('register');
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
      <div style={s.orb1}/><div style={s.orb2}/><div style={s.dots}/>
      <div className="lp-card" style={{ ...s.card, textAlign:"center" }}>
        <div style={s.ornRow}><div style={s.ornLine}/><div style={s.ornDiamond}/><div style={s.ornLine}/></div>
        <div style={{ fontSize:48, marginBottom:14 }}>📬</div>
        <h1 style={{ ...s.heading, textAlign:"center", fontSize:"clamp(17px,4vw,21px)", marginBottom:10 }}>Check your inbox!</h1>
        <p style={s.sub}>We sent a verification link to</p>
        <div style={{ background:T.navyLight, border:`1px solid rgba(200,169,81,0.25)`, borderRadius:8, padding:"9px 16px", color:T.goldLight, fontWeight:700, fontSize:13, marginBottom:22, display:"inline-block", fontFamily:"'Jost',sans-serif", wordBreak:"break-all" as const }}>
          {registeredEmail}
        </div>
        <p style={{ ...s.sub, marginBottom:22 }}>Click the link to activate your account. Check your <strong style={{ color:"rgba(255,255,255,0.5)" }}>spam folder</strong> too.</p>
        {resendMsg && <div style={s.successBox}>{resendMsg}</div>}
        <button onClick={handleResend} disabled={resendLoading} className="lp-outline-btn" style={{ opacity:resendLoading?0.6:1, cursor:resendLoading?"not-allowed":"pointer", marginBottom:16 }}>
          {resendLoading ? "Sending…" : "Resend verification email"}
        </button>
        <p style={{ color:"rgba(255,255,255,0.25)", fontSize:13, fontFamily:"'Jost',sans-serif" }}>
          Already verified? <Link to="/login" style={{ color:T.goldLight, fontWeight:600, textDecoration:"none" }}>Sign in here</Link>
        </p>
      </div>
    </div>
  );

  // ── Registration form ────────────────────────────────────────────────────
  return (
    <div style={s.page}>
      <style>{css}</style>
      <div style={s.orb1}/><div style={s.orb2}/><div style={s.dots}/>

      {/* Left brand panel — hidden on mobile */}
      <div className="lp-left">
        <div style={{ position:"absolute", top:28, left:28, width:80, height:80, border:`1px solid rgba(200,169,81,0.12)`, borderRadius:4, pointerEvents:"none" }}/>
        <div style={{ position:"absolute", bottom:28, right:28, width:60, height:60, border:`1px solid rgba(200,169,81,0.08)`, borderRadius:4, pointerEvents:"none" }}/>
        <div style={s.logoMark}><span style={{ fontFamily:"'Playfair Display',serif", fontWeight:800, fontSize:22, color:T.navy }}>LP</span></div>
        <div style={{ display:"flex", alignItems:"center", gap:10, width:"100%", marginBottom:22, zIndex:1, position:"relative" }}>
          <div style={{ flex:1, height:1, background:`linear-gradient(90deg,transparent,${T.gold}88)` }}/>
          <div style={{ width:5, height:5, background:T.gold, transform:"rotate(45deg)", flexShrink:0 }}/>
          <div style={{ flex:1, height:1, background:`linear-gradient(90deg,${T.gold}88,transparent)` }}/>
        </div>
        <h2 style={{ fontFamily:"'Playfair Display',serif", fontWeight:800, fontSize:28, color:"#fff", textAlign:"center", lineHeight:1.2, marginBottom:14, zIndex:1, position:"relative" }}>
          Join<br/><span style={{ color:T.goldLight }}>Luku Prime Shop</span>
        </h2>
        <p style={{ fontFamily:"'Jost',sans-serif", fontWeight:300, fontSize:13, color:"rgba(255,255,255,0.42)", textAlign:"center", lineHeight:1.8, maxWidth:260, zIndex:1, position:"relative" }}>
          Kenya's premium destination for the finest fashion.
        </p>
        <div style={{ marginTop:40, display:"flex", flexDirection:"column", gap:14, width:"100%", zIndex:1, position:"relative" }}>
          {[["👑","Exclusive drops & deals"],["🚚","Fast delivery across Kenya"],["🔒","Secure M-Pesa checkout"],["↩️","30-day hassle-free returns"]].map(([icon,text]) => (
            <div key={text} style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:32, height:32, borderRadius:8, flexShrink:0, background:"rgba(200,169,81,0.09)", border:"1px solid rgba(200,169,81,0.18)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13 }}>{icon}</div>
              <span style={{ fontFamily:"'Jost',sans-serif", fontSize:12, color:"rgba(255,255,255,0.4)" }}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div style={s.right}>
        <div style={s.ring1}/><div style={s.ring2}/>
        <div className="lp-card" style={s.card}>

          {/* Mobile-only logo — hidden on desktop */}
          <div className="lp-mobile-logo">
            <div style={{ width:40, height:40, borderRadius:10, background:`linear-gradient(135deg,${T.gold},${T.goldLight})`, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:800, fontSize:13, color:T.navy }}>LP</span>
            </div>
            <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:800, fontSize:15, color:"#fff" }}>Luku Prime Shop</span>
          </div>

          <div style={{ marginBottom:22 }}>
            <div style={s.tag}>New Member</div>
            <h1 style={s.heading}>Create Account</h1>
            <p style={s.sub}>Join thousands of Luku Prime shoppers</p>
          </div>

          {serverError && <div style={s.errorBox}>{serverError}</div>}

          <div style={{ marginBottom:18, minHeight:44 }}>
            {googleLoading ? <div style={s.gLoad}>Signing in with Google…</div> : <div id="google-btn" style={{ width:"100%", minHeight:44 }}/>}
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
                style={{ borderColor: errors.full_name ? "#ef4444" : "rgba(200,169,81,0.22)" }}
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
                style={{ borderColor: errors.email ? "#ef4444" : "rgba(200,169,81,0.22)" }}
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
                  style={{ paddingRight:50, borderColor: errors.password ? "#ef4444" : "rgba(200,169,81,0.22)" }}
                />
                <button type="button" onClick={() => setShowPassword(x => !x)} className="lp-eye">
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
              {formData.password && (
                <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:7 }}>
                  <div style={{ display:"flex", gap:4, flex:1 }}>
                    {[1,2,3,4].map(i => (
                      <div key={i} style={{ flex:1, height:3, borderRadius:3, transition:"background 0.3s", backgroundColor: passwordStrength >= i ? strengthColor[passwordStrength] : "rgba(255,255,255,0.1)" }}/>
                    ))}
                  </div>
                  <span style={{ fontSize:11, color:strengthColor[passwordStrength], fontWeight:700, fontFamily:"'Jost',sans-serif" }}>{strengthLabel[passwordStrength]}</span>
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
                style={{ borderColor: errors.confirm_password ? "#ef4444" : "rgba(200,169,81,0.22)" }}
              />
              {errors.confirm_password && <span style={s.err}>{errors.confirm_password}</span>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="lp-submit"
              style={{ opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer" }}
            >
              {loading ? "Creating account…" : "Create Account →"}
            </button>
          </form>

          <div style={{ height:1, background:"linear-gradient(90deg,transparent,rgba(200,169,81,0.18),transparent)", margin:"20px 0" }}/>
          <p style={{ fontFamily:"'Jost',sans-serif", fontSize:13, color:"rgba(255,255,255,0.32)", textAlign:"center", marginBottom:14 }}>
            Already have an account? <span className="lp-link" onClick={() => navigate("/login")}>Sign In</span>
          </p>
          <p style={{ textAlign:"center", color:"rgba(255,255,255,0.18)", fontSize:11, fontFamily:"'Jost',sans-serif" }}>
            By signing up you agree to our <Link to="/terms" style={{ color:T.gold, textDecoration:"none" }}>Terms</Link> &amp; <Link to="/privacy" style={{ color:T.gold, textDecoration:"none" }}>Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Global CSS ─────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=Jost:wght@300;400;500;600;700&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

  .lp-inp{background:rgba(255,255,255,0.05);border:1px solid rgba(200,169,81,0.22);border-radius:8px;padding:13px 16px;color:#fff;font-size:14px;font-family:'Jost',sans-serif;width:100%;outline:none;transition:border-color 0.2s,background 0.2s}
  .lp-inp:focus{border-color:#C8A951;background:rgba(200,169,81,0.07)}
  .lp-inp::placeholder{color:rgba(255,255,255,0.22)}

  .lp-submit{width:100%;border:none;border-radius:6px;padding:14px;font-family:'Jost',sans-serif;font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;cursor:pointer;background:linear-gradient(135deg,#C8A951,#DEC06A);color:#0D1B3E;transition:all 0.25s;margin-top:4px}
  .lp-submit:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 10px 28px rgba(200,169,81,0.35)}

  .lp-outline-btn{width:100%;border:1px solid rgba(200,169,81,0.35);border-radius:6px;padding:13px;font-family:'Jost',sans-serif;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;cursor:pointer;background:transparent;color:rgba(200,169,81,0.75);transition:all 0.2s}
  .lp-outline-btn:hover:not(:disabled){border-color:#C8A951;color:#C8A951;background:rgba(200,169,81,0.06)}

  .lp-link{color:#DEC06A;cursor:pointer;font-weight:600;font-family:'Jost',sans-serif;transition:color 0.2s}
  .lp-link:hover{color:#fff}

  .lp-eye{position:absolute;right:14px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:15px;color:rgba(255,255,255,0.3);transition:color 0.2s;padding:0}
  .lp-eye:hover{color:#C8A951}

  @keyframes lpFadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
  .lp-card{animation:lpFadeUp 0.5s ease both}

  .lp-left{width:400px;flex-shrink:0;background:linear-gradient(155deg,#152348 0%,#091325 100%);border-right:1px solid rgba(200,169,81,0.12);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 44px;position:relative;overflow:hidden}

  .lp-mobile-logo{display:none;align-items:center;gap:12px;margin-bottom:26px}

  @media(max-width:768px){
    .lp-left{display:none !important}
    .lp-mobile-logo{display:flex !important}
  }
`;

const s: Record<string, React.CSSProperties> = {
  page:       { minHeight:"100vh", display:"flex", fontFamily:"'Jost',sans-serif", background:"#0D1B3E", overflow:"hidden" },
  orb1:       { position:"fixed", width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle,rgba(200,169,81,0.07) 0%,transparent 70%)", top:-120, left:-120, pointerEvents:"none" },
  orb2:       { position:"fixed", width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle,rgba(200,169,81,0.04) 0%,transparent 70%)", bottom:-100, right:-100, pointerEvents:"none" },
  dots:       { position:"fixed", inset:0, pointerEvents:"none", zIndex:0, backgroundImage:"radial-gradient(rgba(200,169,81,0.04) 1px,transparent 1px)", backgroundSize:"28px 28px" },
  logoMark:   { width:80, height:80, borderRadius:16, marginBottom:36, background:"linear-gradient(135deg,#C8A951,#DEC06A)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 8px 28px rgba(200,169,81,0.3)", position:"relative", zIndex:1 },
  right:      { flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:"clamp(20px,4vw,40px) clamp(16px,4vw,24px)", background:"linear-gradient(135deg,#0D1B3E 0%,#091325 100%)", position:"relative", overflow:"hidden" },
  ring1:      { position:"absolute", bottom:-140, right:-140, width:420, height:420, borderRadius:"50%", border:"1px solid rgba(200,169,81,0.06)", pointerEvents:"none" },
  ring2:      { position:"absolute", bottom:-100, right:-100, width:300, height:300, borderRadius:"50%", border:"1px solid rgba(200,169,81,0.04)", pointerEvents:"none" },
  card:       { width:"100%", maxWidth:440, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(200,169,81,0.15)", borderRadius:20, padding:"clamp(24px,5vw,44px) clamp(18px,5vw,40px)", backdropFilter:"blur(8px)", position:"relative", zIndex:1 },
  tag:        { fontFamily:"'Jost',sans-serif", fontSize:10, fontWeight:700, letterSpacing:"3px", color:"#C8A951", textTransform:"uppercase" as const, marginBottom:10 },
  heading:    { fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"clamp(20px,4vw,26px)" as any, color:"#fff", marginBottom:6 },
  sub:        { fontFamily:"'Jost',sans-serif", fontSize:13, color:"rgba(255,255,255,0.35)", marginBottom:0 },
  label:      { display:"block", fontFamily:"'Jost',sans-serif", fontSize:10, fontWeight:700, letterSpacing:"2px", color:"rgba(200,169,81,0.75)", textTransform:"uppercase" as const, marginBottom:8 },
  err:        { color:"#f87171", fontSize:11, fontFamily:"'Jost',sans-serif", marginTop:4, display:"block" },
  errorBox:   { background:"rgba(192,57,43,0.1)", border:"1px solid rgba(192,57,43,0.3)", borderRadius:8, padding:"12px 16px", color:"#fca5a5", fontFamily:"'Jost',sans-serif", fontSize:13, marginBottom:18 },
  successBox: { background:"rgba(90,138,90,0.12)", border:"1px solid rgba(90,138,90,0.3)", borderRadius:8, padding:"12px 16px", color:"#86efac", fontFamily:"'Jost',sans-serif", fontSize:13, marginBottom:18 },
  gLoad:      { background:"rgba(255,255,255,0.04)", border:"1px solid rgba(200,169,81,0.2)", borderRadius:8, padding:"12px", color:"rgba(255,255,255,0.28)", fontFamily:"'Jost',sans-serif", fontSize:13, textAlign:"center" as const },
  divider:    { display:"flex", alignItems:"center", gap:12, marginBottom:18 },
  divLine:    { flex:1, height:1, background:"linear-gradient(90deg,transparent,rgba(200,169,81,0.2),transparent)", display:"block" },
  divText:    { fontFamily:"'Jost',sans-serif", fontSize:10, color:"rgba(255,255,255,0.22)", letterSpacing:"1.5px", textTransform:"uppercase" as const, whiteSpace:"nowrap" as const },
  ornRow:     { display:"flex", alignItems:"center", gap:10, marginBottom:22, width:"100%" },
  ornLine:    { flex:1, height:1, background:"linear-gradient(90deg,transparent,rgba(200,169,81,0.4),transparent)" },
  ornDiamond: { width:5, height:5, background:"#C8A951", transform:"rotate(45deg)", flexShrink:0 },
};