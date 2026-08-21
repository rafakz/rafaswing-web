import NavMenu from "../NavMenu";

const colors = {
  bg: "#0B0F1A",
  card: "#141B2E",
  border: "#263248",
  gold: "#C9A227",
  goldBright: "#E8C468",
  textPrimary: "#F5F1E6",
  textMuted: "#8A93A6",
  textFaint: "#5B6478",
  gain: "#4FA98B",
  loss: "#C2542D",
};

const fontDisplay = "'Georgia', 'Times New Roman', serif";
const fontBody = "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const fontMono = "'SF Mono', 'Consolas', 'Menlo', monospace";

/* ---------- Диаграмма: RSI осцилляторы ---------- */
function RsiDiagram() {
  return (
    <svg viewBox="0 0 320 110" width="100%" height="110" style={{ display: "block", marginTop: "10px" }}>
      <line x1="0" y1="20" x2="320" y2="20" stroke={colors.loss} strokeWidth="1" strokeDasharray="4,4" />
      <text x="4" y="14" fill={colors.loss} fontSize="10">70 — артық сатып алынған</text>

      <line x1="0" y1="90" x2="320" y2="90" stroke={colors.gain} strokeWidth="1" strokeDasharray="4,4" />
      <text x="4" y="104" fill={colors.gain} fontSize="10">30 — артық сатылған</text>

      <polyline
        points="0,60 30,45 60,25 90,15 120,35 150,55 180,80 210,95 240,70 270,50 300,30 320,25"
        fill="none"
        stroke={colors.gold}
        strokeWidth="2"
      />
    </svg>
  );
}

/* ---------- Диаграмма: MACD ---------- */
function MacdDiagram() {
  return (
    <svg viewBox="0 0 320 110" width="100%" height="110" style={{ display: "block", marginTop: "10px" }}>
      <line x1="0" y1="55" x2="320" y2="55" stroke={colors.border} strokeWidth="1" />
      <polyline
        points="0,70 40,60 80,40 120,30 160,45 200,65 240,50 280,35 320,25"
        fill="none"
        stroke={colors.goldBright}
        strokeWidth="2"
      />
      <polyline
        points="0,75 40,68 80,55 120,38 160,40 200,58 240,60 280,45 320,30"
        fill="none"
        stroke={colors.textMuted}
        strokeWidth="1.6"
        strokeDasharray="3,3"
      />
      <circle cx="120" cy="34" r="4" fill={colors.gain} />
      <circle cx="240" cy="55" r="4" fill={colors.loss} />
      <text x="90" y="18" fill={colors.gain} fontSize="9">MACD signal-ды кесіп өтеді ↑</text>
    </svg>
  );
}

/* ---------- Диаграмма: SMA / Golden Cross ---------- */
function SmaDiagram() {
  return (
    <svg viewBox="0 0 320 110" width="100%" height="110" style={{ display: "block", marginTop: "10px" }}>
      <polyline
        points="0,90 40,70 80,80 120,50 160,60 200,30 240,40 280,15 320,20"
        fill="none"
        stroke={colors.textPrimary}
        strokeWidth="2"
      />
      <polyline
        points="0,85 40,78 80,72 120,65 160,58 200,50 240,42 280,35 320,28"
        fill="none"
        stroke={colors.goldBright}
        strokeWidth="1.6"
      />
      <polyline
        points="0,80 40,79 80,77 120,73 160,68 200,64 240,60 280,56 320,52"
        fill="none"
        stroke={colors.textMuted}
        strokeWidth="1.6"
        strokeDasharray="3,3"
      />
      <circle cx="170" cy="59" r="4" fill={colors.gain} />
      <text x="130" y="100" fill={colors.gain} fontSize="9">Golden Cross — SMA20 SMA50-ді кеседі ↑</text>
    </svg>
  );
}

/* ---------- Диаграмма: Тренд сызығы ---------- */
function TrendDiagram() {
  return (
    <svg viewBox="0 0 320 110" width="100%" height="110" style={{ display: "block", marginTop: "10px" }}>
      <polyline
        points="0,95 40,80 60,88 100,55 130,68 170,35 200,48 240,20 270,30 320,5"
        fill="none"
        stroke={colors.textPrimary}
        strokeWidth="2"
      />
      <line x1="0" y1="95" x2="320" y2="10" stroke={colors.gain} strokeWidth="1.6" strokeDasharray="5,3" />
      <circle cx="0" cy="95" r="3.5" fill={colors.gain} />
      <circle cx="130" cy="68" r="3.5" fill={colors.gain} />
      <circle cx="320" cy="10" r="3.5" fill={colors.gain} />
      <text x="6" y="22" fill={colors.gain} fontSize="9">Өсу трендінің желісі — төменгі нүктелерді қосу</text>
    </svg>
  );
}

function Section({ title, children }) {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: "400px",
        background: colors.card,
        border: `1px solid ${colors.border}`,
        borderRadius: "14px",
        padding: "18px",
        marginBottom: "18px",
      }}
    >
      <div
        style={{
          fontSize: "0.95rem",
          fontWeight: "bold",
          color: colors.gold,
          marginBottom: "10px",
        }}
      >
        {title}
      </div>
      <div style={{ fontSize: "0.85rem", color: colors.textMuted, lineHeight: "1.55" }}>{children}</div>
    </div>
  );
}

function Term({ name, formula, children }) {
  return (
    <div style={{ marginBottom: "14px" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "3px" }}>
        <span style={{ color: colors.textPrimary, fontWeight: "600", fontSize: "0.86rem" }}>{name}</span>
        {formula ? (
          <span style={{ color: colors.goldBright, fontFamily: fontMono, fontSize: "0.75rem" }}>{formula}</span>
        ) : null}
      </div>
      <div>{children}</div>
    </div>
  );
}

export default function LessonsPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: colors.bg,
        color: colors.textPrimary,
        padding: "32px 16px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        fontFamily: fontBody,
      }}
    >
      <NavMenu />

      <h1
        style={{
          fontFamily: fontDisplay,
          fontSize: "1.6rem",
          fontWeight: "bold",
          marginTop: "8px",
          marginBottom: "4px",
        }}
      >
        Уроки
      </h1>
      <p style={{ color: colors.textFaint, fontSize: "0.75rem", marginBottom: "22px", textAlign: "center" }}>
        Техникалық және фундаменталды анализ негіздері
      </p>

      {/* ---------- ТЕХНИКАЛЫҚ АНАЛИЗ ---------- */}
      <Section title="📈 Техникалық анализ">
        <Term name="RSI (Relative Strength Index)" formula="0–100 аралығы">
          Акцияның соңғы кездегі баға қозғалысының қарқынын өлшейді. RSI 70-тен жоғары
          болса — акция &quot;артық сатып алынған&quot; (баға түсуі мүмкін), 30-дан төмен болса —
          &quot;артық сатылған&quot; (баға өсуі мүмкін).
        </Term>
        <RsiDiagram />

        <Term name="MACD" formula="EMA12 − EMA26">
          Екі орташа желінің (жылдам және баяу) айырмасы. MACD желісі signal желісін
          жоғарыдан қиып өтсе — өсу сигналы, төменнен қиып өтсе — түсу сигналы.
        </Term>
        <MacdDiagram />

        <Term name="SMA / EMA" formula="орташа баға, N күн">
          SMA — қарапайым орташа, EMA — соңғы бағаларға көбірек мән беретін орташа.
          Қысқа мерзімді орташа (SMA20) ұзақ мерзімдіні (SMA50) жоғарыдан кессе —
          &quot;Golden Cross&quot; (өсу сигналы), төменнен кессе — &quot;Death Cross&quot; (түсу сигналы).
        </Term>
        <SmaDiagram />

        <Term name="Volume (сауда көлемі)">
          Белгілі бір уақыт ішінде сатылған акция саны. Баға қозғалысы үлкен көлеммен
          бірге жүрсе, сигнал сенімдірек болады.
        </Term>
      </Section>

      {/* ---------- ФУНДАМЕНТАЛДЫ АНАЛИЗ ---------- */}
      <Section title="🏛️ Фундаменталды анализ">
        <Term name="P/E (баға/пайда қатынасы)" formula="Баға ÷ EPS">
          Компанияның нарықтық бағасы оның бір акцияға шаққандағы пайдасынан қанша
          есе жоғары екенін көрсетеді. Жоғары P/E — инвесторлар өсімге сенеді (немесе
          акция қымбат бағаланған), төмен P/E — акция арзан бағаланған болуы мүмкін.
        </Term>

        <Term name="EPS (Earnings Per Share)" formula="Таза пайда ÷ акция саны">
          Бір акцияға шаққандағы таза пайда. Өсіп тұрса — компания табысты дамып жатыр.
        </Term>

        <Term name="ROE (Return on Equity)" formula="Таза пайда ÷ меншікті капитал">
          Компанияның меншікті капиталды қаншалықты тиімді пайдаланғанын көрсетеді.
          Жоғары ROE — тиімді басқарылатын компания.
        </Term>

        <Term name="Кіріс өсімі / EPS өсімі">
          Компанияның сатылымы және пайдасы жыл сайын қаншаға өскенін көрсетеді.
          Тұрақты өсім — ұзақ мерзімді инвестиция үшін жақсы белгі.
        </Term>

        <Term name="Дивиденд кірістілігі" formula="Дивиденд ÷ баға × 100%">
          Акционерлерге төленетін дивидендтің акция бағасына қатынасы. Пассивті
          табыс іздейтін инвесторлар үшін маңызды көрсеткіш.
        </Term>
      </Section>

      {/* ---------- ТРЕНД ---------- */}
      <Section title="📐 Тренд қалай сызылады">
        Тренд сызығы — бағаның жалпы бағытын көрсететін түзу. Өсу трендінде екі
        немесе одан көп төменгі нүктені (local low) қосу арқылы сызылады — баға осы
        сызықтан жоғары тұрса, тренд өсу бағытында деп есептеледі. Түсу трендінде
        керісінше — жоғарғы нүктелер (local high) қосылады.
        <TrendDiagram />
        <div style={{ marginTop: "8px", fontSize: "0.78rem", color: colors.textFaint }}>
          Тренд сызығы бұзылса (баға сызықтан кесіп өтсе) — бұл тренд ауысуының
          алғашқы белгісі болуы мүмкін.
        </div>
      </Section>
    </main>
  );
}
