const STORAGE_KEY = "noghai_watchlist";

export function getWatchlist() {
  if (typeof window === "undefined") return [];
  try {
    var raw = window.localStorage.getItem(STORAGE_KEY);
    var arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    return [];
  }
}

export function addToWatchlist(symbol) {
  if (typeof window === "undefined") return;
  var list = getWatchlist();
  var upper = symbol.toUpperCase();
  if (!list.includes(upper)) {
    list.push(upper);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }
}

export function removeFromWatchlist(symbol) {
  if (typeof window === "undefined") return;
  var list = getWatchlist().filter(function (s) {
    return s !== symbol.toUpperCase();
  });
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function isInWatchlist(symbol) {
  return getWatchlist().includes((symbol || "").toUpperCase());
}
