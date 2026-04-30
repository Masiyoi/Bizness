import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

declare global {
  interface Window {
    google: any;
    grecaptcha: any;
  }
}

const redirectByRole = (user: any, navigate: (p: string) => void) =>
  navigate(user?.role === 'admin' ? '/admin' : '/');

const T = {
  navy:'#0D1B3E', navyMid:'#152348', navyLight:'#1E2F5A',
  gold:'#C8A951', goldLight:'#DEC06A',
};

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

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email,         setEmail]         = useState("");
  const [password,      setPassword]      = useState("");
  const [showPassword,  setShowPassword]  = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error,         setError]         = useState("");
  const [verifiedMsg,   setVerifiedMsg]   = useState("");
  const [unverified,    setUnverified]    = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMsg,     setResendMsg]     = useState("");
  const [locked,        setLocked]        = useState(false);
  const [lockedUntil,   setLockedUntil]   = useState<Date | null>(null);

  useEffect(() => {
    if (location.search.includes("verified=true"))
      setVerifiedMsg("✅ Email verified! You can now sign in.");
  }, [location]);

  const handleGoogleResponse = useCallback(async (response: { credential: string }) => {
    setGoogleLoading(true); setError("");
    try {
      const res = await axios.post("/api/auth/google", { credential: response.credential }, {
        withCredentials: true,   // ← same here
      });
      // ✅ Only store safe UI data
      localStorage.setItem("user", JSON.stringify(res.data.user));
      redirectByRole(res.data.user, navigate);
    } catch (err: any) {
      setError(err.response?.data?.msg || "Google sign-in failed.");
    } finally { setGoogleLoading(false); }
  }, [navigate]);


  useEffect(() => {
    const t = setTimeout(() => {
      if (window.google) {
        window.google.accounts.id.initialize({ client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID, callback: handleGoogleResponse });
        window.google.accounts.id.renderButton(document.getElementById("google-login-btn"), { theme:"outline", size:"large", width:"100%", text:"signin_with", shape:"rectangular" });
      }
    }, 300);
    return () => clearTimeout(t);
  }, [handleGoogleResponse]);

  // Add this useEffect to Login.tsx and Register.tsx only
useEffect(() => {
  const script = document.createElement('script');
  script.src = 'https://www.google.com/recaptcha/api.js?render=6LdlHMQsAAAAAJ5Ft84oddhVF0cUKkU7u65Xlb2o';
  script.async = true;
  document.body.appendChild(script);

  // Cleanup — remove script and badge when leaving the page
  return () => {
    document.body.removeChild(script);
    const badge = document.querySelector('.grecaptcha-badge');
    if (badge) badge.remove();
  };
}, []);

   const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError("Please enter your email and password."); return; }
    setLoading(true); setError(""); setUnverified(false); setLocked(false);
    try {
      const recaptchaToken = await getRecaptchaToken('login');
      const res = await axios.post("/api/auth/login", { email, password, recaptchaToken }, {
        withCredentials: true,   // ← ensures the Set-Cookie header is accepted
      });
      // ✅ Only store safe, non-sensitive UI data — never the token
      localStorage.setItem("user", JSON.stringify(res.data.user));
      redirectByRole(res.data.user, navigate);
    } catch (err: any) {
      setError(err.response?.data?.msg || "Login failed.");
      if (err.response?.data?.unverified) setUnverified(true);
      if (err.response?.status === 423) {
        setLocked(true);
        setLockedUntil(new Date(err.response.data.lockedUntil));
      }
    } finally { setLoading(false); }
  };
 

  const handleResend = async () => {
    setResendLoading(true); setResendMsg("");
    try {
      const res = await axios.post("/api/auth/resend-verification", { email });
      setResendMsg(res.data.msg);
    } catch { setResendMsg("Failed to resend."); }
    finally { setResendLoading(false); }
  };

  return (
    <div style={s.page}>
      <style>{css}</style>
      <div style={s.orb1}/><div style={s.orb2}/>

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
          Welcome Back<br/><span style={{ color:T.goldLight }}>to Luku Prime</span>
        </h2>
        <p style={{ fontFamily:"'Jost',sans-serif", fontWeight:300, fontSize:13, color:"rgba(255,255,255,0.42)", textAlign:"center", lineHeight:1.8, maxWidth:260, zIndex:1, position:"relative" }}>
          Kenya's premium destination for the finest products.
        </p>
        <div style={{ marginTop:44, display:"flex", flexDirection:"column", gap:14, width:"100%", zIndex:1, position:"relative" }}>
          {[["🔒","Secure, encrypted login"],["👑","Access your premium account"],["🚚","Track your orders instantly"]].map(([icon,text]) => (
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

          {/* Mobile-only logo */}
          <div className="lp-mobile-logo">
            <div style={{ width:40, height:40, borderRadius:10, background:`linear-gradient(135deg,${T.gold},${T.goldLight})`, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:800, fontSize:13, color:T.navy }}>LP</span>
            </div>
            <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:800, fontSize:15, color:"#fff" }}>Luku Prime Shop</span>
          </div>

          <div style={{ marginBottom:24 }}>
            <div style={s.tag}>Member Login</div>
            <h1 style={s.heading}>Sign In</h1>
            <p style={s.sub}>Enter your credentials to continue</p>
          </div>

          {verifiedMsg && <div style={s.successBox}>{verifiedMsg}</div>}

          {locked && lockedUntil && (
            <div style={s.lockedBox}>
              🔒 Account locked until {lockedUntil.toLocaleTimeString('en-KE')}. Too many failed attempts.
            </div>
          )}

          {error && !locked && (
            <div style={s.errorBox}>
              {error}
              {unverified && (
                <div style={{ marginTop:10 }}>
                  <button onClick={handleResend} disabled={resendLoading} style={s.resendBtn}>
                    {resendLoading ? "Sending…" : "Resend verification email"}
                  </button>
                  {resendMsg && <div style={{ marginTop:8, fontSize:12, color:"#86efac" }}>{resendMsg}</div>}
                </div>
              )}
            </div>
          )}

          <div style={{ marginBottom:20, minHeight:44 }}>
            {googleLoading
              ? <div style={s.gLoad}>Signing in with Google…</div>
              : <div id="google-login-btn" style={{ width:"100%", minHeight:44 }}/>
            }
          </div>

          <div style={s.divider}><span style={s.divLine}/><span style={s.divText}>or with email</span><span style={s.divLine}/></div>

          <form onSubmit={handleSubmit} noValidate style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <div>
              <label style={s.label}>Email Address</label>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                maxLength={254}
                className="lp-inp"
              />
            </div>
            <div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                <label style={{ ...s.label, marginBottom:0 }}>Password</label>
                <span className="lp-link" style={{ fontSize:11 }} onClick={() => navigate("/forgot-password")}>
                  Forgot password?
                </span>
              </div>
              <div style={{ position:"relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  maxLength={128}
                  className="lp-inp"
                  style={{ paddingRight:48 }}
                />
                <button type="button" className="lp-eye" onClick={() => setShowPassword(x => !x)}>
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading || locked} className="lp-submit">
              {loading ? "Signing in…" : locked ? "Account Locked" : "Sign In →"}
            </button>
          </form>

          <div style={{ height:1, background:`linear-gradient(90deg,transparent,rgba(200,169,81,0.18),transparent)`, margin:"22px 0" }}/>
          <p style={{ fontFamily:"'Jost',sans-serif", fontSize:13, color:"rgba(255,255,255,0.32)", textAlign:"center" }}>
            Don't have an account? <span className="lp-link" onClick={() => navigate("/register")}>Join Free</span>
          </p>
        </div>
      </div>
    </div>
  );
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=Jost:wght@300;400;500;600;700&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

  .lp-inp{background:rgba(255,255,255,0.05);border:1px solid rgba(200,169,81,0.22);border-radius:8px;padding:13px 16px;color:#fff;font-size:14px;font-family:'Jost',sans-serif;width:100%;outline:none;letter-spacing:0.2px;transition:border-color 0.2s,background 0.2s}
  .lp-inp:focus{border-color:#C8A951;background:rgba(200,169,81,0.07)}
  .lp-inp::placeholder{color:rgba(255,255,255,0.22)}

  .lp-submit{width:100%;border:none;border-radius:6px;padding:14px;font-family:'Jost',sans-serif;font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;cursor:pointer;background:linear-gradient(135deg,#C8A951,#DEC06A);color:#0D1B3E;transition:all 0.25s;margin-top:4px}
  .lp-submit:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 10px 28px rgba(200,169,81,0.35)}
  .lp-submit:disabled{opacity:0.6;cursor:not-allowed}

  .lp-link{color:#DEC06A;cursor:pointer;font-weight:600;font-family:'Jost',sans-serif;font-size:12px;transition:color 0.2s}
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
  page:       { minHeight:"100vh", display:"flex", fontFamily:"'Jost',sans-serif", background:T.navy, overflow:"hidden" },
  orb1:       { position:"fixed", width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle,rgba(200,169,81,0.07) 0%,transparent 70%)", top:-120, left:-120, pointerEvents:"none" },
  orb2:       { position:"fixed", width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle,rgba(200,169,81,0.04) 0%,transparent 70%)", bottom:-100, right:-100, pointerEvents:"none" },
  logoMark:   { width:80, height:80, borderRadius:16, marginBottom:36, background:`linear-gradient(135deg,${T.gold},${T.goldLight})`, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 8px 28px rgba(200,169,81,0.3)", position:"relative", zIndex:1 },
  right:      { flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:"clamp(20px,4vw,40px) clamp(16px,4vw,24px)", background:`linear-gradient(135deg,${T.navy} 0%,#091325 100%)`, position:"relative", overflow:"hidden" },
  ring1:      { position:"absolute", bottom:-140, right:-140, width:420, height:420, borderRadius:"50%", border:"1px solid rgba(200,169,81,0.06)", pointerEvents:"none" },
  ring2:      { position:"absolute", bottom:-100, right:-100, width:300, height:300, borderRadius:"50%", border:"1px solid rgba(200,169,81,0.04)", pointerEvents:"none" },
  card:       { width:"100%", maxWidth:430, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(200,169,81,0.15)", borderRadius:20, padding:"clamp(24px,5vw,44px) clamp(18px,5vw,40px)", backdropFilter:"blur(8px)", position:"relative", zIndex:1 },
  tag:        { fontFamily:"'Jost',sans-serif", fontSize:10, fontWeight:700, letterSpacing:"3px", color:T.gold, textTransform:"uppercase" as const, marginBottom:10 },
  heading:    { fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"clamp(20px,4vw,26px)" as any, color:"#fff", marginBottom:6 },
  sub:        { fontFamily:"'Jost',sans-serif", fontSize:13, color:"rgba(255,255,255,0.35)" },
  label:      { display:"block", fontFamily:"'Jost',sans-serif", fontSize:10, fontWeight:700, letterSpacing:"2px", color:`rgba(200,169,81,0.75)`, textTransform:"uppercase" as const, marginBottom:8 },
  successBox: { background:"rgba(90,138,90,0.12)", border:"1px solid rgba(90,138,90,0.3)", borderRadius:8, padding:"12px 16px", color:"#86efac", fontFamily:"'Jost',sans-serif", fontSize:13, marginBottom:20 },
  errorBox:   { background:"rgba(192,57,43,0.1)", border:"1px solid rgba(192,57,43,0.3)", borderRadius:8, padding:"12px 16px", color:"#fca5a5", fontFamily:"'Jost',sans-serif", fontSize:13, marginBottom:20 },
  lockedBox:  { background:"rgba(192,57,43,0.12)", border:"1px solid rgba(192,57,43,0.4)", borderRadius:8, padding:"12px 16px", color:"#fca5a5", fontFamily:"'Jost',sans-serif", fontSize:13, marginBottom:20, fontWeight:600 },
  resendBtn:  { background:"transparent", border:"1px solid rgba(192,57,43,0.4)", borderRadius:6, padding:"6px 14px", color:"#fca5a5", fontSize:12, cursor:"pointer", fontFamily:"'Jost',sans-serif" },
  gLoad:      { background:"rgba(255,255,255,0.04)", border:"1px solid rgba(200,169,81,0.2)", borderRadius:8, padding:"12px", color:"rgba(255,255,255,0.28)", fontFamily:"'Jost',sans-serif", fontSize:13, textAlign:"center" as const },
  divider:    { display:"flex", alignItems:"center", gap:12, marginBottom:22 },
  divLine:    { flex:1, height:1, background:"linear-gradient(90deg,transparent,rgba(200,169,81,0.2),transparent)", display:"block" },
  divText:    { fontFamily:"'Jost',sans-serif", fontSize:10, color:"rgba(255,255,255,0.22)", letterSpacing:"1.5px", textTransform:"uppercase" as const, whiteSpace:"nowrap" as const },
};