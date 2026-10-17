\
export async function onRequestGet({env}) {
  if (!env.PHOTOS_BUCKET) return Response.json({photos:[]}, {headers:{"Cache-Control":"no-store"}});
  const listed = await env.PHOTOS_BUCKET.list({prefix:"uploads/", limit:1000});
  const photos = [];
  for (const object of listed.objects) {
    const item = await env.PHOTOS_BUCKET.get(object.key);
    if (!item) continue;
    const meta = item.customMetadata || {};
    const filename = object.key.split("/").pop();
    photos.push({
      key: object.key,
      album: meta.album || "",
      caption: meta.caption || "",
      date: meta.date || "",
      author: meta.author || "",
      url: `/api/photo?key=${encodeURIComponent(object.key)}`
    });
  }
  return Response.json({photos}, {headers:{"Cache-Control":"private, no-store"}});
}
