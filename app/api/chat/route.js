import { NextResponse } from "next/server";
import { askGemini } from "../../../lib/gemini";

export async function POST(request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "GEMINI_API_KEY орнатылмаған (Vercel-ді тексеріңіз)" }, { status: 500 });
    }

    const body = await request.json();
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const stockContext = body.stockContext || null;

    if (messages.length === 0) {
      return NextResponse.json({ error: "Хабарлама жоқ" }, { status: 400 });
    }

    // 1. Жүйелік нұсқау
    let systemNote = `Сен 'TradeIQ' атты қазақ тіліндегі элиталық AI-powered инвестициялық платформасының жасанды интеллект көмекшісісің.
Сенің басты мақсатың - трейдерлерге техникалық/фундаменталды талдау жасауға көмектесу ЖӘНЕ олардың эмоцияларын (ФОМО, дүрбелең) басқаруға психологиялық қолдау көрсету.
- Пайдаланушымен әрқашан ҚАЗАҚ ТІЛІНДЕ сөйлес.
- Жауаптарың қысқа, кәсіби, нақты және түсінікті болсын (артық суреттемесіз).
- Акцияның құлағанын көрсең, сабырға шақыр. Күрт өссе, ашкөздіктен (FOMO) сақтандыр.
- Нақты 'мына акцияны сатып ал' немесе 'сат' деген қаржылық кеңес берме, тек талдау нәтижесін ұсын.`;

    // 2. Ағымдағы акция контексті (бет ашық тұрса)
    if (stockContext && stockContext.symbol) {
      systemNote += `\n\nПАЙДАЛАНУШЫ ҚАРАП ОТЫРҒАН АКЦИЯ: ${stockContext.symbol} (${stockContext.name || ""})
- Қазіргі бағасы: $${stockContext.currentPrice ?? "белгісіз"}`;

      if (stockContext.halal) {
        systemNote += `\n- Халал статусы: ${stockContext.halal.label} (Статус: ${stockContext.halal.status}). Егер қолданушы халал ма деп сұраса, осыған сүйен.`;
      }
      if (stockContext.technicals) {
        const t = stockContext.technicals;
        systemNote += `\n- Техникалық көрсеткіштер: RSI=${t.rsi ?? "-"}, MACD=${t.macd ?? "-"}, SMA20=${t.sma20 ?? "-"}, SMA50=${t.sma50 ?? "-"}`;
      }
      if (stockContext.tradePlan) {
        const p = stockContext.tradePlan;
        systemNote += `\n- Сауда жоспары: Entry=$${p.entry ?? "-"}, Stop Loss=$${p.stopLoss ?? "-"}, TP1=$${p.takeProfit1 ?? "-"}`;
      }
    }

    // 3. Хабарламаларды дайындау (бос мәтіндерді алып тастаймыз)
    const contents = [];
    for (const m of messages) {
      const text = String(m.text || "").trim();
      if (!text) continue;
      contents.push({ role: m.role === "assistant" ? "assistant" : "user", text });
    }

    if (contents.length === 0) {
      return NextResponse.json({ error: "Жіберілетін хабарлама жоқ" }, { status: 400 });
    }

    // 4. Gemini (модель lib/gemini.js ішінде автоматты табылады)
    let reply;
    try {
      reply = await askGemini({ system: systemNote, contents, maxTokens: 1024 });
    } catch (aiErr) {
      console.error("Gemini chat error:", aiErr);
      return NextResponse.json({ error: "Gemini API қатесі", detail: String(aiErr.message || aiErr).slice(0, 300) }, { status: 502 });
    }

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("Chat API General Error:", err);
    return NextResponse.json({ error: "Жалпы сервер қатесі", detail: err?.message || String(err) }, { status: 500 });
  }
}
