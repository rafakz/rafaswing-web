"use client";

import { useState } from "react";
import NavMenu from "./NavMenu";

/* ---------- Дизайн токендары ---------- */
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
  gainBright: "#6FCBA8",
  loss: "#C2542D",
  lossBright: "#E2764C",
  hold: "#D4A24C",
};

const fontDisplay = "'Georgia', 'Times New Roman', serif";
const fontBody = "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const fontMono = "'SF Mono', 'Consolas', 'Menlo', monospace";

/* ---------- Логотип ---------- */
function NogaiMark({ size = 40 }) {
  const tradeiqNav = [
    { label: "Басты бет", icon: "⌂" },
    { label: "Нарықтар", icon: "▥" },
    { label: "Таңдаулылар", icon: "☆" },
    { label: "Портфель", icon: "▣" },
    { label: "Скринер", icon: "⌕" },
    { label: "Жаңалықтар", icon: "▤" },
    { label: "AI талдау", icon: "✦" },
    { label: "Оқу орталығы", icon: "▢" },
    { label: "Параметр", icon: "⚙" },
  ];

  const marketCards = [
    { symbol: "AAPL", name: "Apple Inc.", price: "178.85", change: "+2.34%", icon: "A" },
    { symbol: "MSFT", name: "Microsoft Corp.", price: "426.78", change: "+1.87%", icon: "M" },
    { symbol: "NVDA", name: "NVIDIA Corp.", price: "952.41", change: "+3.21%", icon: "N" },
    { symbol: "TSLA", name: "Tesla, Inc.", price: "248.48", change: "+4.56%", icon: "T" },
  ];

  return (
    <main style={{ minHeight: "100vh", background: "#050B16", color: "#EEF5FF", fontFamily: fontBody }}>
      <style>{`
        *{box-sizing:border-box}
        body{margin:0;background:#050B16}
        .tq-shell{min-height:100vh;display:flex}
        .tq-side{width:208px;flex:0 0 208px;background:#061022;border-right:1px solid #102447;padding:22px 14px;position:sticky;top:0;height:100vh;display:flex;flex-direction:column}
        .tq-logo{text-align:center;margin-bottom:28px}
        .tq-logo-mark{font-size:30px;font-weight:900;color:#2684FF;letter-spacing:-5px}
        .tq-logo-name{font-size:23px;font-weight:800;letter-spacing:2px;margin-top:4px}
        .tq-logo-sub{font-size:7px;color:#7186A4;letter-spacing:1px;margin-top:4px}
        .tq-nav{display:flex;flex-direction:column;gap:4px}
        .tq-nav button{border:1px solid transparent;background:transparent;color:#AABBD1;padding:10px;border-radius:9px;display:flex;gap:11px;align-items:center;text-align:left;font-size:11px;cursor:pointer}
        .tq-nav button:hover,.tq-nav button.active{background:#0A1D3D;border-color:#123E80;color:#fff}
        .tq-nav button.active{box-shadow:inset 2px 0 #2182FF}
        .tq-nav-icon{width:19px;text-align:center;color:#7E93B0;font-size:16px}
        .tq-nav button.active .tq-nav-icon{color:#2584FF}
        .tq-side-bottom{margin-top:auto}
        .tq-side-note{border:1px solid #102447;border-radius:8px;padding:9px;color:#7F92AF;font-size:9px;display:flex;justify-content:space-between}
        .tq-profile{margin-top:9px;border:1px solid #102447;border-radius:9px;padding:10px;display:flex;gap:8px;align-items:center}
        .tq-avatar{width:30px;height:30px;border-radius:50%;background:#163A69;display:flex;align-items:center;justify-content:center}
        .tq-main{flex:1;min-width:0;max-width:1500px;margin:auto;padding:25px 25px 70px;width:100%}
        .tq-top{display:flex;justify-content:space-between;gap:20px}
        .tq-title{font-size:24px;font-weight:500;line-height:1.2}
        .tq-subtitle{color:#7E92AE;font-size:11px;margin-top:7px}
        .tq-indices{display:flex;gap:28px}
        .tq-index span{display:block;color:#70839F;font-size:8px;margin-bottom:5px}
        .tq-index strong{font-size:11px;font-weight:500;display:block}
        .tq-up{color:#18D27B}
        .tq-searchbar{display:flex;gap:9px;margin:22px 0 15px}
        .tq-search{height:44px;flex:1;min-width:0;border:1px solid #163157;background:#07152A;border-radius:9px;color:#fff;padding:0 15px;font-size:12px}
        .tq-search:focus{outline:none;border-color:#1677FF}
        .tq-btn{height:44px;border:0;border-radius:9px;background:#1267D8;color:white;font-weight:600;padding:0 22px;cursor:pointer}
        .tq-grid{display:grid;grid-template-columns:minmax(0,1fr) 285px;gap:13px}
        .tq-card{background:#061329;border:1px solid #10294D;border-radius:12px}
        .tq-head{display:flex;justify-content:space-between;align-items:center;padding:13px 15px}
        .tq-head strong{font-size:13px}
        .tq-link{color:#2681FF;font-size:9px}
        .tq-markets{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;padding:0 8px 11px}
        .tq-market{border:1px solid #122B50;background:#07172E;border-radius:9px;padding:10px;cursor:pointer}
        .tq-market:hover{border-color:#1769D9}
        .tq-market-top{display:flex;gap:7px;align-items:center}
        .tq-market-icon{width:25px;height:25px;border-radius:7px;background:#0D2344;display:flex;align-items:center;justify-content:center;color:#DDEAFF;font-weight:700}
        .tq-market-symbol{font-size:11px}.tq-market-name{font-size:7px;color:#657994;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .tq-price{font-size:16px;margin-top:10px}.tq-mini{font-size:8px;color:#18D27B;margin-top:3px}
        .tq-mini-chart{height:22px;margin-top:4px}
        .tq-stock{padding:15px;margin-top:13px}
        .tq-stock-head{display:flex;justify-content:space-between;gap:10px}
        .tq-stock-left{display:flex;gap:9px;align-items:center}.tq-stock-logo{width:32px;height:32px;background:#F2F6FC;color:#111;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:700}
        .tq-symbol{font-size:19px}.tq-company{font-size:9px;color:#70839F;margin-top:3px}
        .tq-fav{border:1px solid #123E78;background:#07172E;color:#5D9FFF;border-radius:7px;padding:7px 10px;font-size:9px}
        .tq-current{display:flex;align-items:baseline;gap:9px;margin-top:13px}.tq-current-price{font-size:24px}.tq-current-change{font-size:10px;color:#18D27B}
        .tq-periods{display:flex;gap:5px;margin-top:11px}.tq-period{background:#07162C;border:1px solid #102B51;color:#7F93AF;border-radius:5px;padding:5px 9px;font-size:8px}.tq-period.active{background:#1267D8;color:#fff;border-color:#1267D8}
        .tq-chart{height:205px;margin-top:7px;border-top:1px solid #0D2343;border-bottom:1px solid #0D2343;display:flex;align-items:center;overflow:hidden;background:repeating-linear-gradient(to bottom,transparent 0,transparent 50px,rgba(44,83,133,.12) 51px),repeating-linear-gradient(to right,transparent 0,transparent 78px,rgba(44,83,133,.08) 79px)}
        .tq-data{display:grid;grid-template-columns:repeat(6,1fr);gap:10px;padding:12px 0;border-bottom:1px solid #10294D}.tq-data span,.tq-stat span{display:block;color:#6F829D;font-size:7px;margin-bottom:5px}.tq-data strong,.tq-stat strong{font-size:10px;font-weight:500}
        .tq-stats{display:grid;grid-template-columns:repeat(6,1fr);gap:7px;margin-top:11px}.tq-stat{border:1px solid #10294D;background:#07172E;padding:8px;border-radius:7px}
        .tq-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:11px}.tq-action{border:1px solid #12396C;background:#07172E;color:#3288FF;padding:9px;border-radius:7px;text-align:left}.tq-action strong{display:block;font-size:9px}.tq-action span{display:block;color:#7185A0;font-size:7px;margin-top:3px}
        .tq-ai{padding:14px}.tq-ai-head{display:flex;justify-content:space-between}.tq-ai-head strong{font-size:13px}.tq-beta{color:#2681FF;font-size:7px}
        .tq-orb{width:105px;height:105px;border-radius:50%;margin:25px auto 17px;border:1px solid #1769D9;box-shadow:0 0 35px rgba(25,116,255,.18),inset 0 0 25px rgba(25,116,255,.12);display:flex;align-items:center;justify-content:center;color:#1D8AFF;font-size:40px}
        .tq-ai-text{color:#A2B2C9;font-size:9px;line-height:1.6;text-align:center}.tq-suggest{width:100%;border:1px solid #15345F;background:#07172E;color:#398CFF;border-radius:7px;padding:8px;text-align:left;margin-top:7px;font-size:8px}
        .tq-chat{display:flex;gap:5px;margin-top:8px}.tq-chat input{flex:1;min-width:0;background:#050F20;border:1px solid #15345F;color:#fff;border-radius:7px;padding:8px;font-size:8px}.tq-chat button{width:34px;border:0;border-radius:7px;background:#1267D8;color:#fff}
        .tq-bottom{display:grid;grid-template-columns:1.2fr 1fr 1fr;gap:13px;margin-top:13px}.tq-list{padding:0 14px 13px}
        .tq-news{display:flex;gap:8px;padding:8px 0;border-bottom:1px solid #0E2546}.tq-thumb{width:52px;height:36px;background:#0C2343;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#438EFF;flex:0 0 auto}.tq-news-title{font-size:8px;line-height:1.4}.tq-news-meta{font-size:6px;color:#647995;margin-top:3px}
        .tq-table{width:100%;border-collapse:collapse;font-size:8px}.tq-table th{color:#657A97;font-weight:400;text-align:left;padding:7px}.tq-table td{padding:8px;border-top:1px solid #0E2546}
        .tq-portfolio{padding:0 14px 14px}.tq-value{font-size:20px;margin:7px 0}.tq-donut{width:108px;height:108px;border-radius:50%;margin:13px auto;background:conic-gradient(#1769D9 0 40%,#2B7DE9 40% 65%,#12B7B0 65% 80%,#A8C23C 80% 90%,#F2B94B 90% 100%);position:relative}.tq-donut:after{content:"";position:absolute;inset:25px;background:#061329;border-radius:50%}
        .tq-holding{display:flex;justify-content:space-between;color:#A6B5C9;font-size:8px;margin:5px 0}
        .tq-error{color:#FF785F;font-size:10px;margin:7px 0}.tq-empty{color:#647995;font-size:9px;padding:15px 0}
        @media(max-width:1000px){.tq-side{width:70px;flex-basis:70px}.tq-logo-name,.tq-logo-sub,.tq-nav button span:last-child,.tq-side-note span:first-child,.tq-profile>div:last-child{display:none}.tq-nav button{justify-content:center}.tq-nav-icon{width:auto}.tq-grid{grid-template-columns:1fr}.tq-ai{min-height:0}}
        @media(max-width:700px){.tq-shell{display:block}.tq-side{display:none}.tq-main{padding:15px 9px 72px}.tq-top{display:block}.tq-indices{margin-top:13px;justify-content:space-between;gap:6px}.tq-searchbar{margin:15px 0 11px}.tq-markets{grid-template-columns:repeat(2,1fr)}.tq-data{grid-template-columns:repeat(3,1fr)}.tq-stats{grid-template-columns:repeat(3,1fr)}.tq-bottom{grid-template-columns:1fr}.tq-chart{height:170px}.tq-mobile{display:flex!important}}
        .tq-mobile{display:none;position:fixed;left:0;right:0;bottom:0;height:58px;background:#061329;border-top:1px solid #123055;z-index:90;justify-content:space-around;align-items:center}.tq-mobile button{border:0;background:none;color:#7488A5;font-size:7px}.tq-mobile b{display:block;font-size:17px;margin-bottom:2px}
      `}</style>

      <div className="tq-shell">
        <aside className="tq-side">
          <div className="tq-logo">
            <div className="tq-logo-mark">◒↗</div>
            <div className="tq-logo-name">TRADEIQ</div>
            <div className="tq-logo-sub">AI-POWERED TRADING</div>
          </div>
          <nav className="tq-nav">
            {tradeiqNav.map((item, i) => (
              <button key={item.label} className={i === 0 ? "active" : ""} type="button">
                <span className="tq-nav-icon">{item.icon}</span><span>{item.label}</span>
              </button>
            ))}
          </nav>
          <div className="tq-side-bottom">
            <div className="tq-side-note"><span>Күндізгі режим</span><span>☼</span></div>
            <div className="tq-profile"><div className="tq-avatar">👤</div><div><div style={{fontSize:9}}>Профиль</div><div style={{fontSize:7,color:"#607694"}}>Аккаунт</div></div></div>
          </div>
        </aside>

        <section className="tq-main">
          <header className="tq-top">
            <div><div className="tq-title">Қош келдіңіз!</div><div className="tq-subtitle">Ақылды инвестиция. Нақты талдау.</div></div>
            <div className="tq-indices">
              <div className="tq-index"><span>S&amp;P 500</span><strong>5,280.70</strong><strong className="tq-up">+1.32%</strong></div>
              <div className="tq-index"><span>NASDAQ</span><strong>16,735.02</strong><strong className="tq-up">+1.85%</strong></div>
              <div className="tq-index"><span>DOW JONES</span><strong>38,873.12</strong><strong className="tq-up">+0.92%</strong></div>
            </div>
          </header>

          <form onSubmit={searchStock} className="tq-searchbar">
            <input className="tq-search" value={ticker} onChange={(e)=>setTicker(e.target.value)} placeholder="⌕  Акция немесе тикер іздеу (мыс. AAPL)" />
            <button className="tq-btn" type="submit" disabled={loading}>{loading ? "..." : "Іздеу"}</button>
          </form>
          {error ? <div className="tq-error">{error}</div> : null}

          <div className="tq-grid">
            <div>
              <div className="tq-card">
                <div className="tq-head"><strong>Нарық шолуы</strong><span className="tq-link">Барлығын көру ›</span></div>
                <div className="tq-markets">
                  {marketCards.map((m)=><div key={m.symbol} className="tq-market" onClick={()=>setTicker(m.symbol)}>
                    <div className="tq-market-top"><div className="tq-market-icon">{m.icon}</div><div><div className="tq-market-symbol">{m.symbol}</div><div className="tq-market-name">{m.name}</div></div></div>
                    <div className="tq-price">{m.price}</div><div className="tq-mini">{m.change}</div>
                    <div className="tq-mini-chart"><svg viewBox="0 0 120 25" preserveAspectRatio="none"><polyline points="0,20 12,16 23,19 35,12 47,16 59,9 70,12 83,5 96,8 108,3 120,5" fill="none" stroke="#18D27B" strokeWidth="1.5"/></svg></div>
                  </div>)}
                </div>
              </div>

              <div className="tq-card tq-stock">
                {data ? <>
                  <div className="tq-stock-head">
                    <div className="tq-stock-left">
                      {data.logo ? <img src={data.logo} alt={data.symbol || ""} width={32} height={32} style={{borderRadius:8}}/> : <div className="tq-stock-logo">◉</div>}
                      <div><div className="tq-symbol">{data.symbol || "—"}</div><div className="tq-company">{data.name || ""}</div></div>
                    </div>
                    <button type="button" className="tq-fav">☆ Таңдаулылар</button>
                  </div>
                  <div className="tq-current"><span className="tq-current-price">${safeNum(data.currentPrice,2)}</span><span className="tq-current-change">{isUp?"+":""}{safeNum(data.changePercent,2)}%</span></div>
                  <div className="tq-periods">{["1D","1W","1M","3M","6M","1Y","5Y","MAX"].map((p,i)=><span key={p} className={`tq-period ${i===0?"active":""}`}>{p}</span>)}</div>
                  <div className="tq-chart">{hasHistory ? <Sparkline history={data.history} isUp={isUp}/> : <div className="tq-empty" style={{width:"100%",textAlign:"center"}}>График дерегі жүктелмеді</div>}</div>
                  <div className="tq-data">
                    <div><span>Ашылуы</span><strong>{safeNum(data.open,2)}</strong></div><div><span>Жоғарғы</span><strong>{safeNum(data.high,2)}</strong></div><div><span>Төменгі</span><strong>{safeNum(data.low,2)}</strong></div><div><span>Алдыңғы жабылуы</span><strong>{safeNum(data.previousClose,2)}</strong></div><div><span>Көлем</span><strong>{data.volume?.latest?(data.volume.latest/1e6).toFixed(2)+"M":"—"}</strong></div><div><span>Market Cap</span><strong>{typeof data.marketCap==="number"?(data.marketCap/1000).toFixed(1)+"B":"—"}</strong></div>
                  </div>
                  {data.fundamentals ? <div className="tq-stats">
                    <div className="tq-stat"><span>P/E</span><strong>{safeNum(data.fundamentals.pe,2)}</strong></div><div className="tq-stat"><span>EPS</span><strong>{safeNum(data.fundamentals.eps,2)}</strong></div><div className="tq-stat"><span>ROE</span><strong>{safeNum(data.fundamentals.roe,1)}%</strong></div><div className="tq-stat"><span>Beta</span><strong>{safeNum(data.fundamentals.beta,2)}</strong></div><div className="tq-stat"><span>52 апта max</span><strong>{safeNum(data.fundamentals.week52High,2)}</strong></div><div className="tq-stat"><span>52 апта min</span><strong>{safeNum(data.fundamentals.week52Low,2)}</strong></div>
                  </div>:null}
                  <div className="tq-actions"><button type="button" className="tq-action" onClick={getAiSummary}><strong>▥ Фундаменталды талдау</strong><span>Қаржылық көрсеткіштер</span></button><button type="button" className="tq-action" onClick={getAiSummary}><strong>⌁ Техникалық талдау</strong><span>Индикаторлар мен тренд</span></button></div>
                  {signal?<div style={{marginTop:10,padding:9,border:`1px solid ${signal.color}`,borderRadius:7,color:signal.color,fontSize:9}}>Сигнал: <strong>{signal.label}</strong></div>:null}
                  {aiError?<div className="tq-error">{aiError}</div>:null}
                  {aiSummary?<div style={{marginTop:9,padding:9,borderRadius:7,background:"#07172E",fontSize:9,lineHeight:1.5}}>{aiSummary}</div>:null}
                </> : <div className="tq-empty">Акцияны іздеңіз — толық график, фундаменталды және техникалық талдау осы жерде көрсетіледі.</div>}
              </div>
            </div>

            <aside className="tq-card tq-ai">
              <div className="tq-ai-head"><strong>AI талдау</strong><span className="tq-beta">BETA</span></div>
              <div className="tq-orb">✦</div>
              <div className="tq-ai-text">Сәлем! Мен TradeIQ AI.<br/>Акцияларды талдауға және нарықты түсіндіруге көмектесемін.</div>
              {data?<button type="button" className="tq-suggest" onClick={getAiSummary}>{data.symbol} акциясына талдау жаса</button>:null}
              <button type="button" className="tq-suggest" onClick={()=>setChatInput("Нарық жағдайы қалай?")}>Нарық жағдайы қалай?</button>
              <button type="button" className="tq-suggest" onClick={()=>setChatInput("Swing trading бойынша кеңес бер")}>Swing trading бойынша кеңес бер</button>
              {chatMessages.length>0?<div style={{marginTop:9,maxHeight:175,overflowY:"auto"}}>{chatMessages.map((m,i)=><div key={i} style={{padding:7,marginBottom:4,borderRadius:6,background:m.role==="user"?"#1267D8":"#07172E",fontSize:8,whiteSpace:"pre-wrap"}}>{m.text}</div>)}{chatLoading?<div style={{fontSize:8,color:"#7185A0"}}>Жауап дайындалуда...</div>:null}</div>:null}
              <form className="tq-chat" onSubmit={sendChatMessage}><input value={chatInput} onChange={(e)=>setChatInput(e.target.value)} placeholder="Сұрағыңызды жазыңыз..."/><button type="submit" disabled={chatLoading}>➤</button></form>
            </aside>
          </div>

          <div className="tq-bottom">
            <div className="tq-card"><div className="tq-head"><strong>Нарық жаңалықтары</strong><span className="tq-link">Барлығын көру</span></div><div className="tq-list">
              {hasNews?news.slice(0,4).map((item,i)=><a key={i} href={item?.url||"#"} target="_blank" rel="noopener noreferrer" className="tq-news" style={{textDecoration:"none",color:"inherit"}}><div className="tq-thumb">📰</div><div><div className="tq-news-title">{item?.headline||"Жаңалық"}</div><div className="tq-news-meta">{item?.source||""} · {formatNewsDate(item?.datetime)}</div></div></a>):<div className="tq-empty">Акция іздегеннен кейін жаңалықтар осы жерде шығады.</div>}
            </div></div>

            <div className="tq-card"><div className="tq-head"><strong>Скринер</strong><span className="tq-link">Барлығын көру</span></div><div className="tq-list"><table className="tq-table"><thead><tr><th>ТИКЕР</th><th>АТЫ</th><th>P/E</th><th>ӨСІМ</th></tr></thead><tbody>
              <tr><td>AMD</td><td>Advanced Micro Devices</td><td>18.35</td><td className="tq-up">+2.45%</td></tr><tr><td>INTC</td><td>Intel Corporation</td><td>15.42</td><td className="tq-up">+1.12%</td></tr><tr><td>CRM</td><td>Salesforce</td><td>19.81</td><td className="tq-up">+1.89%</td></tr><tr><td>QCOM</td><td>QUALCOMM</td><td>17.28</td><td className="tq-up">+1.73%</td></tr>
            </tbody></table></div></div>

            <div className="tq-card"><div className="tq-head"><strong>Менің портфелім</strong><span className="tq-link">Барлығын көру</span></div><div className="tq-portfolio">
              <div style={{fontSize:8,color:"#7387A2"}}>Жалпы құны</div><div className="tq-value">$152,560.45</div><div className="tq-up" style={{fontSize:9}}>+4.32% (6,321.45)</div><div className="tq-donut"></div>
              <div className="tq-holding"><span>AAPL</span><span>40.2%</span></div><div className="tq-holding"><span>MSFT</span><span>25.1%</span></div><div className="tq-holding"><span>NVDA</span><span>15.3%</span></div><div className="tq-holding"><span>AMZN</span><span>10.2%</span></div>
            </div></div>
          </div>
        </section>
      </div>

      <div className="tq-mobile">
        {tradeiqNav.slice(0,5).map((item)=><button key={item.label}><b>{item.icon}</b>{item.label}</button>)}
      </div>
    </main>
  );
}
