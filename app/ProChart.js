"use client";

import { useEffect, useRef } from "react";
import { createChart, ColorType } from "lightweight-charts";

export default function ProChart({ chartData }) {
  const chartContainerRef = useRef();

  useEffect(() => {
    // Егер контейнер немесе деректер жоқ болса, ештеңе істемейміз
    if (!chartContainerRef.current || !chartData || chartData.length === 0) return;

    const handleResize = () => {
      chart.applyOptions({ width: chartContainerRef.current.clientWidth });
    };

    // 1. Графиктің дизайнын баптау (Неон / Dark Mode стилі)
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#9ca3af", // Сұр мәтін (уақыт пен баға)
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
      height: 250, // Графиктің биіктігі
    });

    chart.timeScale().fitContent();

    // 2. Жапон шамдарының сериясын қосу (Жасыл/Қызыл түстер)
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: "#10b981",       // Өсу (Жасыл)
      downColor: "#ef4444",     // Түсу (Қызыл)
      borderVisible: false,
      wickUpColor: "#10b981",   // Жоғарғы көлеңкесі
      wickDownColor: "#ef4444", // Төменгі көлеңкесі
    });

    // Деректерді форматтау (API-ден келетін деректерді тексеру)
    // chartData мынадай форматта болуы керек: [{ time: '2026-10-17', open: 150, high: 155, low: 149, close: 152 }, ...]
    try {
      candlestickSeries.setData(chartData);
    } catch (e) {
      console.error("График деректерін жүктеу қатесі:", e);
    }

    window.addEventListener("resize", handleResize);

    // Компонент жойылғанда графикті тазалау
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
