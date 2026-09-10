/**
 * Сектор money flow индикаторы — 10 сектор ETF-нің күндік %
 * өзгерісін салыстырып, қайсысына "ақша құйылып жатқанын" көрсетеді.
 * Тек Finnhub quote қолданылады (жеңіл, Alpha Vantage керек емес).
 *
 * Қаржы секторы (XLF) халал-инвестиция бағытына сай әдейі алынбаған.
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

export async function GET() {
  const finnhubKey = process.env.FINNHUB_API_KEY;

  if (!finnhubKey) {
    return Response.json({ error: "FINNHUB_API_KEY орнатылмаған" }, { status: 500 });
  }

  try {
    const results = await Promise.all(
      SECTORS.map(async (s) => {
        try {
          const url = "https://finnhub.io/api/v1/quote?symbol=" + s.symbol + "&token=" + finnhubKey;
          const res = await fetch(url, { next: { revalidate: 900 } });
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
    valid.sort((a, b) => b.changePercent - a.changePercent);

    return Response.json({ sectors: valid });
  } catch (err) {
    return Response.json(
      { error: "Сектор деректерін алу кезінде қате", detail: err.message },
      { status: 500 }
    );
  }
}
