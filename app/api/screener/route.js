import { supabase } from "../../supabaseClient";
import { computeHalalStatus } from "../../../lib/halal";

/**
 * Скринер.
 *
 * Бұрын әр сүзгі басқанда 8 акция × 2 сұрау = 16 Finnhub сұрауы кететін (лимит — минутына 60).
 * Енді бүкіл тізім Supabase-те (stock_cache кестесі, "_screener" кілтімен) 15 минут сақталады,
 * ал сүзгілер (P/E, ROE, халал) кэштен жадта қолданылады — Finnhub-қа қайта соқпайды.
 *
 * Finnhub лимитке тірелсе — сәтсіз акцияның ескі қатары көрсетіледі (жаңа деректер
 * 2 минуттан кейін қайта сұралады).
 *
 * ROE: Finnhub roeTTM — пайыз (62.4 = 62.4%). Бұрын ×100 қате жасалатын, енді жасалмайды.
 */
const SCREENER_SYMBOLS = ["AMD", "INTC", "CRM", "QCOM", "ADBE", "NVDA", "MSFT", "AAPL"];

const CACHE_KEY = "_screener";
const TTL_COMPLETE_MS = 15 * 60 * 1000; // бәрі сәтті келсе — 15 минут
const TTL_PARTIAL_MS = 2 * 60 * 1000; // кейбірі келмесе — 2 минуттан кейін қайта көреміз
const PARTIAL_WARNING = "Кейбір акциялардың деректері жаңартылмады (API лимиті). Біраздан кейін қайта көріңіз.";
// Тізімді өзгертсең (тикер қоссаң/алсаң), ескі кэш бірден қолданылмай, жаңа тізім жүктеледі
const SYMBOLS_SIGNATURE = SCREENER_SYMBOLS.join(",");

// Сәтсіз болса null қайтарады. degraded = қосымша деректер (metric/profile) келмеді,
// сондықтан P/E, ROE немесе халал нәтижесі толық емес.
async function fetchOne(symbol, apiKey) {
  try {
    const base = "https://finnhub.io/api/v1/";
    // metric мен profile URL-дері /api/stock-тағымен бірдей — Next кэшін бірге пайдаланады
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

    const pe =
      typeof metric.peTTM === "number"
        ? metric.peTTM
        : typeof metric.peNormalizedAnnual === "number"
        ? metric.peNormalizedAnnual
        : null;

    const roe =
      typeof metric.roeTTM === "number"
        ? metric.roeTTM
        : typeof metric.roeRfy === "number"
        ? metric.roeRfy
        : null;

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

    return {
      row: {
        symbol: symbol,
        price: quote.c,
        changePercent: typeof quote.dp === "number" ? quote.dp : null,
        pe: pe,
        roe: roe,
        halal: halal,
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
  // ---------- 1) Кэшті оқимыз ----------
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
    return {
      rows: cachedRows,
      source: "cache",
      warning: cacheRow.payload.complete ? null : PARTIAL_WARNING,
      cacheError: null,
    };
  }

  // ---------- 2) Кэш жоқ немесе ескірген — Finnhub-тан жаңасын аламыз ----------
  const live = await Promise.all(SCREENER_SYMBOLS.map((s) => fetchOne(s, apiKey)));

  const rows = [];
  let complete = true;
  for (let i = 0; i < SCREENER_SYMBOLS.length; i++) {
    const sym = SCREENER_SYMBOLS[i];
    const fresh = live[i];
    const stale = cachedRows.find((r) => r.symbol === sym) || null;

    if (fresh && !fresh.degraded) {
      rows.push(fresh.row); // толық жаңа дерек
      continue;
    }
    complete = false;
    if (stale) rows.push(stale); // жақсы ескі қатар толық емес жаңасынан артық
    else if (fresh) rows.push(fresh.row); // ескісі жоқ — толық емесін көрсетеміз
  }

  if (rows.length > 0) {
    try {
      const w = await supabase.from("stock_cache").upsert(
        {
          symbol: CACHE_KEY,
          payload: { results: rows, complete: complete, symbols: SYMBOLS_SIGNATURE },
          updated_at: new Date().toISOString(),
        },
        { onConflict: "symbol" }
      );
      if (w && w.error) cacheError = w.error.message;
    } catch (err) {
      cacheError = err.message;
    }
  }

  return {
    rows: rows,
    source: complete ? "live" : "partial",
    warning: complete ? null : PARTIAL_WARNING,
    cacheError: cacheError,
  };
}

export async function GET(request) {
  const apiKey = process.env.FINNHUB_API_KEY;

  if (!apiKey) {
    return Response.json(
      { error: "FINNHUB_API_KEY орнатылмаған" },
      { status: 500 }
    );
  }

  const searchParams = new URL(request.url).searchParams;
  const maxPE = parseFloat(searchParams.get("maxPE"));
  const minROE = parseFloat(searchParams.get("minROE"));
  const halalParam = searchParams.get("halal"); // pass | pass,doubtful | 1 (= pass)

  try {
    const universe = await loadUniverse(apiKey);
    let filtered = universe.rows;

    if (isFinite(maxPE)) {
      filtered = filtered.filter((r) => typeof r.pe === "number" && r.pe <= maxPE);
    }

    if (isFinite(minROE)) {
      // roe — пайыз (62.4 = 62.4%), сондықтан тікелей салыстырамыз
      filtered = filtered.filter((r) => typeof r.roe === "number" && r.roe >= minROE);
    }

    if (halalParam) {
      const wanted = halalParam === "1" ? ["pass"] : halalParam.split(",");
      filtered = filtered.filter((r) => r.halal && wanted.indexOf(r.halal.status) !== -1);
    }

    const body = { results: filtered, source: universe.source };
    if (universe.warning) body.warning = universe.warning;
    if (universe.cacheError) body.cacheError = universe.cacheError;
    return Response.json(body);
  } catch (err) {
    return Response.json(
      { error: "Скринер деректерін алу кезінде қате", detail: err.message },
      { status: 500 }
    );
  }
}
