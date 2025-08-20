// src/utils/compare.js
export function sliceCompare(entries, days) {
  if (!entries?.length) return { current: [], prev: [] };
  const cur = entries.slice(-days);
  const prev = entries.slice(-(days * 2), -days);
  return { current: cur, prev };
}

export function avg(arr, pick) {
  if (!arr.length) return null;
  const vals = arr.map(pick).map((n) => Number(n) || 0);
  return vals.length ? vals.reduce((a,b)=>a+b,0) / vals.length : null;
}

export function diffPct(a, b) {
  if (a == null || b == null) return null;
  if (b === 0) return null;
  return ((a - b) / Math.abs(b)) * 100;
}