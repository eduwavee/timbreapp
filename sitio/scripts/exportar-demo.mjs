// Saca una foto fija de lo publicado en la API para el modo demo de Brunito (sin servidor):
// los datos van a src/data/demo.json y las fotos a public/demo/.
// Uso, con la API corriendo: npm run demo:exportar (toma LARAVEL_API_URL o http://127.0.0.1:8000/api).
import { mkdir, rm, writeFile } from "node:fs/promises";

const API = process.env.LARAVEL_API_URL || "http://127.0.0.1:8000/api";
const ROOT = new URL("..", import.meta.url);

async function get(path) {
  const res = await fetch(`${API}/site/${path}`, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`La API respondió ${res.status} en ${path}`);
  return res.json();
}

const photos = new Map();
function toLocal(url) {
  const path = `/demo/${new URL(url).pathname.replace(/^\/storage\//, "")}`;
  photos.set(path, url);
  return path;
}

const meta = await get("meta");
// Sin filtros y en el orden de la API (recientes, las reservadas al final): el modo demo lo respeta.
const { data: summaries } = await get("listings?limit=60");
const listings = [];
for (const { slug } of summaries) {
  const { data } = await get(`listings/${encodeURIComponent(slug)}`);
  listings.push({
    ...data,
    cover: data.cover && { ...data.cover, url: toLocal(data.cover.url) },
    photos: data.photos.map((p) => ({ ...p, url: toLocal(p.url) })),
  });
}

await rm(new URL("public/demo/", ROOT), { recursive: true, force: true });
for (const [path, url] of photos) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`No se pudo bajar ${url} (${res.status})`);
  const file = new URL(`public${path}`, ROOT);
  await mkdir(new URL(".", file), { recursive: true });
  await writeFile(file, Buffer.from(await res.arrayBuffer()));
}

await writeFile(new URL("src/data/demo.json", ROOT), `${JSON.stringify({ exported_at: new Date().toISOString(), meta, listings }, null, 2)}\n`);
console.log(`Demo exportada: ${listings.length} publicaciones y ${photos.size} fotos.`);
