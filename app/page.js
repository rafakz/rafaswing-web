'use client';
import { useState } from 'react';

export default function Home() {
  const [symbol, setSymbol] = useState('AAPL');
  const [data, setData] = useState(null);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!symbol) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Акция мәліметтерін алу
      const stockRes = await fetch(`/api/stock?symbol=${symbol.toUpperCase()}`);
      const stockData = await stockRes.json();

      if (!stockRes.ok) {
        throw new Error(stockData.error || 'Деректерді жүктеу мүмкін болмады');
      }

      setData(stockData);

      // 2. Жаңалықтарды алу
      const newsRes = await fetch(`/api/news?symbol=${symbol.toUpperCase()}`);
      const newsData = await newsRes.json();
      if (newsData.news) setNews(newsData.news);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0b0f19] text-white p-6 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Бас тақырып */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-yellow-500">Ноғай</h1>
          <p className="text-gray-400 text-sm">Свинг-трейдинг және инвестиция платформасы</p>
        </div>

        {/* Іздеу өрісі */}
        <form onSubmit={handleSearch} className="flex gap-3 max-w-md mx-auto">
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            placeholder="Тикер енгізіңіз (Мысалы: AAPL, AMD)"
            className="flex-1 bg-[#161c2e] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-6 py-2 rounded-lg transition"
          >
            {loading ? 'Жүктелуде...' : 'Іздеу'}
          </button>
        </form>

        {/* Қателік шықса */}
        {error && (
          <div className="text-red-400 text-center text-sm p-3 bg-red-950/30 rounded-lg border border-red-800">
            {error}
          </div>
        )}

        {/* Нәтижелер баннері */}
        {data && (
          <div className="space-y-6">
            
            {/* Негізгі көрсеткіштер */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#161c2e] p-4 rounded-xl border border-gray-800">
                <span className="text-gray-400 text-xs">Бағасы</span>
                <p className="text-2xl font-bold text-yellow-400">${data.currentPrice}</p>
              </div>

              <div className="bg-[#161c2e] p-4 rounded-xl border border-gray-800">
                <span className="text-gray-400 text-xs">RSI (14)</span>
                <p className="text-2xl font-bold">{data.rsi}</p>
              </div>

              <div className="bg-[#161c2e] p-4 rounded-xl border border-gray-800">
                <span className="text-gray-400 text-xs">Swing Score</span>
                <p className="text-2xl font-bold text-green-400">{data.swingScore} / 100</p>
              </div>

              <div className="bg-[#161c2e] p-4 rounded-xl border border-gray-800">
                <span className="text-gray-400 text-xs">Support / Resistance</span>
                <p className="text-sm font-semibold text-gray-300 mt-1">
                  S: ${data.levels?.support} | R: ${data.levels?.resistance}
                </p>
              </div>
            </div>

            {/* Торговый план (Entry, SL, TP) */}
            {data.tradePlan && (
              <div className="bg-[#161c2e] p-5 rounded-xl border border-gray-800 space-y-3">
                <h3 className="text-lg font-bold text-yellow-500">Сауда жоспары (Trade Plan)</h3>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-[#0b0f19] p-3 rounded-lg border border-gray-800">
                    <p className="text-xs text-gray-400">Entry (Кіру)</p>
                    <p className="text-lg font-bold text-blue-400">${data.tradePlan.entry}</p>
                  </div>
                  <div className="bg-[#0b0f19] p-3 rounded-lg border border-gray-800">
                    <p className="text-xs text-gray-400">Stop Loss</p>
                    <p className="text-lg font-bold text-red-400">${data.tradePlan.stopLoss}</p>
                  </div>
                  <div className="bg-[#0b0f19] p-3 rounded-lg border border-gray-800">
                    <p className="text-xs text-gray-400">Take Profit</p>
                    <p className="text-lg font-bold text-green-400">${data.tradePlan.takeProfit}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Жаңалықтар блогы */}
            {news.length > 0 && (
              <div className="bg-[#161c2e] p-5 rounded-xl border border-gray-800 space-y-3">
                <h3 className="text-lg font-bold text-yellow-500">Соңғы жаңалықтар</h3>
                <div className="space-y-3">
                  {news.map((item) => (
                    <a
                      key={item.id}
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block p-3 bg-[#0b0f19] rounded-lg hover:border-yellow-500 border border-transparent transition"
                    >
                      <h4 className="font-semibold text-sm text-gray-200">{item.headline}</h4>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">{item.summary}</p>
                      <span className="text-[10px] text-gray-500 mt-2 block">{item.source} • {item.datetime}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </main>
  );
}
