# STONKS — Portfolio Tracker

A real-time portfolio tracker for stocks, crypto, and commodities that runs entirely in your browser as a single HTML file. No server, no build tools, no dependencies — just open `index.html` and go.

**[Open App](https://gdy.github.io/PortfolioTracker/)** · [![Live Demo](https://img.shields.io/badge/demo-GitHub%20Pages-blue)](https://gdy.github.io/PortfolioTracker/)
![Zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)
![Single file](https://img.shields.io/badge/single-file-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## Features

### Real-Time Market Data
- **WebSocket streaming** — real-time trade-by-trade price updates for stocks via FinnHub WebSocket (up to 50 symbols on the free tier). No proxy needed — bypasses CORS entirely. Auto-reconnects on disconnect. Renders are debounced via `requestAnimationFrame` for smooth performance under high-frequency trades. A green **● Live** badge appears in the toolbar when streaming is active; if the socket is connected but no trades have arrived for 60+ seconds during active market hours (a common symptom of a FinnHub free-plan restriction on realtime US equities), the badge flips to amber **● Live (no data)** with an explanatory tooltip — REST polling continues in the background either way.
- **Multi-source price fetching** — fetches from Yahoo Finance, FinnHub, Alpaca Markets, Financial Modeling Prep, Stooq, CoinGecko, Coinbase Exchange, and CoinCap simultaneously, picks the source with the most coverage, and fills individual missing fields from secondary sources. Three of the eight sources (Stooq, CoinGecko, Coinbase) are completely keyless, so the no-API-key path has its own redundant primary + fallback chain instead of depending on Yahoo's proxy fleet alone.
- **Automatic source fallback** — if one API is down or rate-limited, data is pulled from the next available source automatically, with no user action required.
- **Auto-refresh** — configurable polling intervals (2s / 3s / 5s / 10s / 15s / 30s / 60s). REST polling always runs on the selected interval during active market hours, regardless of WebSocket state — WS ticks supplement the table with real-time prices between polls, and a stale or restricted WS stream never freezes the table. Overlapping refreshes are prevented by a `refreshInProgress` guard, so a short interval on a slow network simply skips a tick instead of stacking requests. At aggressive intervals (2–5 s) on portfolios with many stocks, when the heavy refresh is mid-flight on a tick boundary the app fires a lightweight crypto-only update instead — so BTC/ETH stay on the user's chosen interval while stocks update at the heavy refresh's natural pace.
- **Three-phase refresh scheduling** — during active market hours (4 AM–8 PM ET weekdays) all sources are polled; outside those hours, only crypto and commodity positions (24/7 markets) are refreshed on a lightweight path; on weekends, auto-refresh pauses unless you hold crypto or commodities. Switching portfolios aborts any in-flight refresh to avoid stale data bleeding across portfolios.
- **Pre-market and after-hours pricing** — displayed inline per row with change indicators. Sourced from Yahoo Finance v7 batch (one proxy call for all symbols), with a v8 chart candle fallback for any symbols not covered. Correctly handles the 2 AM overnight case where Yahoo's `currentTradingPeriod` points to the next session.
- **Price flash animations** — green/red flashes on price changes (from both WebSocket updates and polling). WebSocket updates use targeted in-place DOM patching to avoid disrupting fields being edited.
- **Source attribution** — the status bar shows which data sources are active and whether WebSocket streaming is live (e.g. "Data via FinnHub + CoinGecko | WS streaming").
- **Smart CORS proxy rotation** — 6 proxy endpoints with automatic failover, last-working-proxy memory, and validation of proxy error responses (rejects HTML pages, rate-limit strings, and proxy-specific JSON error bodies before accepting a response).

### Portfolio Management
- **30+ data columns** — last price, $ change, % change, after-hours, quantity, cost basis, purchase date, market value, day P&L, dividend/yield, ex-div date, next earnings, YTD/6M/1Y performance, total P&L, P&L %, previous close, open, bid, ask, day range, 52-week range, volume, avg volume, market cap, P/E, EPS, beta, **analyst rating** (Strong Buy / Buy / Hold / Sell / Strong Sell consensus from FinnHub `/stock/recommendation` with a Yahoo `financialData` fallback — color-tinted by score; click the cell to open a popover showing the 1–5 score on a green-to-red scale and a stacked breakdown bar of the Strong Buy / Buy / Hold / Sell / Strong Sell counts with source attribution and reporting period), notes
- **Multiple portfolios** — switch between unlimited named portfolios (e.g. "Long-term", "Trading", "Crypto") via the portfolio bar above the toolbar. Create, rename, and delete portfolios on the fly. Each portfolio has its own positions, notes, fetch caches, and undo history. The active portfolio is remembered across sessions.
- **Inline editing** — click any quantity, cost basis, date, or notes field to edit directly in the table. Changes are saved instantly.
- **Drag-to-reorder** — grab any row in the desktop table or any mobile card (via the ☰ handle) to manually rearrange positions. Switching to a sorted column disables manual order; clearing the sort restores it.
- **Column visibility toggle** — click **Columns** in the toolbar to hide/show any of the 30+ columns. Essential fields (symbol, name, price, change, quantity, cost basis) are locked and cannot be hidden. Selection is persisted to localStorage.
- **Drag-to-reorder columns** — grab any column header in the desktop table to rearrange columns directly, or use the drag handles in the **Columns** picker. Order is persisted per browser; use **Reset Order** in the picker to restore the default.
- **Allocation pie chart** — toggleable SVG pie chart showing percentage allocation by symbol, sorted largest first, with a 24-color palette tuned for dark backgrounds (mostly cool tones with warm accents interleaved for distinction at 20+ positions). Click **Show Chart** in the summary bar to show/hide; updates live as prices change.
- **Price alerts** — set above/below price thresholds per symbol. A 🔔 icon appears next to alerted symbols; rows pulse when triggered. Browser notifications fire on threshold cross (requires notification permission — the bell tooltip shows current permission status). Set from the symbol bell on desktop or the Alert fields in the mobile expanded card.
- **Export CSV** — one-click download of the current portfolio as CSV (filename includes the portfolio name and date), respecting your current sort order.
- **Export / Import settings** — save and restore your API keys, column visibility, column order, price alerts, and refresh preferences as a JSON file. Found in the Settings panel.
- **Share via URL** — generate a shareable URL containing your portfolio (symbols, shares, cost basis, dates) encoded in the hash (up to 99 positions). Recipients are prompted before any positions replace their current portfolio. Shared symbols are sanitized and length-validated on import.
- **Undo / Redo** — `Ctrl+Z` / `Ctrl+Y` (or `Ctrl+Shift+Z`) undoes and redoes any portfolio change: add, remove, edit shares/cost/date, import, reorder, or clear all. Up to 50 levels of history. Visible **Undo** and **Redo** buttons in the toolbar auto-enable/disable as the stacks change, so the feature is discoverable without needing the shortcut.
- **Short selling** — negative share quantities track short positions with correct P&L math.
- **Per-position notes** — free-text notes column for each ticker.
- **Purchase date tracking** — records when each position was opened, sortable and editable inline.
- **Summary bar** — total market value, day P&L, total P&L, total P&L %, and position count across the whole portfolio.
- **Estimated bid/ask** — when real bid/ask data isn't available from Alpaca, estimates are computed from the last trade price with a spread appropriate for the price range (marked with `~` and dimmed).
- **Name tooltips** — hover truncated company names to see the full name.

### Import System
- **CSV import** from major brokerages:
  - Robinhood · E\*Trade · Fidelity · Charles Schwab · Webull · Vanguard
- **Auto-detects column headers** — maps Symbol, Shares/Quantity, Cost Basis (per-share or total), Purchase Date, Last Price, and Type/Side automatically.
- **Drag-and-drop** — drop a `.csv` file directly onto the import modal.
- **Paste support** — paste CSV data directly into the text area.
- **Simple CSV** — also accepts `Symbol, Shares, Cost, Date` with no headers.
- **Live preview** — parsed positions are shown in real time as you type or drop a file, with column mapping diagnostics.
- **Short detection** — recognises negative shares or `Short` / `Sell` / `Sell Short` in a Type column.
- **Smart merging** — duplicate symbols are merged by side. Two long lots (or two short lots) are combined with a weighted-average cost basis. A long lot imported on top of an existing short position (or vice versa) is treated as a closing trade: the remaining side keeps its cost basis instead of mixing long and short prices into a meaningless average.
- **Price seeding** — imported last prices display immediately before APIs respond.

### Asset Classes
| Type | Ticker format | Data source |
|------|--------------|-------------|
| Stocks | `AAPL`, `MSFT`, … | Yahoo Finance, FinnHub, Alpaca, FMP |
| Crypto | `BTC`, `ETH`, `SOL` … (auto-maps to `BTC-USD`) | CoinGecko (direct CORS, no proxy) |
| Commodity futures | `GOLD`, `OIL`, `SILVER` … (auto-maps to `GC=F`) | Yahoo Finance v8 chart (via CORS proxy) |

Commodity futures symbols containing `=` are handled carefully: `=` is kept raw in URL path segments (`yfPath`) but percent-encoded in query string parameters (`yfEnc`) to avoid ambiguity. Commodities that fail on the initial fetch are automatically retried by the main commodity retry pass (using an alternate Yahoo CDN domain) and a deferred background retry that staggers requests across proxies with a 1.5-second initial delay (± 400 ms jitter) to let rate limits recover and to desynchronize concurrent users after a proxy fleet hiccup.

### Sorting & UI
- **Click any column header to sort** — ascending/descending toggle with a sort indicator arrow.
- **Sticky headers** — column headers stay visible while scrolling horizontally.
- **Keyboard shortcuts** — `Tab` moves between toolbar inputs (ticker → shares → cost → date); `Enter` adds a position; `Ctrl+Z` / `Ctrl+Y` undo/redo; `?` opens the keyboard shortcuts help overlay; `Esc` closes overlays.
- **Dark theme** — terminal-style monospace UI with `color-scheme: dark` applied at the root so native browser widgets (date picker, scrollbars) match the theme.

### Accessibility
- **Colorblind-safe P&L** — every gain/loss cell shows a subtle ▲ / ▼ glyph in addition to the green/red tint, so direction is readable without color perception.
- **Screen-reader hooks** — the status bar, summary bar, and live indicator are `aria-live="polite"` regions, so price and status changes are announced automatically. The main table carries an `aria-label`, and every icon-only toolbar button (New/Rename/Delete portfolio, Undo, Redo, Refresh, Import, Export, Columns, Settings, Share, Clear All) has an explicit `aria-label`.
- **Keyboard focus ring** — a high-contrast `:focus-visible` outline makes keyboard navigation obvious against the dark theme while staying invisible for mouse clicks.

### Mobile Responsive
- **Card view** — on screens ≤768px, the data table is replaced with a tap-to-expand card layout. Each card shows symbol, name, price, change, shares, and cost at a glance. Tapping a card expands it to reveal all 30+ data fields, inline editing for quantity/cost/date/notes/alerts, and a delete button.
- **Sortable cards** — a sort dropdown above the cards lets you sort by any field, with an ascending/descending toggle button.
- **Drag-to-reorder cards** — long-press the ☰ handle on any card to drag it to a new position. The handle hides automatically when sorting is active.
- **Pull-to-refresh** — pull down on the card list to trigger a data refresh.
- **No iOS zoom** — all inputs use ≥16px font size to prevent Safari's auto-zoom on focus.
- **Safe areas** — padding adapts to notched devices (iPhone X+) via `env(safe-area-inset-*)`.
- **Toolbar** — stacks into a 2-column grid with descriptive placeholders; action buttons wrap responsively.
- **Full-screen import** — import modal fills the viewport on mobile for easier CSV paste and file drop.
- **Extra-small breakpoint** at 380px for iPhone SE.

---

## Data Sources

| Source | Key required | Rate limit | What it provides |
|--------|-------------|-----------|-----------------|
| Yahoo Finance | No | Via CORS proxies | Quotes (v7 batch → v8 chart → v6 fallback), quoteSummary fundamentals, after-hours/pre-market, historical performance (YTD/6M/1Y) |
| FinnHub | Free key (required for WS) | 60 req/min REST + WebSocket | Real-time WebSocket streaming (stocks only), REST quotes, profiles, P/E, EPS, beta, dividends, earnings dates, 52-week performance, analyst recommendations |
| Alpaca Markets | Free key | 200 req/min | Real-time IEX snapshots, real bid/ask, avg volume, 52-week range from historical bars |
| Financial Modeling Prep | Free key | 250 req/day | Quotes with after-hours data, fundamentals |
| Stooq | No | Generous (CSV mirror) | Keyless backup for US stocks (`AAPL` → `aapl.us`) and commodity futures (`GC=F` → `gc.f`). Single batched CSV call covers the whole portfolio, ~15 min delayed. Tries direct CORS first; falls through to the proxy fleet if blocked. Critical for the no-key path — gives stocks a redundant source that doesn't share Yahoo's proxy fragility. |
| CoinGecko | No | ~30 req/min | Crypto 24h high/low, market cap, volume; 1-year chart for 52-week range and YTD/6M/1Y performance |
| Coinbase Exchange | No | 10 req/s | Real-time crypto price/bid/ask overlay — patched on top of CoinGecko on every refresh tick so BTC/ETH actually move on a 2–5 s interval instead of waiting for CoinGecko's free-tier 30–60 s server-side update cycle |
| CoinCap | No | 200 req/min | Automatic crypto fallback when the Coinbase circuit breaker trips (3 consecutive all-fails → 30 s cooldown). Keeps crypto prices ticking even during a Coinbase Exchange outage. Direct CORS, batched call, no auth. |

### API Call Strategy

**Proxy efficiency** — Yahoo Finance requests go through CORS proxies. The code uses a single rotating proxy list (`lastWorkingProxy` cache) with HTML-page, rate-limit-string, and proxy-error-JSON detection to skip bad responses. Proxy-dependent tasks (fundamentals, performance history) run sequentially to avoid saturating the shared proxy pool, while direct-CORS tasks (Alpaca, CoinGecko) run in parallel:
- Performance history (YTD/6M/1Y): processed one symbol at a time with configurable gaps
- Commodity retry: staggered in the main pass; deferred background retry with overlap prevention via `AbortController`
- FinnHub free quotes: 200 ms between symbols, stops on HTTP 429

**Yahoo crumb** — fetched once and cached for 30 minutes (crumbs expire ~30 min). Automatically refreshed on expiry rather than failing silently with stale auth.

**Yahoo v7 batch** — tried first for all symbols in one proxy request. If it fails, a 3-minute cooldown prevents permanently falling back to the slower per-symbol v8 path. After the cooldown, v7 is retried automatically.

**`fundamentalsCache` skip** — `fillFundamentals` skips symbols whose FinnHub fundamentals cache already contains P/E, beta, and market cap, avoiding redundant quoteSummary proxy calls.

**FinnHub fundamentals** — fetched once per symbol per session (profile + metrics + earnings + dividend + recommendation) and cached in `fundamentalsCache`. Per-refresh calls are only the lightweight `/quote` endpoint.

**Fast new-ticker fetch** — when a position is added, `fetchOneSymbolNow` races three independent paths in parallel and applies whichever resolves first with a valid price: FinnHub `/quote` (direct CORS, ~200–500 ms when keyed), Alpaca snapshot (direct CORS, ~300–700 ms when keyed), and Yahoo v8 chart (proxied, ~1–3 s; the only path that covers commodity futures and tickers the others miss). The new row appears in the table the same tick it's added — `bumpPortfolioVersion()` runs synchronously in `savePortfolio` so `getSortedPortfolio`'s cache invalidates immediately, ahead of the 250 ms localStorage-write debounce. Right after the price lands, a background fundamentals warmer fires the same 5 parallel FinnHub endpoints that `refreshAll` would eventually run — minus the inter-batch delays — so PE / EPS / beta / market cap / analyst rating arrive in ~700 ms–1.5 s instead of waiting for the next refresh cycle. Guarded by `_fundamentalsWarmInFlight` and an early-bail check on `fetchedFundamentals` so it can never double-fetch with the refresh path.

**CoinGecko + Coinbase overlay** — CoinGecko's free `/coins/markets` payload is updated server-side only every 30–60 s, so polling it more often returns the same data. We layer Coinbase Exchange's public ticker on top: CoinGecko provides the slow-changing 24h high/low, market cap, and volume (cached locally with a TTL that scales to portfolio size — 3 s floor for ≤ 5 cryptos, 30 s for larger portfolios), and Coinbase's real-time `/products/{sym}/ticker` endpoint patches the price, bid, and ask on every refresh tick. Coinbase product IDs match our `BTC-USD` symbol format directly; per-symbol failures (coin not listed on Coinbase Exchange) silently leave the CoinGecko price in place. The CoinGecko TTL also subtracts a 1 s alignment buffer so the cache reliably expires before the next refresh tick fires (without it, response latency would push the cache past the tick boundary and skip every other fetch). Coinbase fetches use a 1.5 s timeout, a 1 s per-symbol cache to dedupe rapid-fire calls, and a circuit breaker that skips the overlay for 30 s after 3 consecutive all-symbol failures so a Coinbase outage can't permanently add latency to every refresh tick.

**Crypto-only fast tick** — at aggressive refresh rates (2–5 s) on portfolios with many stocks, the heavy `refreshAll` fan-out (Yahoo via proxy, FinnHub `/quote` batches, Alpaca, FMP) can take 2–4 s. Without help, that means a 2 s setting effectively becomes the slowest source's pace and BTC/ETH stall. The auto-refresh tick checks `refreshInProgress` — if a heavy refresh is mid-flight on a tick boundary, it fires a lightweight crypto-only update (`refreshCryptoOnly`) instead of stacking another full refresh. Crypto then keeps ticking on the user's chosen interval while stocks update at the heavy refresh's natural pace. `/coins/markets` is used for prices + 24h data; `/coins/{id}/market_chart?days=365` is used once per crypto symbol for 52-week range and performance metrics (with 1.5 s between requests).

**Jittered deferred retry** — when every primary data source fails (typical sign of a public CORS proxy fleet hiccup), the app schedules a single retry ~8 s later, with ±2 s of randomness so concurrent users don't all retry on the exact same tick and stack a thundering herd back onto the recovering proxies. The deferred commodity retry uses the same pattern with ±400 ms jitter on its initial delay.

---

## Getting Started

1. **Download** `index.html` (or clone this repo)
2. **Open** the file in any modern browser — desktop or mobile
3. A **Welcome Guide** walks you through setup on first launch
4. **Add API keys** — click **Settings** to enter free API keys (strongly recommended for full data)
5. **Add a position** — enter a ticker, share count (negative for short), cost basis, and optional purchase date → click **+ Add**

No install, no `npm`, no server required.

> **Tip:** Re-open the Welcome Guide any time from inside the Settings panel.

### Deploying with GitHub Pages

1. Fork or push this repo to GitHub
2. Go to **Settings → Pages**
3. Set Source to `main` branch, folder `/` (root)
4. Visit `https://<your-username>.github.io/<repo-name>/`

The app runs entirely client-side — no backend needed.

---

## Importing Positions

1. Export a CSV from your brokerage
2. Click **Import** in the toolbar
3. Drag-and-drop the file or paste the CSV text — positions preview automatically
4. Click **Import Positions**

> **Note:** Large imports (20+ positions) may take a moment to fully load as live data is fetched sequentially through CORS proxies to avoid rate limiting. Prices and fundamentals will fill in progressively.

Simple format (no headers required):
```csv
Symbol,Shares,Cost,Date
AAPL,100,150.00,2024-06-15
MSFT,50,380.50,2024-03-20
TSLA,-25,240.00,2024-08-01
```

Negative shares = short position.

---

## Data Storage

Everything lives in your browser's `localStorage` — nothing is sent to any server other than the financial APIs listed above. Writes to `localStorage` are debounced on a trailing 250 ms timer (and flushed on `beforeunload`), so rapid keystrokes in the cost/share/notes fields don't block the main thread, and a full-quota write only happens once per burst.

| Key | Contents |
|-----|----------|
| `stonks_portfolios` | All named portfolios: `{ name: { portfolio: [...], notes: {...} } }` |
| `stonks_active_portfolio` | Currently selected portfolio name |
| `stonks_portfolio` | Active portfolio's positions array (mirrored for backward compat) |
| `stonks_notes` | Active portfolio's per-symbol notes (mirrored for backward compat) |
| `stonks_hidden_columns` | Array of column keys hidden via the Columns picker |
| `stonks_column_order` | User-defined column order (array of column keys); empty = default order |
| `stonks_alloc_visible` | Allocation pie chart show/hide state |
| `stonks_alerts` | Per-symbol price alert thresholds: `{ symbol: { above, below } }` |
| `stonks_finnhub_key` | FinnHub API key |
| `stonks_alpaca_key_id` | Alpaca Key ID |
| `stonks_alpaca_secret` | Alpaca Secret Key |
| `stonks_fmp_key` | FMP API key |
| `stonks_refresh_interval` | Auto-refresh interval |
| `stonks_auto_refresh` | Auto-refresh on/off toggle |
| `stonks_welcome_dismissed` | Welcome guide dismissed state |

Clearing browser data resets everything.

---

## Browser Compatibility

Chrome, Firefox, Edge, Safari (any modern version supporting ES2020+). Responsive on iOS and Android. No IE support.

---

## Debugging

Per-symbol and per-proxy fetch warnings are silenced by default — a single refresh races multiple proxies × symbols and most non-winners produce expected errors that would otherwise flood the console. To turn the verbose log stream back on (proxy race losses, per-symbol Yahoo / FinnHub / Alpaca / CoinGecko fallback failures, abort traces):

```js
localStorage.setItem('stonks_debug', '1');
location.reload();
```

Source-level events (auth failures, rate limit hits, WebSocket connect/close, localStorage quota errors, top-level refresh exceptions) always log regardless of this flag.

---

## Security

The app ships with a strict `Content-Security-Policy` meta tag that disallows remote scripts, `eval`, object/embed content, and arbitrary framing. `connect-src` is limited to `https:` / `wss:` so data still flows to the financial APIs and CORS proxies, but nothing else. A `referrer` policy of `no-referrer` is also set, so navigating away from the app does not leak the URL (which for a shared portfolio could otherwise expose the positions encoded in the hash).

All user-visible strings that originate outside the app are escaped before being written to the DOM:
- Imported CSV fields (symbol, date, header preview, raw header line, column labels) are escaped in the import preview.
- Column picker entries do not use inline `onclick`/`onchange` with interpolated keys — the change handler is attached via `addEventListener` and reads the key from a `data-` attribute.
- External links open with `target="_blank" rel="noopener noreferrer"`.

Portfolio imports from shared URLs are parsed with a symbol whitelist (`[A-Z0-9.\-=]`), a length cap of 10 characters, and numeric coercion for shares and cost, and are always gated behind a confirmation dialog. Positions that don't pass validation are dropped before any state is replaced.

Corrupt `localStorage` entries are detected on load: the bad key is removed and the app boots with an empty fallback instead of crashing.

---

## Author

Made by [Grant](https://github.com/gdy)

## License

MIT
