import { supabase } from "../../supabaseClient";

/**
 * AI қорытынды (Gemini).
 *
 * Gemini тегін жоспары күніне аз ғана сұрауға рұқсат береді (chat, жаңалық аудармасы
 * және осы қорытынды — бәріне ортақ). Сондықтан әр басқанда қайта сұрамай, дайын
 * қорытындыны Supabase-те (stock_cache кестесі, "_summary_TICKER" кілтімен) сақтаймыз:
 *  - 3 сағат бойы кэштен беріледі, бірақ сигнал / Swing Score / баға айтарлықтай
 *    өзгерсе — жаңа қорытынды жасалады;
 *  - Gemini лимитке тірелсе (429) немесе қызмет істемесе (5xx) — ең соңғы
 *    сақталған қорытынды көрсетіледі.
 */
var SUMMARY_TTL_MS = 3 * 60 * 60 * 1000; // кэш өмірі: 3 сағат
var PRICE_TOLERANCE = 0.02; // баға 2%-дан артық қозғалса — қорытынды жаңарады
var SCORE_TOLERANCE = 5; // Swing Score 5 ұпайдан артық өзгерсе — жаңарады
var STALE_NOTE = " (Ескерту: жаңа қорытынды алу мүмкін болмады — соңғы сақталған нұсқа көрсетілді.)";

function num(v) {
  var n = typeof v === "number" ? v : parseFloat(v);
  return isFinite(n) ? n : null;
}

// Кэш ортақ болғандықтан, клиенттен келген мәтінді тазалаймыз:
// басқа пайдаланушыға жалған мәтін немесе нұсқаулық енгізіліп кетпесін.
function cleanText(v, maxLen) {
  if (typeof v !== "string") return "";
  return v.replace(/[^\p{L}\p{N} .,&'()\/-]/gu, "").trim().slice(0, maxLen);
}

export async function POST(request) {
  try {
    var apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return Response.json(
        { error: "GEMINI_API_KEY орнатылмаган", detail: "env var жок" },
        { status: 200 }
      );
    }

    var body = (await request.json()) || {};

    var symbol = String(body.symbol || "").toUpperCase();
    if (!/^[A-Z0-9.\-]{1,12}$/.test(symbol)) {
      return Response.json({ error: "Ticker дұрыс емес" }, { status: 200 });
    }

    var name = cleanText(body.name, 60);
    var price = num(body.currentPrice);
    var changePercent = num(body.changePercent);
    var technicals = body.technicals || {};
    var fundamentals = body.fundamentals || {};
    var swingScore = num(body.swingScore);
    var tradePlan = body.tradePlan || {};
    var signalLabel = cleanText(body.signalLabel, 40);

    var rsi = num(technicals.rsi);
    var macd = num(technicals.macd);
    var sma20 = num(technicals.sma20);
    var sma50 = num(technicals.sma50);
    var pe = num(fundamentals.pe);
    var roe = num(fundamentals.roe);
    var entry = num(tradePlan.entry);
    var stopLoss = num(tradePlan.stopLoss);
    var takeProfit1 = num(tradePlan.takeProfit1);

    var promptParts = [];
    promptParts.push("Компания: " + (name ? name + " (" + symbol + ")" : symbol));
    promptParts.push(
      "Ағымдағы баға: $" + (price !== null ? price : "—") +
      ", өзгеріс: " + (changePercent !== null ? changePercent : "—") + "%"
    );
    if (rsi !== null) promptParts.push("RSI: " + rsi);
    if (macd !== null) promptParts.push("MACD: " + macd);
    if (sma20 !== null) promptParts.push("SMA20: " + sma20);
    if (sma50 !== null) promptParts.push("SMA50: " + sma50);
    if (pe !== null) promptParts.push("P/E: " + pe.toFixed(2));
    if (roe !== null) promptParts.push("ROE: " + roe.toFixed(1) + "%");
    if (swingScore !== null) promptParts.push("Swing Score: " + swingScore + "/100");
    if (signalLabel) promptParts.push("Автоматты сигнал: " + signalLabel);
    if (entry !== null) {
      promptParts.push(
        "Сауда жоспары — Entry: $" + entry +
        ", Stop Loss: $" + (stopLoss !== null ? stopLoss : "—") +
        ", TP1: $" + (takeProfit1 !== null ? takeProfit1 : "—")
      );
    }

    var dataText = promptParts.join("\n");

    var userMessage =
      "Сен қаржы деректерін талдайтын көмекшісің. Төмендегі деректер негізінде осы акция бойынша " +
      "3-4 сөйлемдік қысқа, түсінікті ҚАЗАҚ ТІЛІНДЕ қорытынды жаз. Инвестиция кеңесі бермей, тек " +
      "деректерді қалай түсінуге болатынын түсіндір. Соңында 'Бұл ақпараттық сипатта, инвестиция " +
      "кеңесі емес' деп қос.\n\nДеректер:\n" + dataText;

    // ---------- Кэшті оқимыз ----------
    var cacheKey = "_summary_" + symbol;
    var cached = null;
    try {
      var cacheRes = await supabase
        .from("stock_cache")
        .select("payload, updated_at")
        .eq("symbol", cacheKey)
        .maybeSingle();
      if (
        cacheRes && !cacheRes.error && cacheRes.data &&
        cacheRes.data.payload && typeof cacheRes.data.payload.text === "string"
      ) {
        cached = cacheRes.data;
      }
    } catch (cacheErr) {
      cached = null;
    }

    function isStillValid(c) {
      if (!c) return false;
      var p = c.payload;
      var age = Date.now() - new Date(c.updated_at).getTime();
      if (!(age < SUMMARY_TTL_MS)) return false;
      if ((p.signalLabel || "") !== signalLabel) return false;
      if (swingScore !== null && typeof p.swingScore === "number" && Math.abs(swingScore - p.swingScore) > SCORE_TOLERANCE) return false;
      if (price !== null && typeof p.price === "number" && p.price > 0 && Math.abs(price - p.price) / p.price > PRICE_TOLERANCE) return false;
      return true;
    }

    function staleResponse(c) {
      return Response.json({ summary: c.payload.text + STALE_NOTE, source: "stale-cache" });
    }

    if (isStillValid(cached)) {
      return Response.json({ summary: cached.payload.text, source: "cache" });
    }

    // ---------- Gemini-ден жаңасын сұраймыз ----------
    var geminiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=" + apiKey;

    var geminiRes;
    try {
      geminiRes = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: userMessage }] }]
        })
      });
    } catch (fetchErr) {
      if (cached) return staleResponse(cached);
      return Response.json(
        { error: "Gemini-ге сұрау жіберу кезінде кате", detail: fetchErr.message },
        { status: 200 }
      );
    }

    var rawText = await geminiRes.text();

    if (!geminiRes.ok) {
      var transient = geminiRes.status === 429 || geminiRes.status >= 500;
      if (transient && cached) return staleResponse(cached);
      if (geminiRes.status === 429) {
        return Response.json(
          { error: "AI лимиті таусылды (тегін жоспар). Біраздан кейін қайта көріңіз." },
          { status: 200 }
        );
      }
      return Response.json(
        { error: "AI API катесi", status: geminiRes.status, detail: rawText.slice(0, 500) },
        { status: 200 }
      );
    }

    var geminiData;
    try {
      geminiData = JSON.parse(rawText);
    } catch (parseErr) {
      return Response.json(
        { error: "AI жауабын окуда кате", detail: rawText.slice(0, 500) },
        { status: 200 }
      );
    }

    var summaryText = "";

    if (
      geminiData &&
      Array.isArray(geminiData.candidates) &&
      geminiData.candidates[0] &&
      geminiData.candidates[0].content &&
      Array.isArray(geminiData.candidates[0].content.parts)
    ) {
      for (var i = 0; i < geminiData.candidates[0].content.parts.length; i++) {
        var part = geminiData.candidates[0].content.parts[i];
        if (part && typeof part.text === "string") {
          summaryText += part.text;
        }
      }
    }

    if (!summaryText) {
      return Response.json(
        { error: "Қорытынды бос келді", detail: rawText.slice(0, 500) },
        { status: 200 }
      );
    }

    // ---------- Жаңа қорытындыны сақтаймыз ----------
    try {
      await supabase.from("stock_cache").upsert(
        {
          symbol: cacheKey,
          payload: { text: summaryText, signalLabel: signalLabel, swingScore: swingScore, price: price },
          updated_at: new Date().toISOString(),
        },
        { onConflict: "symbol" }
      );
    } catch (saveErr) {
      // үнсіз — сақталмаса да, пайдаланушыға қорытындыны береміз
    }

    return Response.json({ summary: summaryText, source: "gemini" });
  } catch (err) {
    return Response.json(
      { error: "Жалпы кате", detail: (err && err.message) ? err.message : String(err) },
      { status: 200 }
    );
  }
}
