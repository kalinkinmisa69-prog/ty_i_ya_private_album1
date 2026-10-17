\
const allowedAlbums = new Set(["joy", "us", "travel", "funny"]);
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
export async function onRequestPost({request, env}) {
  if (!env.PHOTOS_BUCKET) return Response.json({error:"Storage is not configured"}, {status:503});
  const form = await request.formData();
  const file = form.get("file");
  const album = String(form.get("album") || "");
  const caption = String(form.get("caption") || "").slice(0,180);
  const date = String(form.get("date") || "").slice(0,60);
  const author = String(form.get("author") || "kot");
  if (!new Set(["kot", "her"]).has(author)) return Response.json({error:"Invalid author"}, {status:400});
  if (!(file instanceof File) || !allowedAlbums.has(album) || !allowedTypes.has(file.type)) {
    return Response.json({error:"Invalid upload"}, {status:400});
  }
  if (file.size < 1 || file.size > 8 * 1024 * 1024) return Response.json({error:"File too large"}, {status:413});
  const ext = ({ "image/jpeg":"jpg", "image/png":"png", "image/webp":"webp", "image/gif":"gif" })[file.type];
  const key = `uploads/${album}/${crypto.randomUUID()}.${ext}`;
  await env.PHOTOS_BUCKET.put(key, await file.arrayBuffer(), {
    httpMetadata: {contentType:file.type, cacheControl:"private, no-store"},
    customMetadata: {album, caption, date, author}
  });
  return Response.json({url:`/api/photo?key=${encodeURIComponent(key)}`, album, caption, date, author}, {headers:{"Cache-Control":"no-store"}});
}
