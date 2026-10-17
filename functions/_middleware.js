const encoder = new TextEncoder();
const COOKIE_NAME = "tyiya_session";
const SESSION_SECONDS = 60 * 60 * 24 * 14;

function toBase64Url(bytes) {
  let binary = "";
  bytes.forEach(b => binary += String.fromCharCode(b));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function fromBase64Url(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - normalized.length % 4) % 4);
  return Uint8Array.from(atob(padded), c => c.charCodeAt(0));
}
async function sign(value, secret) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), {name:"HMAC",hash:"SHA-256"}, false, ["sign","verify"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value)));
}
async function validSession(token, secret) {
  if (!token || !secret) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  try {
    const payload = new TextDecoder().decode(fromBase64Url(parts[0]));
    const data = JSON.parse(payload);
    if (!data.exp || data.exp < Math.floor(Date.now()/1000)) return false;
    const expected = await sign(parts[0], secret);
    const actual = fromBase64Url(parts[1]);
    if (expected.length !== actual.length) return false;
    return crypto.subtle.timingSafeEqual ? crypto.subtle.timingSafeEqual(expected, actual) : expected.every((b,i)=>b===actual[i]);
  } catch (_) { return false; }
}
function getCookie(request, name) {
  const header = request.headers.get("Cookie") || "";
  const item = header.split(";").map(v=>v.trim()).find(v=>v.startsWith(name+"="));
  return item ? decodeURIComponent(item.slice(name.length+1)) : "";
}
function cookie(value, maxAge) {
  return `${COOKIE_NAME}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
}
export async function onRequest({request, env, next}) {
  const url = new URL(request.url);
  if (!env.ALBUM_PASSWORD || !env.SESSION_SECRET) {
    return new Response("Настройте секреты ALBUM_PASSWORD и SESSION_SECRET в Cloudflare Pages.", {status:503, headers:{"Content-Type":"text/plain; charset=utf-8"}});
  }
  if (url.pathname === "/login" && request.method === "POST") {
    let body;
    try { body = await request.json(); } catch (_) { return new Response("Bad request", {status:400}); }
    const submitted = String(body.password || "");
    if (submitted.length > 500 || submitted !== env.ALBUM_PASSWORD) {
      return new Response("Unauthorized", {status:401, headers:{"Cache-Control":"no-store"}});
    }
    const payload = toBase64Url(encoder.encode(JSON.stringify({exp:Math.floor(Date.now()/1000)+SESSION_SECONDS})));
    const signature = toBase64Url(await sign(payload, env.SESSION_SECRET));
    return new Response("OK", {status:200, headers:{
      "Set-Cookie":cookie(`${payload}.${signature}`, SESSION_SECONDS),
      "Cache-Control":"no-store"
    }});
  }
  if (url.pathname === "/login.html" || url.pathname === "/styles.css") return next();
  const token = getCookie(request, COOKIE_NAME);
  if (!(await validSession(token, env.SESSION_SECRET))) {
    return new Response(null, {status:302, headers:{"Location":"/login.html","Cache-Control":"no-store"}});
  }
  const response = await next();
  const headers = new Headers(response.headers);
  headers.set("Cache-Control","private, no-store");
  return new Response(response.body, {status:response.status, statusText:response.statusText, headers});
}
