import { supabase } from "../../supabaseClient";

/**
 * Сектор money flow индикаторы — 10 сектор ETF-нің күндік %
 * өзгерісін салыстырып, қайсысына "ақша құйылып жатқанын" көрсетеді.
 * Тек Finnhub quote қолданылады (жеңіл, Alpha Vantage керек емес).
 *
 * Қаржы секторы (XLF) халал-инвестиция бағытына сай әдейі алынбаған.
 *
 * Кэш: нәтиже Supabase-те (stock_cache кестесі, "_sectors" кілтімен)
 * 15 минут сақталады. Finnhub лимитіне (минутына 60 сұрау) тірелсе —
 * жартылай тізімнің орнына толық ескі нәтиже көрсетіледі.
 */
const SECTORS = [
  { symbol: "XLK", label: "Технология" },
  { symbol: "XLY", label: "Тұтыну (циклді)" },
  { symbol: "XLP", label: "Тұтыну (тұрақты)" },
  { symbol: "XLV", label: "Денсаулық сақтау" },
  { symbol: "XLI", label: "Өнеркәсіп" },
  { symbol: "XLE", label: "Энергетика" },
  { symbol: "XLB", label: "Материалдар" },
  { symbol: "XLU", label: "Коммуналдық қызмет" },
  { symbol: "XLRE", label: "Жылжымайтын мүлік" },
  { symbol: "XLC", label: "Коммуникация" },
];

const CACHE_KEY = "_sectors";
const CACHE_TTL_MS = 15 * 60 * 1000;

export async function GET() {
  const finnhubKey = process.env.FINNHUB_API_KEY;

  if (!finnhubKey) {
    return Response.json({ error: "FINNHUB_API_KEY орнатылмаған" }, { status: 500 });
  }

  // ---------- 1) Кэшті оқимыз ----------
  let cacheRow = null;
  let cacheError = null;
  try {
    const cacheRes = await supabase
      .from("stock_cache")
      .select("payload, updated_at")
      .eq("symbol", CACHE_KEY)
      .maybeSingle();
    if (cacheRes && cacheRes.error) {
      cacheError = cacheRes.error.message;
    } else if (cacheRes && cacheRes.data) {
      cacheRow = cacheRes.data;
    }
  } catch (err) {
    cacheError = err.message;
  }

  const cachedSectors =
    cacheRow && cacheRow.payload && Array.isArray(cacheRow.payload.sectors)
      ? cacheRow.payload.sectors
      : [];

  const cacheFresh =
    cachedSectors.length > 0 &&
    Date.now() - new Date(cacheRow.updated_at).getTime() < CACHE_TTL_MS;

  // source: cache / live / stale-cache / live-partial — браузерде /api/sectors ашып, кэш істеп тұрғанын көруге болады
  function respond(sectors, source) {
    return Response.json(cacheError ? { sectors, source, cacheError } : { sectors, source });
  }

  if (cacheFresh) {
    return respond(cachedSectors, "cache");
  }

  // ---------- 2) Кэш жоқ немесе ескірген — Finnhub-тан жаңасын аламыз ----------
  try {
    const results = await Promise.all(
      SECTORS.map(async (s) => {
        try {
          const url = "https://finnhub.io/api/v1/quote?symbol=" + s.symbol + "&token=" + finnhubKey;
          const res = await fetch(url, { cache: "no-store" });
          if (!res.ok) return { ...s, error: true };
          const quote = await res.json();
          if (!quote || typeof quote.c !== "number" || quote.c === 0) {
            return { ...s, error: true };
          }
          return {
            symbol: s.symbol,
            label: s.label,
            price: quote.c,
            changePercent: quote.dp,
          };
        } catch (err) {
          return { ...s, error: true };
        }
      })
    );

    const valid = results.filter((r) => !r.error);
    valid.sort((a, b) => (b.changePercent || 0) - (a.changePercent || 0));

    // Бәрі сәтті келсе ғана кэшті жаңартамыз (жартылай нәтиже кэшке түспейді)
    if (valid.length === SECTORS.length) {
      try {
        const writeRes = await supabase.from("stock_cache").upsert(
          {
            symbol: CACHE_KEY,
            payload: { sectors: valid },
            updated_at: new Date().toISOString(),
          },
          { onConflict: "symbol" }
        );
        if (writeRes && writeRes.error) cacheError = writeRes.error.message;
      } catch (err) {
        cacheError = err.message;
      }
      return respond(valid, "live");
    }

    // Кейбір секторлар келмеді (лимит) — толығырақ ескі кэш болса, соны береміз
    if (cachedSectors.length > valid.length) {
      return respond(cachedSectors, "stale-cache");
    }

    return respond(valid, "live-partial");
  } catch (err) {
    if (cachedSectors.length > 0) {
      return respond(cachedSectors, "stale-cache");
    }
    return Response.json(
      { error: "Сектор деректерін алу кезінде қате", detail: err.message },
      { status: 500 }
    );
  }
}
