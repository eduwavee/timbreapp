/** Pasa a minúsculas, sin tildes, y junta los grupos de dígitos ("30.123.456" → "30123456", "11 0000-1234" → "1100001234"). */
function fold(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/(\d)[\s.\-]+(?=\d)/g, "$1");
}

/** Cada palabra de la búsqueda tiene que aparecer en alguno de los campos, en cualquier orden. */
export function matches(term: string, ...fields: (string | number | null | undefined)[]) {
  const words = fold(term).split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const haystack = fold(fields.filter((f) => f !== null && f !== undefined).join(" "));
  return words.every((w) => haystack.includes(w));
}

/** Lo último agregado o editado primero. Los empates (por ejemplo, los datos cargados juntos) conservan el orden de la API. */
export function recentFirst<T extends { updated_at: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at));
}
