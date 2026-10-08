/**
 * Фундаменталды көрсеткіштерге адамға түсінікті түсіндірме береді.
 * Әр көрсеткіш үшін: мән, түс (tone) және бір жолдық қазақша хабарлама.
 *
 * Шекаралар жалпы қаржылық ережелерге негізделген (өндіріс/технология акцияларына
 * жалпы қолданылады). Сала бойынша айырмашылық бар, сондықтан бұл — бағдар, үкім емес.
 *
 * tone: "good" | "neutral" | "warn" | "bad"
 */

function isNum(v) {
  return typeof v === "number" && isFinite(v);
}

function fmt(v, digits) {
  return isNum(v) ? v.toFixed(digits) : "—";
}

function item(key, label, value, tone, hint, wide) {
  return { key: key, label: label, value: value, tone: tone, hint: hint, wide: !!wide };
}

function explainPE(pe) {
  if (!isNum(pe) || pe <= 0) {
    return item("pe", "P/E", "—", "bad", "Компанияның пайдасы жоқ (немесе шығын), сондықтан P/E есептелмейді. Пайдасыз компанияны сақтап отыру тәуекелі жоғары.", true);
  }
  if (pe < 15) return item("pe", "P/E", fmt(pe, 2), "good", "Арзан болуы мүмкін: бағасы пайдасынан төмен. Неге арзан екенін тексер — өсу баяу болуы мүмкін.");
  if (pe < 25) return item("pe", "P/E", fmt(pe, 2), "neutral", "Орташа: нарық деңгейіне жақын баға.");
  if (pe < 40) return item("pe", "P/E", fmt(pe, 2), "warn", "Қымбатырақ: баға пайдадан 25–40 есе жоғары. Тек күшті өсу болса ақталады.");
  return item("pe", "P/E", fmt(pe, 2), "bad", "Өте қымбат: баға пайдадан 40+ есе жоғары. Компания өте жылдам өсуі керек, әйтпесе баға түсуі мүмкін.");
}

function explainEPS(eps) {
  if (!isNum(eps)) return item("eps", "EPS", "—", "neutral", "Бір акцияға шаққан таза пайда. Деректер жоқ.");
  if (eps > 0) return item("eps", "EPS", "$" + fmt(eps, 2), "good", "Бір акцияға шаққан таза пайда. Оң — компания табыс табады.");
  return item("eps", "EPS", "$" + fmt(eps, 2), "bad", "Бір акцияға шаққан таза шығын. Компания ақша жоғалтып жатыр.");
}

function explainROE(roe) {
  if (!isNum(roe)) return item("roe", "ROE", "—", "neutral", "Капиталдан табыс. Деректер жоқ.");
  const v = fmt(roe, 1) + "%";
  if (roe >= 15) return item("roe", "ROE", v, "good", "Жақсы: компания салған ақшадан 15%+ табыс табады (≥15% — жақсы көрсеткіш).");
  if (roe >= 8) return item("roe", "ROE", v, "neutral", "Орташа: капиталды пайдалану қалыпты деңгейде.");
  return item("roe", "ROE", v, "bad", "Әлсіз: компания капиталын тиімді пайдаланбайды (<8%).");
}

function explainMargin(m) {
  if (!isNum(m)) return item("netMargin", "Таза маржа", "—", "neutral", "Әр доллар сатылымнан қалатын таза пайда. Деректер жоқ.");
  const v = fmt(m, 1) + "%";
  if (m >= 15) return item("netMargin", "Таза маржа", v, "good", "Жоғары: әр 100 доллар кіріске 15+ доллар таза пайда қалады (бәсекеге қабілеттілік күшті).");
  if (m >= 5) return item("netMargin", "Таза маржа", v, "neutral", "Орташа: пайда бар, бірақ шығын да көп.");
  if (m > 0) return item("netMargin", "Таза маржа", v, "warn", "Төмен: пайда өте аз, кіріс аздап төмендесе, шығын болуы мүмкін.");
  return item("netMargin", "Таза маржа", v, "bad", "Теріс: компания сатылымнан шығын көреді.");
}

function explainGrowth(v, label, key) {
  if (!isNum(v)) return item(key, label, "—", "neutral", "Жыл сайынғы өсім. Деректер жоқ.");
  const s = (v > 0 ? "+" : "") + fmt(v, 1) + "%";
  if (v >= 10) return item(key, label, s, "good", "Жақсы өсім: жылына 10%+ өсіп жатыр.");
  if (v >= 0) return item(key, label, s, "neutral", "Баяу өсім: компания өспейді де, құламайды да.");
  return item(key, label, s, "bad", "Төмендеу: соңғы жылы көрсеткіш нашарлаған.");
}

function explainDividend(d) {
  if (!isNum(d) || d <= 0) {
    return item("dividend", "Дивиденд", "—", "neutral", "Дивиденд төленбейді. Өсу компаниялары үшін қалыпты: пайда қайта өндіріске жұмсалады. Табыс үшін бағаның өсуіне сүйенесің.");
  }
  return item("dividend", "Дивиденд", fmt(d, 2) + "%", "good", "Жылдық табыс: акция бағасынан тұрақты кіріс алуға болады.");
}

function explainBeta(b) {
  if (!isNum(b)) return item("beta", "Beta", "—", "neutral", "Нарық қозғалысына қарағанда баға қанша ауытқитынын көрсетеді. Деректер жоқ.");
  const v = fmt(b, 2);
  if (b < 0.8) return item("beta", "Beta", v, "good", "Тұрақты: баға нарықтан азырақ ауытқиды.");
  if (b <= 1.2) return item("beta", "Beta", v, "neutral", "Нарықпен бірге қозғалады (1.0 — нарық деңгейі).");
  return item("beta", "Beta", v, "warn", "Жоғары ауытқу: нарық 1% түссе, акция шамамен " + fmt(b, 1) + "% түсуі мүмкін. Қауіп те, сауда мүмкіндігі де көп.");
}

function explain52w(price, low, high) {
  if (!isNum(price) || !isNum(low) || !isNum(high) || high <= low) {
    return item("range52", "52 апта", "—", "neutral", "Соңғы жыл ішіндегі ең жоғары және ең төмен баға. Деректер жоқ.", true);
  }
  const pos = (price - low) / (high - low);
  const v = "$" + fmt(low, 2) + " — $" + fmt(high, 2);
  const pct = Math.round(pos * 100);
  if (pos >= 0.8) return item("range52", "52 апта", v, "warn", "Бағасы жылдық шегіне жақын (ағымдағы орны: " + pct + "%). Жоғарыдан сатып алу тәуекелі жоғары.", true);
  if (pos <= 0.2) return item("range52", "52 апта", v, "neutral", "Бағасы жылдық төменгі шегіне жақын (" + pct + "%). Арзандау болуы мүмкін, бірақ түсу жалғасуы да мүмкін.", true);
  return item("range52", "52 апта", v, "neutral", "Ағымдағы баға жылдық диапазонның ортасында (" + pct + "%).", true);
}

/**
 * fundamentals — stock route-тан келетін объект; price — ағымдағы баға (52 апта орны үшін).
 * Қайтарады: көрсетуге дайын элементтер тізімі.
 */
export function explainFundamentals(f, price) {
  const d = f || {};
  return [
    explainPE(d.pe),
    explainEPS(d.eps),
    explainROE(d.roe),
    explainMargin(d.netMargin),
    explainGrowth(d.revenueGrowth, "Кіріс өсімі", "revenueGrowth"),
    explainGrowth(d.epsGrowth, "EPS өсімі", "epsGrowth"),
    explainDividend(d.dividendYield),
    explainBeta(d.beta),
    explain52w(price, d.week52Low, d.week52High),
  ];
}
