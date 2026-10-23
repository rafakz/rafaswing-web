import { NextResponse } from 'next/server';
import { supabase } from "../../supabaseClient";
import { computeHalalStatus } from "../../../lib/halal";

// Нарықтық скринер үшін танымал акциялар тізімі кеңейтілді
const SCREENER_SYMBOLS = ["AAPL", "MSFT", "NVDA", "TSLA", "AMD", "INTC", "GOOGL", "AMZN", "META", "CRM"];

const CACHE_KEY = "_screener_v2";
const TTL_COMPLETE_MS = 15 * 60 * 1000; // бәрі сәтті келсе — 15 минут
const TTL_PARTIAL_MS = 2 * 60 * 1000; // кейбірі келмесе — 2 минуттан кейін қайта көреміз
const PARTIAL_WARNING = "Кейбір акциялардың деректері жаңартылмады (API лимиті). Біраздан кейін қайта көріңіз.";
const SYMBOLS_SIGNATURE = SCREENER_SYMBOLS.join(",");

async function fetchOne(symbol, apiKey) {
  try {
    const base = "https://finnhub.io/api/v1/";
    const [quoteRes, metricRes, profileRes] = await Promise.all([
      fetch(base + "quote?symbol=" + symbol + "&token=" + apiKey, { cache: "no-store" }),
      fetch(base + "stock/metric?symbol=" + symbol + "&metric=all&token=" + apiKey, { next: { revalidate: 86400 } }),
      fetch(base + "stock/profile2?symbol=" + symbol + "&token=" + apiKey, { next: { revalidate: 86400 } }),
    ]);

    if (!quoteRes.ok) return null;

    const quote = await quoteRes.json();
    if (!quote || typeof quote.c !== "number" || quote.c === 0) return null;

    const metricData = metricRes.ok ? await metricRes.json() : null;
    const profile = profileRes.ok ? await profileRes.json() : null;
    const metric = metricData && metricData.metric ? metricData.metric : {};

    const pe = typeof metric.peTTM === "number" ? metric.peTTM : typeof metric.peNormalizedAnnual === "number" ? metric.peNormalizedAnnual : null;
    const roe = typeof metric.roeTTM === "number" ? metric.roeTTM : typeof metric.roeRfy === "number" ? metric.roeRfy : null;

    let halal = null;
    try {
      const h = computeHalalStatus({
        symbol: symbol,
        name: profile ? profile.name : "",
        industry: profile ? profile.finnhubIndustry : "",
        price: quote.c,
        metricData: metricData || {},
      });
      halal = { status: h.status, label: h.label };
    } catch (halalErr) {
      halal = null;
    }

    // ---------- ЖЕҢІЛДЕТІЛГЕН AI SCORE (API лимитін бұзбау үшін) ----------
    let swingScore = 50;
    let signal = "Neutral";
    let rsiEstimate = 50;

    if (quote.dp !== undefined) {
      const changeBoost = quote.dp * 5; 
      const high52 = metric['52WeekHigh'];
      const distFromHigh = high52 ? (quote.c / high52) * 100 : 80;
      
      swingScore = Math.min(100, Math.max(0, Math.round(distFromHigh * 0.4 + changeBoost + 20)));
      
      if (swingScore >= 75) signal = "Strong Bull";
      else if (swingScore >= 60) signal = "Bullish";
      else if (swingScore <= 40) signal = "Bearish";

      rsiEstimate = Math.min(100, Math.max(0, Math.round(50 + (quote.dp * 7))));
    }

    return {
      row: {
        symbol: symbol,
        name: profile ? profile.name : symbol,
        currentPrice: quote.c,
        changePercent: typeof quote.dp === "number" ? quote.dp : null,
        pe: pe,
        roe: roe,
        halal: halal,
        technicals: { rsi: rsiEstimate },
        swingScore: swingScore,
        signal: signal
      },
      degraded: !metricData || !profile,
    };
  } catch (err) {
    return null;
  }
}

function cacheIsFresh(row) {
  if (row.payload.symbols !== SYMBOLS_SIGNATURE) return false;
  const age = Date.now() - new Date(row.updated_at).getTime();
  const ttl = row.payload.complete ? TTL_COMPLETE_MS : TTL_PARTIAL_MS;
  return age < ttl;
}

async function loadUniverse(apiKey) {
  let cacheRow = null;
  let cacheError = null;
  try {
    const res = await supabase
      .from("stock_cache")
      .select("payload, updated_at")
      .eq("symbol", CACHE_KEY)
      .maybeSingle();
    if (res && res.error) {
      cacheError = res.error.message;
    } else if (res && res.data && res.data.payload && Array.isArray(res.data.payload.results)) {
      cacheRow = res.data;
    }
  } catch (err) {
    cacheError = err.message;
  }

  const cachedRows = cacheRow ? cacheRow.payload.results : [];

  if (cacheRow && cacheIsFresh(cacheRow)) {
    return { rows: cachedRows, source: "cache", warning: cacheRow.payload.complete ? null : PARTIAL_WARNING, cacheError: null };
  }

  const live = await Promise.all(SCREENER_SYMBOLS.map((s) => fetchOne(s, apiKey)));
  const rows = [];
  let complete = true;
  
  for (let i = 0; i < SCREENER_SYMBOLS.length; i++) {
    const sym = SCREENER_SYMBOLS[i];
    const fresh = live[i];
    const stale = cachedRows.find((r) => r.symbol === sym) || null;

    if (fresh && !fresh.degraded) {
      rows.push(fresh.row);
      continue;
    }
    complete = false;
    if (stale) rows.push(stale);
    else if (fresh) rows.push(fresh.row);
  }

  if (rows.length > 0) {
    try {
      const w = await supabase.from("stock_cache").upsert(
        { symbol: CACHE_KEY, payload: { results: rows, complete: complete, symbols: SYMBOLS_SIGNATURE }, updated_at: new Date().toISOString() },
        { onConflict: "symbol" }
      );
      if (w && w.error) cacheError = w.error.message;
    } catch (err) {
      cacheError = err.message;
    }
  }

  return { rows: rows, source: complete ? "live" : "partial", warning: complete ? null : PARTIAL_WARNING, cacheError: cacheError };
}

export async function GET(request) {
  const apiKey = process.env.FINNHUB_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "FINNHUB_API_KEY орнатылмаған" }, { status: 500 });
  }

  try {
    const universe = await loadUniverse(apiKey);
    
    // Фронтендтің жаңа форматына сай `data` кілтімен қайтарамыз
    const body = { data: universe.rows, source: universe.source };
    if (universe.warning) body.warning = universe.warning;
    if (universe.cacheError) body.cacheError = universe.cacheError;
    
    return NextResponse.json(body);
  } catch (err) {
    return NextResponse.json({ error: "Скринер деректерін алу кезінде қате", detail: err.message }, { status: 500 });
  }
}
