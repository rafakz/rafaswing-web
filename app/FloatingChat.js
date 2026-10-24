"use client";

import { useState, useEffect, useRef } from "react";

export default function FloatingChat({ 
  chatMessages, 
  chatInput, 
  setChatInput, 
  chatLoading, 
  chatError, 
  onSubmit 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef(null);

  // Автоматический скролл вниз при новых сообщениях
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, isOpen]);

  return (
    <div style={{ 
      position: "fixed", 
      bottom: "90px", /* Нижнее меню перекрывать не будет */
      right: "16px", 
      zIndex: 99999 /* Максимально поверх всех элементов */
    }}>
      
      {/* Окно чата */}
      {isOpen && (
        <div style={{
          position: "absolute", 
          bottom: "70px", 
          right: "0",
          width: "320px", 
          height: "450px", 
          maxHeight: "65vh",
          background: "rgba(15, 23, 42, 0.95)", 
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(59,130,246,0.3)", 
          borderRadius: "20px",
          display: "flex", 
          flexDirection: "column", 
          overflow: "hidden",
          boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
          animation: "fadeInUp 0.3s ease-out"
        }}>
          {/* Шапка чата */}
          <div style={{ 
            padding: "16px", 
            background: "linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)", 
            color: "#fff", 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center" 
          }}>
            <div style={{ fontWeight: "700", fontSize: "1rem", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>✨</span> TradeIQ AI
            </div>
            <button 
              onClick={() => setIsOpen(false)} 
              style={{ background: "transparent", border: "none", color: "#fff", cursor: "pointer", fontSize: "1.2rem", padding: "0 8px" }}
            >
              ✕
            </button>
          </div>

          {/* Область сообщений */}
          <div style={{ 
            flex: 1, 
            padding: "16px", 
            overflowY: "auto", 
            display: "flex", 
            flexDirection: "column", 
            gap: "12px",
            fontFamily: "'Inter', sans-serif"
          }}>
            {chatMessages.length === 0 ? (
              <div style={{ color: "#9ca3af", fontSize: "0.85rem", textAlign: "center", marginTop: "40px", lineHeight: "1.5" }}>
                Сәлем! Мен TradeIQ жасанды интеллектімін.<br/>Акция немесе нарық туралы сұрағыңыз бар ма?
              </div>
            ) : (
              chatMessages.map((msg, idx) => (
                <div key={idx} style={{
                  alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                  background: msg.role === "user" ? "#3b82f6" : "rgba(255,255,255,0.1)",
                  color: "#fff", 
                  padding: "10px 14px", 
                  borderRadius: "14px",
                  borderBottomRightRadius: msg.role === "user" ? "4px" : "14px",
                  borderBottomLeftRadius: msg.role === "assistant" ? "4px" : "14px",
                  maxWidth: "85%", 
                  fontSize: "0.85rem", 
                  lineHeight: "1.5"
                }}>
                  {msg.text}
                </div>
              ))
            )}
            {chatLoading && (
              <div style={{ color: "#60a5fa", fontSize: "0.8rem", alignSelf: "flex-start", padding: "8px 0" }}>
                AI жауап жазуда...
              </div>
            )}
            {chatError && (
              <div style={{ color: "#ef4444", fontSize: "0.8rem", alignSelf: "center", textAlign: "center" }}>
                {chatError}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Форма ввода */}
          <form onSubmit={onSubmit} style={{ 
            padding: "12px", 
            borderTop: "1px solid rgba(255,255,255,0.1)", 
            display: "flex", 
            gap: "8px",
            background: "rgba(0,0,0,0.2)"
          }}>
            <input
              type="text" 
              value={chatInput} 
              onChange={e => setChatInput(e.target.value)}
              placeholder="Сұрақ қойыңыз..."
              style={{ 
                flex: 1, 
                background: "rgba(255,255,255,0.05)", 
                border: "1px solid rgba(255,255,255,0.1)", 
                borderRadius: "12px", 
                padding: "10px 14px", 
                color: "#fff", 
                outline: "none", 
                fontSize: "0.9rem" 
              }}
            />
            <button 
              type="submit" 
              disabled={chatLoading || !chatInput.trim()} 
              style={{ 
                background: "#3b82f6", 
                border: "none", 
                borderRadius: "12px", 
                width: "44px", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center", 
                color: "#fff", 
                cursor: "pointer", 
                opacity: (chatLoading || !chatInput.trim()) ? 0.5 : 1,
                transition: "transform 0.2s"
              }}
            >
              ➤
            </button>
          </form>
        </div>
      )}

      {/* Кнопка открытия/закрытия чата */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        style={{
          width: "56px", 
          height: "56px", 
          borderRadius: "50%", 
          background: isOpen ? "#1e293b" : "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)", 
          border: isOpen ? "1px solid rgba(255,255,255,0.1)" : "none",
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center", 
          color: "#fff", 
          fontSize: isOpen ? "1.5rem" : "1.8rem",
          boxShadow: isOpen ? "none" : "0 4px 20px rgba(59,130,246,0.5)", 
          cursor: "pointer", 
          transition: "all 0.3s ease",
          transform: isOpen ? "scale(0.9)" : "scale(1)"
        }}
      >
        {isOpen ? "✕" : "💬"}
      </button>
    </div>
  );
}
