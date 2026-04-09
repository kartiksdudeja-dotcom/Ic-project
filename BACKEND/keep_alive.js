/**
 * ─── KEEP-ALIVE PINGER ────────────────────────────────────────────────────────
 * Sends a GET request to your Render app every 13 minutes to prevent it from
 * sleeping on the free tier.
 *
 * Usage:
 *   node keep_alive.js
 *
 * Or set your URL via environment variable:
 *   RENDER_URL=https://your-app.onrender.com node keep_alive.js
 * ─────────────────────────────────────────────────────────────────────────────
 */

require('dotenv').config();
const https = require('https');

// ── Config ────────────────────────────────────────────────────────────────────
const RENDER_URL   = process.env.RENDER_URL || 'https://your-app.onrender.com';
const PING_PATH    = '/health'; // Your existing health endpoint
const INTERVAL_MS  = 13 * 60 * 1000; // 13 minutes in milliseconds

// ── Helper: formatted timestamp ───────────────────────────────────────────────
function timestamp() {
  return new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour12: true,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

// ── Ping function ─────────────────────────────────────────────────────────────
function ping() {
  const url = `${RENDER_URL}${PING_PATH}`;

  console.log(`\n[${timestamp()}] 🏓 Pinging → ${url}`);

  const req = https.get(url, (res) => {
    let body = '';
    res.on('data', (chunk) => (body += chunk));
    res.on('end', () => {
      const status = res.statusCode;
      const emoji  = status === 200 ? '✅' : '⚠️';
      console.log(`[${timestamp()}] ${emoji} Response: HTTP ${status} — Server is awake.`);
    });
  });

  req.on('error', (err) => {
    // Handle errors gracefully — do NOT crash the loop
    console.error(`[${timestamp()}] ❌ Ping failed: ${err.message}`);
  });

  req.setTimeout(10000, () => {
    console.warn(`[${timestamp()}] ⏱️  Request timed out after 10s — server may be cold starting.`);
    req.destroy();
  });
}

// ── Start ─────────────────────────────────────────────────────────────────────
console.log('═══════════════════════════════════════════════');
console.log('   ICON TOWER — RENDER KEEP-ALIVE PINGER');
console.log(`   Target  : ${RENDER_URL}${PING_PATH}`);
console.log(`   Interval: Every 13 minutes`);
console.log('═══════════════════════════════════════════════');

// Ping immediately on start, then every 13 minutes
ping();
setInterval(ping, INTERVAL_MS);
