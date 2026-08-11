export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");

  if (!symbol) {
    return Response.json({ error: "Ticker керек" }, { status: 400 });
  }

  const apiKey = process.env.FINNHUB_API_KEY;

  if (!apiKey) {
    return Response.json({ error: "API key орнатылмаған" }, { status: 500 });
  }

  try {
    const [quoteRes, profileRes] = await Promise.all([
      fetch(
        `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`
      ),
      fetch(
        `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${apiKey}`
      ),
    ]);

    const quote = await quoteRes.json();
    const profile = await profileRes.json();

    if (!quote || quote.c === 0) {
      return Response.json(
        { error: "Ticker табылмады немесе деректер жоқ" },
        { status: 404 }
      );
    }

    return Response.json({
      symbol,
      name: profile.name || symbol,
      logo: profile.logo || null,
      currentPrice: quote.c,
      change: quote.d,
      changePercent: quote.dp,
      high: quote.h,
      low: quote.l,
      open: quote.o,
      previousClose: quote.pc,
      marketCap: profile.marketCapitalization || null,
      industry: profile.finnhubIndustry || null,
    });
  } catch (err) {
    return Response.json(
      { error: "Деректерді алу кезінде қате шықты" },
      { status: 500 }
    );
  }
}
