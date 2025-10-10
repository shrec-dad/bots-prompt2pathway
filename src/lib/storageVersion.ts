// src/lib/storageVersion.ts
const APP_SCHEMA_KEY = "app:schemaVersion";
const CURRENT_SCHEMA = 1; // bump when you change storage keys/shapes

function getV(): number {
  const raw = localStorage.getItem(APP_SCHEMA_KEY);
  return raw ? Number(raw) || 0 : 0;
}

export function ensureMigrations() {
  const v = getV();

  // v < 1  → example migrations (add real ones later)
  if (v < 1) {
    // Example: normalize old analytics key -> new
    // const old = localStorage.getItem("analytics:metrics");
    // if (old && !localStorage.getItem("analytics.metrics.v2")) {
    //   localStorage.setItem("analytics.metrics.v2", old);
    // }
  }

  localStorage.setItem(APP_SCHEMA_KEY, String(CURRENT_SCHEMA));
}
