\
export async function onRequestGet({request, env}) {
  if (!env.PHOTOS_BUCKET) return new Response("Storage not configured", {status:503});
  const key = new URL(request.url).searchParams.get("key") || "";
  if (!/^uploads\/(joy|us|travel|funny)\/[a-f0-9-]+\.(jpg|png|webp|gif)$/i.test(key)) return new Response("Not found", {status:404});
  const object = await env.PHOTOS_BUCKET.get(key);
  if (!object) return new Response("Not found", {status:404});
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("Cache-Control","private, no-store");
  headers.set("X-Content-Type-Options","nosniff");
  return new Response(object.body, {headers});
}
