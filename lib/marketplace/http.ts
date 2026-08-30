/* Client HTTP "poli" pour lire des pages publiques :
   - User-Agent navigateur, en-têtes FR
   - timeout + retries avec backoff
   - petit délai entre requêtes pour rester respectueux (rate limiting) */

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

let lastRequest = 0;
const MIN_GAP_MS = 700; // espace minimal entre deux requêtes sortantes (respectueux + évite le throttling)

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function politeFetch(
  url: string,
  opts: { timeoutMs?: number; retries?: number } = {}
): Promise<string> {
  const { timeoutMs = 25000, retries = 3 } = opts;

  // rythme minimal partagé
  const wait = MIN_GAP_MS - (Date.now() - lastRequest);
  if (wait > 0) await sleep(wait);
  lastRequest = Date.now();

  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": UA,
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
        },
        redirect: "follow",
        signal: ctrl.signal,
      });
      clearTimeout(t);
      if (res.status === 429 || res.status >= 500) {
        throw new Error(`HTTP ${res.status}`);
      }
      return await res.text();
    } catch (e) {
      clearTimeout(t);
      lastErr = e;
      if (attempt < retries) await sleep(1200 * (attempt + 1));
    }
  }
  throw new Error(`politeFetch a échoué pour ${url} : ${String(lastErr)}`);
}

/** Extrait tous les blocs JSON-LD (application/ld+json) d'une page. */
export function extractJsonLd(html: string): any[] {
  const out: any[] = [];
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    try {
      out.push(JSON.parse(m[1].trim()));
    } catch {
      /* bloc invalide ignoré */
    }
  }
  return out;
}
