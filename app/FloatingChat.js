"use client";

import { useState, useEffect, useRef } from "react";
import { color, font, radius, space, size, motion } from "../lib/theme";
import { Button } from "./ui";

function IconChat({ s = 22, c }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a8 8 0 01-11.7 7.1L4 20.5l1.4-4.6A8 8 0 1121 12z" />
    </svg>
  );
}

function IconClose({ s = 18, c }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function IconSend({ s = 16, c }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 17L17 7" />
      <path d="M9 7h8v8" />
    </svg>
  );
}

export default function FloatingChat({ chatMessages, chatInput, setChatInput, chatLoading, chatError, onSubmit }) {
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current && messagesEndRef.current.scrollIntoView) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, isOpen]);

  const canSend = !chatLoading && !!(chatInput && chatInput.trim());

  return (
    <div style={{ position: "fixed", bottom: 90, right: space.lg, zIndex: 99999, fontFamily: font.family }}>
      <style>{`
        @keyframes tq-chat-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            bottom: 70,
            right: 0,
            width: 320,
            height: 450,
            maxHeight: "65vh",
            background: color.surface,
            border: `1px solid ${color.borderActive}`,
            borderRadius: radius.xl,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            animation: `tq-chat-in ${motion.base}`,
          }}
        >
          {/* Тақырып */}
          <div style={{ padding: `${space.md}px ${space.lg}px`, borderBottom: `1px solid ${color.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: font.md, fontWeight: font.semibold, color: color.textPrimary }}>TradeIQ AI</div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Жабу"
              style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4, display: "flex" }}
            >
              <IconClose c={color.textMuted} />
            </button>
          </div>

          {/* Хабарламалар */}
          <div style={{ flex: 1, padding: space.lg, overflowY: "auto", display: "flex", flexDirection: "column", gap: space.md }}>
            {chatMessages.length === 0 ? (
              <div style={{ color: color.textMuted, fontSize: font.sm, textAlign: "center", marginTop: 40, lineHeight: 1.5 }}>
                Сәлем! Мен TradeIQ AI-мін.
                <br />
                Акция немесе нарық туралы сұрағың бар ма?
              </div>
            ) : (
              chatMessages.map((msg, idx) => {
                const mine = msg.role === "user";
                return (
                  <div
                    key={idx}
                    style={{
                      alignSelf: mine ? "flex-end" : "flex-start",
                      maxWidth: "85%",
                      padding: `${space.sm}px ${space.md}px`,
                      borderRadius: radius.lg,
                      background: mine ? color.accentStrong : color.surfaceAlt,
                      border: mine ? "none" : `1px solid ${color.border}`,
                      color: mine ? color.textOnAccent : color.textPrimary,
                      fontSize: font.sm,
                      lineHeight: 1.5,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {msg.text}
                  </div>
                );
              })
            )}
            {chatLoading && <div style={{ color: color.accentText, fontSize: font.xs, alignSelf: "flex-start" }}>AI жауап жазуда...</div>}
            {chatError && <div style={{ color: color.lossStrong, fontSize: font.xs, alignSelf: "center", textAlign: "center" }}>{chatError}</div>}
            <div ref={messagesEndRef} />
          </div>

          {/* Енгізу */}
          <form onSubmit={onSubmit} style={{ padding: space.md, borderTop: `1px solid ${color.border}`, display: "flex", gap: space.sm, background: color.surfaceAlt }}>
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Сұрақ қойыңыз..."
              style={{
                flex: 1,
                minWidth: 0,
                height: size.buttonHeight,
                padding: `0 ${space.md}px`,
                background: color.surfaceInput,
                border: `1px solid ${color.border}`,
                borderRadius: radius.md,
                color: color.textPrimary,
                fontFamily: font.family,
                fontSize: font.sm,
                outline: "none",
              }}
            />
            <Button type="submit" disabled={!canSend} style={{ width: size.buttonHeight, padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }} aria-label="Жіберу">
              <IconSend c={color.textOnAccent} />
            </Button>
          </form>
        </div>
      )}

      {/* Ашу/жабу батырмасы */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Чатты жабу" : "Чатты ашу"}
        style={{
          width: 52,
          height: 52,
          borderRadius: "50%",
          background: isOpen ? color.surface : color.accentStrong,
          border: isOpen ? `1px solid ${color.border}` : "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          transition: `background ${motion.fast}`,
        }}
      >
        {isOpen ? <IconClose c={color.textPrimary} /> : <IconChat c={color.textOnAccent} />}
      </button>
    </div>
  );
}
