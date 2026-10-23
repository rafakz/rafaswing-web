"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../supabaseClient";

// TradeIQ Премиум түстері
const colors = {
  bg: "#0B0F19",
  card: "rgba(20, 28, 45, 0.7)",
  cardBorder: "rgba(255, 255, 255, 0.08)",
  gold: "#3b82f6", // Біздің дизайнда негізгі түс көк (Neon Blue)
  goldBright: "#60a5fa",
  textPrimary: "#ffffff",
  textMuted: "#9ca3af",
  textFaint: "#6b7280",
  lossBright: "#f87171",
  gainBright: "#34d399",
};

const fontBody = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState("login"); // "login" немесе "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Егер қолданушы жүйеге кіріп қойған болса, басты бетке бағыттау
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) router.push("/");
    };
    checkUser();
  }, [router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!email.trim() || !password.trim()) {
      setError("Email және құпия сөзді толтырыңыз");
      return;
    }

    setLoading(true);

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
        });

        if (error) {
          setError(translateAuthError(error.message));
        } else if (data && data.user && !data.session) {
          setMessage("Тіркелу сәтті өтті! Поштаңызға жіберілген растау сілтемесін басыңыз.");
        } else {
          setMessage("Тіркелу сәтті өтті!");
          router.push("/");
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });

        if (error) {
          setError(translateAuthError(error.message));
        } else {
          router.push("/");
        }
      }
    } catch (err) {
      setError("Байланыс қатесі болды");
    } finally {
      setLoading(false);
    }
  }

  // Сіздің қателерді аударатын тамаша функцияңыз
  function translateAuthError(msg) {
    if (!msg) return "Белгісіз қате";
    if (msg.includes("Invalid login credentials")) return "Email немесе құпия сөз қате";
    if (msg.includes("User already registered")) return "Бұл email бұрын тіркелген";
    if (msg.includes("Password should be at least")) return "Құпия сөз кемінде 6 таңбадан тұруы керек";
    if (msg.includes("Unable to validate email")) return "Email форматы дұрыс емес";
    return msg;
  }

  return (
    <main style={{ minHeight: "100vh", backgroundColor: colors.bg, color: colors.textPrimary, fontFamily: fontBody, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", position: "relative", overflow: "hidden" }}>
      
      {/* Фондағы жарқыл эффекти (Glow) */}
      <div style={{ position: "absolute", top: "-10%", left: "-10%", width: "300px", height: "300px", background: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(0,0,0,0) 70%)", borderRadius: "50%", zIndex: 0 }}></div>
      <div style={{ position: "absolute", bottom: "-10%", right: "-10%", width: "300px", height: "300px", background: "radial-gradient(circle, rgba(16,185,129,0.1) 0%, rgba(0,0,0,0) 70%)", borderRadius: "50%", zIndex: 0 }}></div>

      <div style={{ width: "100%", maxWidth: "400px", background: colors.card, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: `1px solid ${colors.cardBorder}`, borderRadius: "24px", padding: "40px 30px", zIndex: 1, boxShadow: "0 20px 40px rgba(0,0,0,0.5)" }}>
        
        {/* Логотип */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h1 style={{ fontSize: "2.2rem", fontWeight: "800", letterSpacing: "-1px", margin: "0 0 8px 0" }}>
            Trade<span style={{ color: colors.gold, textShadow: "0 0 15px rgba(59,130,246,0.6)" }}>IQ</span>
          </h1>
          <p style={{ color: colors.textMuted, fontSize: "0.85rem", margin: 0 }}>
            {mode === "login" ? "Қайта оралуыңызбен! Жүйеге кіріңіз." : "Дала рухымен сауда жасауды бастаңыз."}
          </p>
        </div>

        {error && <div style={{ background: "rgba(239,68,68,0.1)", border: `1px solid ${colors.lossBright}`, color: colors.lossBright, padding: "12px", borderRadius: "12px", fontSize: "0.85rem", marginBottom: "20px", textAlign: "center" }}>{error}</div>}
        {message && <div style={{ background: "rgba(16,185,129,0.1)", border: `1px solid ${colors.gainBright}`, color: colors.gainBright, padding: "12px", borderRadius: "12px", fontSize: "0.85rem", marginBottom: "20px", textAlign: "center", lineHeight: "1.5" }}>{message}</div>}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.8rem", color: colors.textFaint, marginBottom: "8px", fontWeight: "600" }}>Электронды пошта</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              style={{ width: "100%", background: "rgba(0,0,0,0.3)", border: `1px solid rgba(255,255,255,0.1)`, padding: "14px", borderRadius: "14px", color: colors.textPrimary, fontSize: "0.95rem", outline: "none", transition: "border-color 0.2s" }}
              onFocus={(e) => e.target.style.borderColor = colors.gold}
              onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.8rem", color: colors.textFaint, marginBottom: "8px", fontWeight: "600" }}>Құпия сөз</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ width: "100%", background: "rgba(0,0,0,0.3)", border: `1px solid rgba(255,255,255,0.1)`, padding: "14px", borderRadius: "14px", color: colors.textPrimary, fontSize: "0.95rem", outline: "none", transition: "border-color 0.2s" }}
              onFocus={(e) => e.target.style.borderColor = colors.gold}
              onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ marginTop: "8px", width: "100%", padding: "14px", borderRadius: "14px", border: "none", background: colors.gold, color: "#fff", fontWeight: "700", fontSize: "1rem", cursor: loading ? "default" : "pointer", boxShadow: "0 4px 20px rgba(59,130,246,0.4)", transition: "transform 0.2s, filter 0.2s", opacity: loading ? 0.7 : 1 }}
            onMouseOver={(e) => !loading && (e.target.style.filter = "brightness(1.1)")}
            onMouseOut={(e) => !loading && (e.target.style.filter = "brightness(1)")}
            onMouseDown={(e) => !loading && (e.target.style.transform = "scale(0.98)")}
            onMouseUp={(e) => !loading && (e.target.style.transform = "scale(1)")}
          >
            {loading ? "Күте тұрыңыз..." : (mode === "login" ? "Кіру" : "Тіркелу")}
          </button>
        </form>

        <div style={{ marginTop: "24px", textAlign: "center", fontSize: "0.85rem", color: colors.textMuted }}>
          {mode === "login" ? "Аккаунтыңыз жоқ па?" : "Аккаунтыңыз бар ма?"}
          <button
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setError("");
              setMessage("");
            }}
            style={{ background: "none", border: "none", color: colors.goldBright, fontWeight: "700", marginLeft: "6px", cursor: "pointer" }}
          >
            {mode === "login" ? "Тіркелу" : "Жүйеге кіру"}
          </button>
        </div>

      </div>
    </main>
  );
}
