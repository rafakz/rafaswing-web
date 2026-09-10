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

/* ---------- Диаграмма: Smart Money — liquidity grab (stop hunt) ---------- */
function SmartMoneyDiagram() {
  return (
    <svg viewBox="0 0 320 110" width="100%" height="110" style={{ display: "block", marginTop: "10px" }}>
      {/* Retail стоп-лосс деңгейі */}
      <line x1="0" y1="75" x2="320" y2="75" stroke={colors.loss} strokeWidth="1" strokeDasharray="4,4" />
      <text x="4" y="70" fill={colors.loss} fontSize="9">Retail stop-loss деңгейі (liquidity)</text>

      {/* Баға қозғалысы: құлдырау, деңгейден шығып кету (sweep), содан кейін күшті керіөзгеріс */}
      <polyline
        points="0,30 40,45 80,55 110,70 130,84 145,74 160,60 190,40 220,25 250,15 280,10 320,8"
        fill="none"
        stroke={colors.textPrimary}
        strokeWidth="2"
      />

      {/* Sweep нүктесі — деңгейден төмен түсіп, кері қайту */}
      <circle cx="130" cy="84" r="4" fill={colors.gold} />
      <text x="140" y="100" fill={colors.goldBright} fontSize="9">Liquidity sweep → күшті керіөзгеріс</text>
    </svg>
  );
}

/* ---------- Диаграмма: Фибоначчи ретрейсмент ---------- */
function FibonacciDiagram() {
  const levels = [
    { pct: "0%", y: 12, color: colors.textFaint },
    { pct: "23.6%", y: 30, color: colors.textMuted },
    { pct: "38.2%", y: 46, color: colors.goldBright },
    { pct: "50%", y: 58, color: colors.gold },
    { pct: "61.8%", y: 70, color: colors.goldBright },
    { pct: "78.6%", y: 86, color: colors.textMuted },
    { pct: "100%", y: 100, color: colors.textFaint },
  ];

  return (
    <svg viewBox="0 0 320 110" width="100%" height="110" style={{ display: "block", marginTop: "10px" }}>
      {levels.map((l) => (
        <g key={l.pct}>
          <line x1="60" y1={l.y} x2="320" y2={l.y} stroke={l.color} strokeWidth="1" strokeDasharray="3,3" />
          <text x="2" y={l.y + 3} fill={l.color} fontSize="8">{l.pct}</text>
        </g>
      ))}

      {/* Баға: жоғарыдан (swing high) 61.8%-ге дейін түсіп, содан кейін кері өседі */}
      <polyline
        points="60,12 100,20 140,35 170,55 200,70 220,68 250,50 280,30 320,18"
        fill="none"
        stroke={colors.textPrimary}
        strokeWidth="2"
      />
      <circle cx="60" cy="12" r="3.5" fill={colors.gain} />
      <circle cx="220" cy="68" r="3.5" fill={colors.gain} />
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

      {/* ---------- SMART MONEY ---------- */}
      <Section title="🐋 Smart Money (институционалды капитал)">
        <Term name="Smart Money деген не?">
          Smart Money — ірі институционалды ойыншылардың (банктер, хедж-қорлар, маркет-мейкерлер)
          капиталы. Олардың позициялары соншалықты үлкен, сондықтан бір мезгілде толығымен
          сатып ала/сата алмайды — нарыққа біртіндеп кіреді және өз іздерін жасырады. Жеке
          трейдерлер (retail) көбіне олардың соңынан еруге тырысады.
        </Term>

        <Term name="Market Structure (нарық құрылымы)">
          Баға қозғалысының негізгі &quot;тілі&quot;. Higher High (HH) және Higher Low (HL) тізбегі —
          өсу құрылымы; Lower High (LH) және Lower Low (LL) тізбегі — түсу құрылымы. Құрылым
          өзгергенде (мысалы, HL орнына LL пайда болса) — бұл трендтің ауысу белгісі (Break of
          Structure).
        </Term>

        <Term name="Liquidity (ликвидтілік) және Stop Hunt">
          Көптеген retail трейдерлер стоп-лосс ордерлерін бірдей деңгейлерге (мысалы, соңғы
          локал минимумнан сәл төмен) қояды. Ол жерде &quot;ликвидтілік&quot; жиналады. Smart Money
          көбіне бағаны сол деңгейге әдейі итеріп, стоп-лосстарды іске қосады (stop hunt /
          liquidity sweep), содан кейін баға кенеттен кері бұрылады — өз позициясын сол сатылған
          акциялар есебінен жинайды.
        </Term>
        <SmartMoneyDiagram />

        <Term name="Order Block">
          Күшті қозғалыс басталар алдындағы соңғы қарама-қарсы бағыттағы свеча (мысалы, күшті
          өсу алдындағы соңғы түсу свечасы). Бұл — институционалды ойыншылардың ордер қойған
          аймағы деп есептеледі, баға сол аймаққа қайта оралғанда тағы да реакция беруі мүмкін.
        </Term>

        <div style={{ marginTop: "6px", fontSize: "0.78rem", color: colors.textFaint }}>
          ⚠ Smart Money концепциясы — баға қозғалысын түсіндірудің бір тәсілі, дәл болжам
          құралы емес. Басқа сигналдармен (RSI, MACD, Swing Score) бірге қараған дұрыс.
        </div>
      </Section>

      {/* ---------- ФИБОНАЧЧИ ---------- */}
      <Section title="🌀 Фибоначчи ретрейсменті">
        <Term name="Фибоначчи деген не?">
          Фибоначчи ретрейсменті — бағаның тренд ішіндегі уақытша кері қозғалысы (pullback)
          қай деңгейде тоқтап, тренд бағытында жалғасуы мүмкін екенін болжауға көмектесетін
          құрал. Негізі — математик Леонардо Фибоначчидің сандар тізбегінен алынған
          пайыздар: 23.6%, 38.2%, 50%, 61.8%, 78.6%.
        </Term>

        <Term name="Қалай сызылады?">
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div>1. Айқын тренд қозғалысын тап — бір нақты минимум (swing low) мен максимум (swing high) арасы.</div>
            <div>2. Өсу трендінде: Фибоначчи құралын swing low-дан swing high-ға дейін созасың (0% — минимумда, 100% — максимумда).</div>
            <div>3. Түсу трендінде: керісінше, swing high-дан swing low-ға дейін созасың.</div>
            <div>4. Құрал автоматты түрде 23.6% / 38.2% / 50% / 61.8% / 78.6% деңгейлерін сызады.</div>
          </div>
        </Term>
        <FibonacciDiagram />

        <Term name="Қалай қолданылады?">
          Тренд бағытында өсіп бара жатқан баға уақытша кері тартылғанда (pullback), осы
          деңгейлер ықтимал support (өсу трендінде) немесе resistance (түсу трендінде)
          болады. Ең көп қолданылатыны — <strong>38.2%</strong> және <strong>61.8%</strong> деңгейлері:
          баға осы аймаққа тартылып, содан кейін негізгі тренд бағытында қайта өссе, бұл
          жиі кездесетін entry нүктесі болады.
        </Term>

        <div style={{ marginTop: "6px", fontSize: "0.78rem", color: colors.textFaint }}>
          ⚠ Фибоначчи деңгейлері өз бетінше сигнал бермейді — оларды RSI, MACD немесе Smart
          Money деңгейлерімен (order block, liquidity) қоса растап барып шешім қабылдаған
          дұрыс.
        </div>
      </Section>
    </main>
  );
}
