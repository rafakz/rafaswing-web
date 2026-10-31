"use client";

import { useEffect, useRef } from "react";
import { createChart, ColorType } from "lightweight-charts";
import { color, font } from "../lib/theme";

export default function ProChart({ chartData }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !chartData || chartData.length === 0) return;

    // 1. Деректерді lightweight-charts форматына келтіру (date -> time), сұрыптау
    const formatted = chartData
      .filter((d) => (d.date || d.time) && d.open && d.high && d.low && d.close)
      .map((d) => {
        let time = d.date || d.time;
        if (typeof time === "string" && time.includes("T")) time = time.split("T")[0];
        return {
          time,
          open: Number(d.open),
          high: Number(d.high),
          low: Number(d.low),
          close: Number(d.close),
        };
      })
      .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

    if (formatted.length === 0) return;

    // 2. График
    const chart = createChart(el, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: color.textMuted,
        fontFamily: font.family,
      },
      grid: {
        vertLines: { color: color.borderSoft },
        horzLines: { color: color.borderSoft },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: color.border,
      },
      rightPriceScale: {
        borderColor: color.border,
      },
      width: el.clientWidth,
      height: 250,
    });

    // 3. Шамдар: өсу — gainStrong, құлау — loss (theme.js)
    const series = chart.addCandlestickSeries({
      upColor: color.gainStrong,
      downColor: color.loss,
      borderVisible: false,
      wickUpColor: color.gainStrong,
      wickDownColor: color.loss,
    });

    // 4. Деректерді салу
    try {
      series.setData(formatted);
      chart.timeScale().fitContent();
    } catch (e) {
      console.error("График деректерін жүктеу қатесі:", e);
    }

    const handleResize = () => {
      chart.applyOptions({ width: el.clientWidth });
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [chartData]);

  return (
    <div style={{ position: "relative", width: "100%", height: 250 }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
