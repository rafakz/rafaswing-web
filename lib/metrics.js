/* Бар chartData-дан есептелетін көрсеткіштер (/api/stock өзгертуді қажет етпейді).
   chartData: [{ date, open, high, low, close, volume, ... }], ескіден жаңаға қарай. */

/* ATR (Average True Range): соңғы period күндегі бір күндік орташа қозғалыс (USD). */
export function computeAtr(chartData, period = 14) {
  if (!Array.isArray(chartData)) return null;
  const rows = chartData.filter(
    (d) => d && [d.high, d.low, d.close].every((v) => typeof v === "number" && !isNaN(v))
  );
  if (rows.length < period + 1) return null;

  const trs = [];
  for (let i = 1; i < rows.length; i++) {
    const h = rows[i].high;
    const l = rows[i].low;
    const prevClose = rows[i - 1].close;
    trs.push(Math.max(h - l, Math.abs(h - prevClose), Math.abs(l - prevClose)));
  }
  const last = trs.slice(-period);
  return last.reduce((a, b) => a + b, 0) / last.length;
}

/* Орташа көлем: соңғы period күндегі күндік орташа сатылым саны. */
export function avgVolume(chartData, period = 20) {
  if (!Array.isArray(chartData)) return null;
  const vols = chartData
    .map((d) => (d ? d.volume : null))
    .filter((v) => typeof v === "number" && !isNaN(v) && v > 0);
  if (vols.length < 2) return null;
  const last = vols.slice(-period);
  return last.reduce((a, b) => a + b, 0) / last.length;
}
