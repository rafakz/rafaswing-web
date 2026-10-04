/**
 * Халал скрин (бастапқы, автоматты) — AAOIFI Shariah Standard No. 21 үлгісі, нарық құны бойынша:
 *  1) Қызмет түрі: банк/сақтандыру, темекі, алкоголь, құмар ойын, доңыз еті — сәйкес емес
 *  2) Пайыздық борыш ≤ 30% (нарықтық капитализациядан)
 *  3) Ақша мен пайыздық активтер ≤ 30% (нарықтық капитализациядан)
 *
 * Харам табыс үлесі (≤ 5%) және тазарту (purification) мұнда ТЕКСЕРІЛМЕЙДІ:
 * Finnhub тегін жоспарында табыс құрылымы жоқ. Сондықтан нәтиже ешқашан "халал" деп
 * бекітпейді, ең жақсы жағдайда "сәйкес болуы мүмкін" дейді.
 *
 * Қосымша API сұрау жоқ: /api/stock-та бар profile + metric деректерінен есептеледі.
 */

const DEBT_LIMIT = 30; // %
const CASH_LIMIT = 30; // %
const BAND = 0.1; // шектің ±10%-ы — "күмәнді" аймақ (деректер шамамен болғандықтан)
const MAX_SANE_RATIO = 3; // 300%-дан асса — дерек сенімсіз (валюта/өлшем қатесі болуы мүмкін)

// Негізгі қызметі айқын тыйым салынған компаниялар (алкоголь, темекі, құмар ойын, доңыз еті)
const HARAM_TICKERS = {
  BUD: "алкоголь", STZ: "алкоголь", TAP: "алкоголь", DEO: "алкоголь", SAM: "алкоголь", MGPI: "алкоголь",
  "BF.A": "алкоголь", "BF.B": "алкоголь", "BF-A": "алкоголь", "BF-B": "алкоголь",
  PM: "темекі", MO: "темекі", BTI: "темекі",
  LVS: "құмар ойын", WYNN: "құмар ойын", MGM: "құмар ойын", CZR: "құмар ойын", PENN: "құмар ойын", DKNG: "құмар ойын",
  HRL: "доңыз еті", SFD: "доңыз еті",
};

// Finnhub "finnhubIndustry" және компания атауы бойынша
const FAIL_INDUSTRY = /\b(banking|bank|insurance|tobacco|casinos?|gambling)\b/i;
const FAIL_NAME = /\b(bank|bancorp|bancshares|insurance|assurance|casinos?|brewing|brewery|distill\w*|tobacco)\b/i;

// Сала өзі тыйым салынбаған, бірақ ішінде харам бөлігі болуы мүмкін — қолмен тексеру керек
const DOUBT_INDUSTRY = [
  [/financial|capital markets|asset management|brokerage|mortgage|credit/i, "Қаржы қызметі — пайыздық табыстың үлесін тексер"],
  [/beverages/i, "Сусын: алкоголь бар-жоғын тексер"],
  [/hotels|restaurants|leisure/i, "Қонақүй/мейрамхана/ойын-сауық: алкоголь немесе казино бар-жоғын тексер"],
  [/media|entertainment/i, "Медиа: тыйым салынған контент бар-жоғын тексер"],
  [/aerospace|defense/i, "Қорғаныс: қару өндірісінің үлесін тексер"],
];

const STATUS_LABEL = {
  pass: "Сәйкес болуы мүмкін",
  doubtful: "Күмәнді — тексеру керек",
  fail: "Сәйкес емес",
  unknown: "Деректер жеткіліксіз",
};

const DISCLAIMER =
  "Бұл автоматты бастапқы скрин (AAOIFI үлгісі, нарық құны бойынша). Харам табыс үлесі (≤ 5%) мен тазарту " +
  "тексерілмейді, деректер шамамен. Шешім алдында сенімді шариғат көзімен немесе ғалыммен тексер. " +
  "Инвестиция кеңесі емес.";

function num(v) {
  return typeof v === "number" && isFinite(v) ? v : null;
}

// [{key, value}, ...] ішінен бірінші жарамды санды алады
function firstNum(list) {
  for (let i = 0; i < list.length; i++) {
    const n = num(list[i].value);
    if (n !== null) return { value: n, key: list[i].key };
  }
  return null;
}

// Finnhub series: [{period: "2025-09-30", v: 1.2}, ...] — ең соңғы кезеңнің мәні
function latestSeriesValue(arr) {
  if (!Array.isArray(arr)) return null;
  let best = null;
  for (let i = 0; i < arr.length; i++) {
    const it = arr[i];
    if (!it || num(it.v) === null) continue;
    if (best === null || String(it.period) > String(best.period)) best = it;
  }
  return best ? best.v : null;
}

function businessCheck(symbol, name, industry) {
  const base = { key: "business", label: "Қызмет түрі", value: null, display: "" };

  const tickerReason = HARAM_TICKERS[symbol];
  if (tickerReason) {
    return { ...base, status: "fail", note: "Негізгі қызмет: " + tickerReason };
  }

  const nameHit = FAIL_NAME.exec(name);
  if (nameHit) {
    return { ...base, status: "fail", note: "Атауында тыйым салынған сала белгісі: " + nameHit[0] };
  }

  const indHit = FAIL_INDUSTRY.exec(industry);
  if (indHit) {
    return { ...base, status: "fail", note: "Тыйым салынған сала: " + industry };
  }

  if (!industry) {
    return { ...base, status: "unknown", display: "—", note: "Сала белгісіз" };
  }

  for (let i = 0; i < DOUBT_INDUSTRY.length; i++) {
    if (DOUBT_INDUSTRY[i][0].test(industry)) {
      return { ...base, status: "doubtful", note: DOUBT_INDUSTRY[i][1] };
    }
  }

  return { ...base, status: "pass", note: "Тыйым салынған сала байқалмады (" + industry + ")" };
}

function ratioCheck(key, label, value, limit) {
  if (value === null) {
    return { key, label, status: "unknown", value: null, display: "—", note: "Дерек табылмады" };
  }
  const status = value <= limit * (1 - BAND) ? "pass" : value <= limit * (1 + BAND) ? "doubtful" : "fail";
  return {
    key,
    label,
    status,
    value: Math.round(value * 10) / 10,
    display: value.toFixed(1) + "%",
    note: status === "doubtful" ? "Шекараға жақын (шек: ≤ " + limit + "%)" : "Шек: ≤ " + limit + "%",
  };
}

/**
 * @param {{symbol: string, name?: string, industry?: string, price?: number, metricData?: object}} args
 *   metricData — Finnhub /stock/metric?metric=all жауабы ({metric, series})
 */
export function computeHalalStatus(args) {
  const symbol = String((args && args.symbol) || "").toUpperCase();
  const name = args && typeof args.name === "string" ? args.name : "";
  const industry = args && typeof args.industry === "string" ? args.industry : "";
  const price = args ? num(args.price) : null;
  const metricData = (args && args.metricData) || {};
  const metric = metricData.metric || {};
  const series = metricData.series || {};
  const sq = series.quarterly || {};
  const sa = series.annual || {};

  // ---------- 1) Қызмет түрі ----------
  const business = businessCheck(symbol, name, industry);

  // ---------- 2) Борыш / нарықтық капитализация = (Debt/Equity) ÷ (Price/Book) ----------
  const de = firstNum([
    { key: "totalDebt/totalEquityQuarterly", value: metric["totalDebt/totalEquityQuarterly"] },
    { key: "totalDebt/totalEquityAnnual", value: metric["totalDebt/totalEquityAnnual"] },
    { key: "series.quarterly.totalDebtToEquity", value: latestSeriesValue(sq.totalDebtToEquity) },
    { key: "series.annual.totalDebtToEquity", value: latestSeriesValue(sa.totalDebtToEquity) },
  ]);

  // P/B: алдымен нақты баға ÷ бір акцияға келетін баланстық құн, болмаса Finnhub-тың өз P/B-сы
  const bvps = firstNum([
    { key: "bookValuePerShareQuarterly", value: metric.bookValuePerShareQuarterly },
    { key: "bookValuePerShareAnnual", value: metric.bookValuePerShareAnnual },
  ]);
  let pb = null;
  let pbKey = null;
  if (bvps && bvps.value > 0 && price !== null && price > 0) {
    pb = price / bvps.value;
    pbKey = "price/" + bvps.key;
  } else {
    const pbm = firstNum([
      { key: "pbQuarterly", value: metric.pbQuarterly },
      { key: "pbAnnual", value: metric.pbAnnual },
      { key: "pb", value: metric.pb },
      { key: "series.quarterly.pb", value: latestSeriesValue(sq.pb) },
      { key: "series.annual.pb", value: latestSeriesValue(sa.pb) },
    ]);
    if (pbm) {
      pb = pbm.value;
      pbKey = pbm.key;
    }
  }

  let debtRatio = de && de.value >= 0 && pb !== null && pb > 0 ? (de.value / pb) * 100 : null;
  if (debtRatio !== null && debtRatio > MAX_SANE_RATIO * 100) debtRatio = null;

  // ---------- 3) Ақша / нарықтық капитализация = (бір акцияға ақша) ÷ баға ----------
  const cps = firstNum([
    { key: "cashPerSharePerShareQuarterly", value: metric.cashPerSharePerShareQuarterly },
    { key: "cashPerSharePerShareAnnual", value: metric.cashPerSharePerShareAnnual },
    { key: "cashPerShareQuarterly", value: metric.cashPerShareQuarterly },
    { key: "cashPerShareAnnual", value: metric.cashPerShareAnnual },
  ]);
  let cashRatio = cps && cps.value >= 0 && price !== null && price > 0 ? (cps.value / price) * 100 : null;
  if (cashRatio !== null && cashRatio > MAX_SANE_RATIO * 100) cashRatio = null;

  const debt = ratioCheck("debt", "Пайыздық борыш / нарық құны", debtRatio, DEBT_LIMIT);
  const cash = ratioCheck("cash", "Ақша мен депозиттер / нарық құны", cashRatio, CASH_LIMIT);
  const checks = [business, debt, cash];

  // ---------- Жалпы нәтиже ----------
  const failed = checks.find((c) => c.status === "fail");
  const allUnknown = checks.every((c) => c.status === "unknown");
  const anyNotPass = checks.some((c) => c.status !== "pass");
  const status = failed ? "fail" : allUnknown ? "unknown" : anyNotPass ? "doubtful" : "pass";

  let summary;
  if (status === "fail") {
    summary =
      failed.key === "business"
        ? "Қызмет түрі сәйкес емес — " + failed.note
        : "Қаржы көрсеткіші шектен асады — " + failed.label + ": " + failed.display + " (шек: ≤ " +
          (failed.key === "debt" ? DEBT_LIMIT : CASH_LIMIT) + "%)";
  } else if (status === "pass") {
    summary = "Қызмет түрі мен қаржы көрсеткіштері AAOIFI шегінде (бастапқы скрин).";
  } else if (status === "unknown") {
    summary = "Деректер жеткіліксіз (ETF, индекс немесе компания деректері жоқ).";
  } else {
    summary = "Кейбір көрсеткіштер шекараға жақын, тексерілмеген немесе деректері жоқ — қолмен тексеру керек.";
  }

  return {
    status,
    label: STATUS_LABEL[status],
    summary,
    checks,
    disclaimer: DISCLAIMER,
    standard: "AAOIFI SS-21 (нарық құны бойынша)",
    // Қай Finnhub өрістері табылғанын көру үшін (жөндеуге): /api/stock?symbol=AAPL
    inputs: {
      debtToEquity: de,
      priceToBook: pb !== null ? { value: pb, key: pbKey } : null,
      cashPerShare: cps,
    },
  };
}
