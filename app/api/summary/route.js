import { NextResponse } from 'next/server';
import { supabase } from "../../supabaseClient";

/**
 * AI қорытынды (Gemini 1.5 Flash).
 * Кэш өмірі: 3 сағат. Баға 2%-дан артық немесе Swing Score 5 ұпайдан артық өзгерсе жаңарады.
 */
const SUMMARY_TTL_MS = 3 * 60 * 60 * 1000; 
const PRICE_TOLERANCE = 0.02; 
const SCORE_TOLERANCE = 5; 
const STALE_NOTE = "\n\n(Ескерту: AI жүктемесіне байланысты соңғы сақталған нұсқа көрсетілді.)";

function num(v) {
  const n = typeof v === "number" ? v : parseFloat(v);
  return isFinite(n) ? n : null;
}

function cleanText(v, maxLen) {
  if (typeof v !== "string") return "";
  return v.replace(/[^\p{L}\p{N} .,&'()\/-]/gu, "").trim().slice(0, maxLen);
}

export async function POST(request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY орнатылмаған" }, { status: 200 });
    }

    const body = (await request.json()) || {};
    const symbol = String(body.symbol || "").toUpperCase();
    
    if (!/^[A-Z0-9.\-]{1,12}$/.test(symbol)) {
      return NextResponse.json({ error: "Ticker дұрыс емес" }, { status: 200 });
    }

    const name = cleanText(body.name, 60);
    const price = num(body.currentPrice);
    const changePercent = num(body.changePercent);
    const technicals = body.technicals || {};
    const fundamentals = body.fundamentals || {};
    const swingScore = num(body.swingScore);
    const tradePlan = body.tradePlan || {};
    const signalLabel = cleanText(body.signalLabel, 40);
    
    // Жаңа: Халал статусын алу (Егер фронтендтен келсе)
    const halalStatus = body.halal ? body.halal.label : "Белгісіз"; 

    // ---------- Промптқа арналған деректерді жинау ----------
    const dataText = `Компания: ${name ? name + " (" + symbol + ")" : symbol}
Ағымдағы баға: $${price !== null ? price : "—"}, өзгеріс: ${changePercent !== null ? changePercent : "—"}%
Халал статусы: ${halalStatus}
RSI: ${num(technicals.rsi) ?? "—"}
MACD: ${num(technicals.macd) ?? "—"}
SMA20/50: ${num(technicals.sma20) ?? "—"} / ${num(technicals.sma50) ?? "—"}
P/E: ${num(fundamentals.peRatio) ? num(fundamentals.peRatio).toFixed(2) : "—"}
ROE: ${num(fundamentals.roe) ? num(fundamentals.roe).toFixed(1) + "%" : "—"}
Swing Score: ${swingScore !== null ? swingScore + "/100" : "—"}
Автоматты сигнал: ${signalLabel || "—"}
Сауда жоспары: Entry: $${num(tradePlan.entry) ?? "—"}, Stop Loss: $${num(tradePlan.stopLoss) ?? "—"}, TP1: $${num(tradePlan.takeProfit1) ?? "—"}`;

    const userMessage = `Сен 'TradeIQ' инвестициялық платформасының кәсіби AI-аналитигісің. 
Төмендегі деректер негізінде осы акция бойынша 3-4 сөйлемнен тұратын қысқа, нақты әрі түсінікті ҚАЗАҚ ТІЛІНДЕ қорытынды жаз. 
- Инвестициялық ұсыныс (ал немесе сат) берме, тек деректерді талдап бер. 
- Егер компания Халал болса, оны мұсылман инвесторларға қолайлы деп қысқаша атап өт.
- Соңында жаңа жолдан: "⚠ Бұл ақпараттық сипатта, инвестиция кеңесі емес." деп міндетті түрде жаз.

Деректер:
${dataText}`;

    // ---------- Кэшті оқу (Supabase) ----------
    const cacheKey = "_summary_" + symbol;
    let cached = null;
    try {
      const { data, error } = await supabase
        .from("stock_cache")
        .select("payload, updated_at")
        .eq("symbol", cacheKey)
        .maybeSingle();
      if (!error && data?.payload?.text) {
        cached = data;
      }
    } catch (cacheErr) {
      cached = null;
    }

    const isStillValid = (c) => {
      if (!c) return false;
      const p = c.payload;
      const age = Date.now() - new Date(c.updated_at).getTime();
      if (age >= SUMMARY_TTL_MS) return false;
      if ((p.signalLabel || "") !== signalLabel) return false;
      if (swingScore !== null && typeof p.swingScore === "number" && Math.abs(swingScore - p.swingScore) > SCORE_TOLERANCE) return false;
      if (price !== null && typeof p.price === "number" && p.price > 0 && Math.abs(price - p.price) / p.price > PRICE_TOLERANCE) return false;
      return true;
    };

    const staleResponse = (c) => NextResponse.json({ summary: c.payload.text + STALE_NOTE, source: "stale-cache" });

    if (isStillValid(cached)) {
      return NextResponse.json({ summary: cached.payload.text, source: "cache" });
    }

    // ---------- Gemini-ден жаңа қорытынды сұрау ----------
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    let geminiRes;
    try {
      geminiRes = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: userMessage }] }] })
      });
    } catch (fetchErr) {
      if (cached) return staleResponse(cached);
      return NextResponse.json({ error: "Gemini-ге сұрау жіберу кезінде қате", detail: fetchErr.message }, { status: 200 });
    }

    const rawText = await geminiRes.text();

    if (!geminiRes.ok) {
      const transient = geminiRes.status === 429 || geminiRes.status >= 500;
      if (transient && cached) return staleResponse(cached);
      if (geminiRes.status === 429) {
        return NextResponse.json({ error: "AI лимиті таусылды. Біраздан кейін қайта көріңіз." }, { status: 200 });
      }
      return NextResponse.json({ error: "AI API қатесi", status: geminiRes.status, detail: rawText.slice(0, 500) }, { status: 200 });
    }

    let geminiData;
    try {
      geminiData = JSON.parse(rawText);
    } catch (parseErr) {
      return NextResponse.json({ error: "AI жауабын оқуда қате", detail: rawText.slice(0, 500) }, { status: 200 });
    }

    let summaryText = "";
    const parts = geminiData?.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part?.text) summaryText += part.text;
    }

    if (!summaryText.trim()) {
      return NextResponse.json({ error: "Қорытынды бос келді", detail: rawText.slice(0, 500) }, { status: 200 });
    }

    // ---------- Жаңа қорытындыны Supabase-ке сақтау ----------
    try {
      await supabase.from("stock_cache").upsert(
        {
          symbol: cacheKey,
          payload: { text: summaryText.trim(), signalLabel: signalLabel, swingScore: swingScore, price: price },
          updated_at: new Date().toISOString(),
        },
        { onConflict: "symbol" }
      );
    } catch (saveErr) {
      // Үнсіз қалу
    }

    return NextResponse.json({ summary: summaryText.trim(), source: "gemini" });
  } catch (err) {
    return NextResponse.json({ error: "Жалпы қате", detail: err?.message || String(err) }, { status: 200 });
  }
}
