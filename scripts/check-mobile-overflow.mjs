import { spawn } from "node:child_process";
const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", ["--headless=new", "--remote-debugging-port=9333", "--user-data-dir=" + process.argv[2] + "/chrome-prof", "about:blank"], { stdio: "ignore" });
await new Promise((r) => setTimeout(r, 2500));
const targets = await (await fetch("http://127.0.0.1:9333/json")).json();
const ws = new WebSocket(targets.find((t) => t.type === "page").webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = new Map();
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d.result); pending.delete(d.id); } };
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
// usage: node check-mobile-overflow.mjs <scratch dir> <base url> <route> [route...]
const base = process.argv[3] ?? "http://localhost:3000";
const routes = process.argv.slice(4).length ? process.argv.slice(4) : ["/"];
for (const r of routes) {
  await send("Page.navigate", { url: base + r });
  await new Promise((res) => setTimeout(res, 3500));
  const { result } = await send("Runtime.evaluate", { returnByValue: true, expression: `(() => {
    const W = document.documentElement.clientWidth; const out = [];
    for (const el of document.querySelectorAll("main *")) { const b = el.getBoundingClientRect(); if (b.right > W + 1 && b.width > 0) { let p = el.parentElement, clipped = false; while (p && p !== document.body) { const cs = getComputedStyle(p); if (/(auto|scroll|hidden|clip)/.test(cs.overflowX) && p.getBoundingClientRect().right <= W + 1) { clipped = true; break; } p = p.parentElement; } if (!clipped) out.push(el.tagName.toLowerCase() + "." + String(el.className?.baseVal ?? el.className).split(" ").slice(0,4).join(".") + " r=" + Math.round(b.right) + " " + (el.textContent||"").trim().slice(0,40)); } }
    return { W, sw: document.documentElement.scrollWidth, n: out.length, top: out.slice(0, 4) };
  })()` });
  console.log(r, JSON.stringify(result.value));
}
chrome.kill();
process.exit(0);
