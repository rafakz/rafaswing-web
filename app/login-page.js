"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import NavMenu from "../NavMenu";
import { supabase } from "../supabaseClient";

const colors = {
  bg: "#0B0F1A",
  card: "#141B2E",
  border: "#263248",
  gold: "#C9A227",
  goldBright: "#E8C468",
  textPrimary: "#F5F1E6",
  textMuted: "#8A93A6",
  textFaint: "#5B6478",
  loss: "#E2764C",
  gain: "#6FCBA8",
};

const fontDisplay = "'Georgia', 'Times New Roman', serif";
const fontBody = "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState("login"); // "login" немесе "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!email.trim() || !password.trim()) {
      setError("Email және парольді толтырыңыз");
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

  function translateAuthError(msg) {
    if (!msg) return "Белгісіз қате";
    if (msg.includes("Invalid login credentials")) return "Email немесе пароль қате";
    if (msg.includes("User already registered")) return "Бұл email бұрын тіркелген";
    if (msg.includes("Password should be at least")) return "Пароль кемінде 6 таңбадан тұруы керек";
    if (msg.includes("Unable to validate email")) return "Email форматы дұрыс емес";
    return msg;
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: colors.bg,
        color: colors.textPrimary,
        padding: "32px 16px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        fontFamily: fontBody,
      }}
    >
      <NavMenu />

      <h1
        style={{
          fontFamily: fontDisplay,
          fontSize: "1.6rem",
          fontWeight: "bold",
          marginTop: "8px",
          marginBottom: "22px",
        }}
      >
        {mode === "login" ? "Кіру" : "Тіркелу"}
      </h1>

      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          maxWidth: "340px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          style={{
            padding: "12px 14px",
            borderRadius: "10px",
            border: `1px solid ${colors.border}`,
            background: colors.card,
            color: colors.textPrimary,
            fontSize: "1rem",
            fontFamily: fontBody,
          }}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Пароль"
          style={{
            padding: "12px 14px",
            borderRadius: "10px",
            border: `1px solid ${colors.border}`,
            background: colors.card,
            color: colors.textPrimary,
            fontSize: "1rem",
            fontFamily: fontBody,
          }}
        />

        {error ? <p style={{ color: colors.loss, fontSize: "0.85rem", margin: 0 }}>{error}</p> : null}
        {message ? <p style={{ color: colors.gain, fontSize: "0.85rem", margin: 0 }}>{message}</p> : null}

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "12px",
            borderRadius: "10px",
            border: "none",
            background: colors.gold,
            color: colors.bg,
            fontWeight: "bold",
            fontSize: "1rem",
            fontFamily: fontBody,
            cursor: loading ? "default" : "pointer",
            opacity: loading ? 0.7 : 1,
            marginTop: "6px",
          }}
        >
          {loading ? "Жүктелуде..." : mode === "login" ? "Кіру" : "Тіркелу"}
        </button>
      </form>

      <button
        onClick={() => {
          setMode(mode === "login" ? "signup" : "login");
          setError("");
          setMessage("");
        }}
        style={{
          marginTop: "18px",
          background: "transparent",
          border: "none",
          color: colors.goldBright,
          fontSize: "0.85rem",
          cursor: "pointer",
          textDecoration: "underline",
        }}
      >
        {mode === "login" ? "Аккаунтың жоқ па? Тіркел" : "Аккаунтың бар ма? Кір"}
      </button>
    </main>
  );
}
