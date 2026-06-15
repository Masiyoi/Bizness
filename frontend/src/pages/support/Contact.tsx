// src/pages/support/Contact.tsx
import { useState } from "react";
import PageShell, { Section, AccentCard } from "../../components/common/PageShell";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);

  const handleSubmit = () => {
    if (!form.name || !form.email || !form.message) return;
    setSent(true);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "#fff",
    border: "1px solid rgba(0,0,0,0.1)",
    borderRadius: 8,
    padding: "12px 14px",
    fontFamily: "'DM Sans',sans-serif",
    fontSize: 13,
    color: "#0a0a0a",
    outline: "none",
    boxSizing: "border-box",
    marginBottom: 14,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 10, fontWeight: 700, letterSpacing: "1.5px",
    color: "rgba(0,0,0,0.4)", textTransform: "uppercase",
    display: "block", marginBottom: 6,
  };

  const cardStyle: React.CSSProperties = {
    background: "#fff",
    border: "1px solid rgba(0,0,0,0.08)",
    borderRadius: 10,
    padding: "16px 18px",
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    textDecoration: "none",
  };

  return (
    <PageShell
      badge="Support"
      title="Contact Us"
      subtitle="We are here to help. Reach out via any channel below and we will get back to you quickly."
    >
      <Section title="Get in Touch">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12, marginBottom: 8 }}>

          <a href="https://wa.me/254707099935" target="_blank" rel="noopener noreferrer" style={cardStyle}>
            <span style={{ fontSize: 20 }}>📞</span>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.5px", color: "rgba(0,0,0,0.35)", textTransform: "uppercase", marginBottom: 4 }}>Phone / WhatsApp</div>
              <div style={{ fontSize: 13, color: "#0a0a0a", fontWeight: 600, marginBottom: 2 }}>+254 707 099 935</div>
              <div style={{ fontSize: 11, color: "rgba(0,0,0,0.35)", fontWeight: 300 }}>Tap to open WhatsApp</div>
            </div>
          </a>

          <a href="mailto:lukuprime254@gmail.com" style={cardStyle}>
            <span style={{ fontSize: 20 }}>✉️</span>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.5px", color: "rgba(0,0,0,0.35)", textTransform: "uppercase", marginBottom: 4 }}>Email</div>
              <div style={{ fontSize: 13, color: "#0a0a0a", fontWeight: 600, marginBottom: 2 }}>lukuprime254@gmail.com</div>
              <div style={{ fontSize: 11, color: "rgba(0,0,0,0.35)", fontWeight: 300 }}>Tap to send email</div>
            </div>
          </a>

          <a href="https://www.google.com/maps/search/Nairobi+CBD+Kenya" target="_blank" rel="noopener noreferrer" style={cardStyle}>
            <span style={{ fontSize: 20 }}>📍</span>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.5px", color: "rgba(0,0,0,0.35)", textTransform: "uppercase", marginBottom: 4 }}>Visit Us</div>
              <div style={{ fontSize: 13, color: "#0a0a0a", fontWeight: 600, marginBottom: 2 }}>Nairobi CBD, Kenya</div>
              <div style={{ fontSize: 11, color: "rgba(0,0,0,0.35)", fontWeight: 300 }}>View on Maps</div>
            </div>
          </a>

          <div style={cardStyle}>
            <span style={{ fontSize: 20 }}>🕐</span>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.5px", color: "rgba(0,0,0,0.35)", textTransform: "uppercase", marginBottom: 4 }}>Working Hours</div>
              <div style={{ fontSize: 13, color: "#0a0a0a", fontWeight: 600, marginBottom: 2 }}>Mon-Sat, 9am-6pm</div>
              <div style={{ fontSize: 11, color: "rgba(0,0,0,0.35)", fontWeight: 300 }}>EAT (UTC+3)</div>
            </div>
          </div>

        </div>
      </Section>

      <Section title="Send a Message">
        {sent ? (
          <div style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 10, padding: "28px", textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
            <div style={{ fontWeight: 700, fontSize: 16, color: "#0a0a0a", marginBottom: 6 }}>Message Sent!</div>
            <div style={{ fontSize: 13, color: "#666", fontWeight: 300 }}>We will get back to you within a few hours during business hours.</div>
          </div>
        ) : (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px" }}>
              <div>
                <label style={labelStyle}>Name *</label>
                <input style={inputStyle} placeholder="Your full name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>Email *</label>
                <input style={inputStyle} type="email" placeholder="your@email.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
            <label style={labelStyle}>Subject</label>
            <input style={inputStyle} placeholder="Order issue, sizing question, etc." value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} />
            <label style={labelStyle}>Message *</label>
            <textarea
              style={{ ...inputStyle, minHeight: 120, resize: "vertical", marginBottom: 18 }}
              placeholder="How can we help you?"
              value={form.message}
              onChange={e => setForm({ ...form, message: e.target.value })}
            />
            <button
              onClick={handleSubmit}
              style={{
                background: "#000", color: "#fff",
                border: "none", borderRadius: 6,
                padding: "13px 28px", fontFamily: "'DM Sans',sans-serif",
                fontSize: 11, fontWeight: 700, letterSpacing: "2px",
                textTransform: "uppercase", cursor: "pointer",
              }}
            >
              Send Message
            </button>
          </div>
        )}
      </Section>

      <AccentCard>
        <strong>Fastest response:</strong> WhatsApp us directly at{" "}
        <a href="https://wa.me/254707099935" target="_blank" rel="noopener noreferrer" style={{ color: "#000", fontWeight: 700 }}>
          +254 707 099 935
        </a>{" "}
        for urgent queries — we typically reply within minutes during business hours.
      </AccentCard>
    </PageShell>
  );
}
