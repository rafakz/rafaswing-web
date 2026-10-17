"use client";

import { useEffect, useRef } from "react";
import { createChart, ColorType } from "lightweight-charts";

export default function ProChart({ chartData }) {
  const chartContainerRef = useRef();

  useEffect(() => {
    if (!chartContainerRef.current || !chartData || chartData.length === 0) return;

    // 1. Деректерді lightweight-charts форматына бейімдеу (date -> time) және реттеу
    const formattedData = chartData
      .filter(d => (d.date || d.time) && d.open && d.high && d.low && d.close) // Бос деректерді алып тастау
      .map(d => {
        let timeVal = d.date || d.time;
        // Егер уақыт "2026-10-17T00:00:00Z" форматында болса, тек күнін аламыз
        if (typeof timeVal === 'string' && timeVal.includes('T')) {
          timeVal = timeVal.split('T')[0];
        }
        return {
          time: timeVal,
          open: Number(d.open),
          high: Number(d.high),
          low: Number(d.low),
          close: Number(d.close)
        };
      })
      // Күндерді ескіден жаңаға қарай реттеу (кітапхана соны талап етеді)
      .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

    if (formattedData.length === 0) return;

    const handleResize = () => {
      chart.applyOptions({ width: chartContainerRef.current.clientWidth });
    };

    // 2. Графикті құру
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#9ca3af",
      },
      grid: {
        vertLines: { color: "rgba(255, 255, 255, 0.05)" },
        horzLines: { color: "rgba(255, 255, 255, 0.05)" },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: "rgba(255, 255, 255, 0.1)",
      },
      rightPriceScale: {
        borderColor: "rgba(255, 255, 255, 0.1)",
      },
      width: chartContainerRef.current.clientWidth,
      height: 250,
    });

    // 3. Жапон шамдарын баптау
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: "#10b981",       
      downColor: "#ef4444",     
      borderVisible: false,
      wickUpColor: "#10b981",   
      wickDownColor: "#ef4444", 
    });

    // 4. Дайын деректерді салу
    try {
      candlestickSeries.setData(formattedData);
      chart.timeScale().fitContent(); // Графикті терезеге сыйдыру
    } catch (e) {
      console.error("График деректерін жүктеу қатесі:", e);
    }

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [chartData]);

  return (
    <div style={{ position: "relative", width: "100%", height: "250px" }}>
      <div ref={chartContainerRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
