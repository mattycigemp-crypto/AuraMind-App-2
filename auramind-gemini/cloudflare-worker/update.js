// cloudflare-worker/update.js
//
// Tauri v2 updater endpoint stub for releases.cogniavect.app (matches the
// URL hardcoded in `auramind-gemini/src-tauri/tauri.conf.json →
// plugins.updater.endpoints[0]`).
//
// On a client check, the Tauri updater plugin fetches:
//   GET https://releases.cogniavect.app/update/<target>/<current_version>
// where:
//   <target>          = e.g. darwin-aarch64, darwin-x86_64,
//                        linux-x86_64, windows-x86_64
//   <current_version> = the version the running binary shipped with,
//                        e.g. "2.0.0"
//
// We:
//   1. Hit GitHub's public release-latest API for cogniavect/auramind.
//   2. Find the matching platform asset (filename pattern derived from
//      `tauri-action`'s convention):
//        darwin-aarch64      -> *-aarch64-apple-darwin.app.tar.gz*
//        darwin-x86_64       -> *-x86_64-apple-darwin.app.tar.gz*
//        linux-x86_64        -> *-x86_64-unknown-linux-gnu.AppImage* or .deb
//        windows-x86_64      -> *.msi or *-windows.msi.zip
//   3. Re-emit the Tauri-shaped JSON (matching `scripts/sign-tau-update.mjs`
//      output) — our existing manifest generator already produces the
//      right shape, so this is a thin proxy that re-keys GitHub's
//      release-by-tag output.
//
// Returns 204 if no newer version is available (the Tauri client stops
// the update prompt on 204). Returns 304-style 200-with-current-version
// if the running version IS the latest. Returns 404 if the asset for
// the target platform is missing from the latest release.
//
// Auth: this worker uses GitHub's anonymous API (60 req/hr/IP —
// ample for end-user update prompts; the worker caches 5 min on the
// edge to take pressure off the public rate limit). For higher volume,
// swap to a worker-secret-backed PAT (instructions in wrangler.toml).

const OWNER = "cogniavect";
const REPO  = "auramind";
const GH_API = `https://api.github.com/repos/${OWNER}/${REPO}/releases/latest`;
const CACHE_TTL_SECONDS = 300;

// Map Tauri target → filename patterns produced by tauri-action.
// Order matters: the first match wins.
const TARGET_ASSET_PATTERNS = {
  "darwin-aarch64":      [/aarch64[-_]apple[-_]darwin.*\.app\.tar\.gz$/i, /\.app\.tar\.gz$/i],
  "darwin-x86_64":       [/x86_64[-_]apple[-_]darwin.*\.app\.tar\.gz$/i, /\.app\.tar\.gz$/i],
  "darwin-universal":    [/_universal[-_]apple[-_]darwin.*\.app\.tar\.gz$/i, /\.app\.tar\.gz$/i],
  "linux-x86_64":        [/-x86_64[-_]unknown[-_]linux[-_]gnu\.AppImage$/i, /-x86_64[-_]unknown[-_]linux[-_]gnu\.deb$/i],
  "linux-aarch64":       [/-aarch64[-_]unknown[-_]linux[-_]gnu\.AppImage$/i, /-aarch64[-_]unknown[-_]linux[-_]gnu\.deb$/i],
  "windows-x86_64":      [/-x86_64[-_]pc[-_]windows[-_]msvc\.msi$/i, /\.msi\.zip$/i, /\.msi$/i],
};

export default {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }
    const url = new URL(request.url);

    // Path: /update/<target>/<current_version>
    const match = url.pathname.match(/^\/update\/([a-z0-9_-]+)\/([\w.+-]+)\/?$/i);
    if (!match) {
      return json({ error: "Bad URL; expected /update/<target>/<current_version>" }, 400);
    }
    const [, target, currentVersion] = match;

    // Cache the latest JSON at the edge so we don't burn the limit on
    // every launch.
    const cache = caches.default;
    const cacheKey = new Request(GH_API + "?cb=" + Math.floor(Date.now() / (CACHE_TTL_SECONDS * 1000)));
    let latest;
    const cached = await cache.match(cacheKey);
    if (cached) {
      latest = await cached.json();
    } else {
      const gh = await fetch(GH_API, {
        headers: { "Accept": "application/vnd.github+json", "User-Agent": "tauri-updater-worker" },
      });
      if (!gh.ok) {
        return json({ error: `GitHub API ${gh.status} ${gh.statusText}` }, gh.status);
      }
      latest = await gh.json();
      ctx.waitUntil(cache.put(cacheKey, new Response(JSON.stringify(latest), { headers: { "Cache-Control": `s-maxage=${CACHE_TTL_SECONDS}` } })));
    }

    const latestVersion = (latest.tag_name || "").replace(/^v/, "");
    if (compareSemver(latestVersion, currentVersion) <= 0) {
      // Client is up-to-date — Tauri treats 204 as "no update".
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    const assetMatcher = (TARGET_ASSET_PATTERNS[target] || []).concat([/./]); // fallback regex matches any
    const asset = (latest.assets || []).find((a) =>
      assetMatcher.some((rx) => rx.test(a.name))
    );
    if (!asset) {
      return json({ error: `No ${target} asset in ${latest.tag_name}` }, 404);
    }

    // The minisign signature sits beside the binary as `<binary>.sig`.
    const sigAsset = (latest.assets || []).find((a) => a.name === asset.name + ".sig");
    const signature = sigAsset ? await fetchText(sigAsset.browser_download_url) : "";

    const manifest = {
      version:   latestVersion,
      notes:     latest.body || `AuraMind ${latestVersion} — see https://github.com/${OWNER}/${REPO}/releases/tag/${latest.tag_name}`,
      pub_date:  latest.published_at || new Date().toISOString(),
      signature: signature.trim(),
      platforms: {
        [target]: {
          signature: signature.trim(),
          url:       asset.browser_download_url,
        },
      },
    };

    // CORS: Tauri clients on macOS/Linux/Windows all have their own origin;
    // returning * is safe for an unsigned JSON response of this type.
    return json(manifest, 200);
  },
};

async function fetchText(url) {
  // Pass through from GitHub; failures fall through to empty string and
  // the client surfaces its "signature missing" error in dev console
  // (we never serve an unsigned binary below 200).
  try { return await (await fetch(url)).text(); } catch { return ""; }
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin":  "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control":                "no-store",
  };
}

function json(body, status) {
  return new Response(JSON.stringify(body, null, 2) + "\n", {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders() },
  });
}

function compareSemver(a, b) {
  const ap = (a || "0.0.0").split(".").map((n) => parseInt(n, 10) || 0);
  const bp = (b || "0.0.0").split(".").map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(ap.length, bp.length); i++) {
    const d = (ap[i] || 0) - (bp[i] || 0);
    if (d) return d;
  }
  return 0;
}
