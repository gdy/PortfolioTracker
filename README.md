# STONKS — Portfolio Tracker

A real-time portfolio tracker for stocks, crypto, and commodities that runs entirely in your browser as a single HTML file. No server, no build tools, no dependencies — just open `index.html` and go.

[![Live Demo](https://img.shields.io/badge/demo-GitHub%20Pages-blue)](https://gdy.github.io/PortfolioTracker/)
![Zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)
![Single file](https://img.shields.io/badge/single-file-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## Features

### Real-Time Market Data
- **WebSocket streaming** — real-time trade-by-trade price updates for stocks via FinnHub WebSocket (up to 50 symbols on the free tier). No proxy needed — bypasses CORS entirely. Auto-reconnects on disconnect. Renders are debounced via `requestAnimationFrame` for smooth performance under high-frequency trades. A pulsing **● Live** badge appears in the toolbar when streaming is active.
- **Multi-source price fetching** — fetches from Yahoo Finance, FinnHub, Alpaca Markets, Financial Modeling Prep, and CoinGecko simultaneously, picks the source with the most coverage, and fills individual missing fields from secondary sources.
- **Automatic source fallback** — if one API is down or rate-limited, data is pulled from the next available source automatically, with no user action required.
- **Auto-refresh** — configurable polling intervals (5s / 10s / 15s / 30s / 60s). Works alongside WebSocket intelligently: when WebSocket is streaming live stock prices, REST polling is automatically throttled to once per 60 seconds (since it's only needed for fundamentals, volume, and non-stock assets). Without WebSocket, polling runs at the selected interval.
- **Three-phase refresh scheduling** — during active market hours (4 AM–8 PM ET weekdays) all sources are polled; outside those hours, only crypto and commodity positions (24/7 markets) are refreshed on a lightweight path; on weekends, auto-refresh pauses unless you hold crypto or commodities.
- **Pre-market and after-hours pricing** — displayed inline per row with change indicators. Sourced from Yahoo Finance v7 batch (one proxy call for all symbols), with a v8 chart candle fallback for any symbols not covered. Correctly handles the 2 AM overnight case where Yahoo's `currentTradingPeriod` points to the next session.
- **Price flash animations** — green/red flashes on price changes (from both WebSocket updates and polling).
- **Source attribution** — the status bar shows which data sources are active and whether WebSocket streaming is live (e.g. "Data via FinnHub + CoinGecko | WS streaming").
- **Smart CORS proxy rotation** — 7 proxy endpoints with automatic failover, last-working-proxy memory, and validation of proxy error responses (rejects HTML pages, rate-limit strings, and proxy-specific JSON error bodies before accepting a response).

### Portfolio Management
- **30+ data columns** — last price, $ change, % change, after-hours, quantity, cost basis, purchase date, market value, day P&L, dividend/yield, ex-div date, next earnings, YTD/6M/1Y performance, total P&L, P&L %, previous close, open, bid, ask, day range, 52-week range, volume, avg volume, market cap, P/E, EPS, beta, notes
- **Inline editing** — click any quantity, cost basis, date, or notes field to edit directly in the table. Changes are saved instantly.
- **Undo / Redo** — `Ctrl+Z` / `Ctrl+Y` (or `Ctrl+Shift+Z`) undoes and redoes any portfolio change: add, remove, edit shares/cost/date, import, or clear all. Up to 50 levels of history.
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
- **Smart merging** — duplicate symbols use weighted-average cost basis.
- **Price seeding** — imported last prices display immediately before APIs respond.

### Asset Classes
| Type | Ticker format | Data source |
|------|--------------|-------------|
| Stocks | `AAPL`, `MSFT`, … | Yahoo Finance, FinnHub, Alpaca, FMP |
| Crypto | `BTC`, `ETH`, `SOL` … (auto-maps to `BTC-USD`) | CoinGecko (direct CORS, no proxy) |
| Commodity futures | `GOLD`, `OIL`, `SILVER` … (auto-maps to `GC=F`) | Yahoo Finance v8 chart (via CORS proxy) |

Commodity futures symbols containing `=` are handled carefully: `=` is kept raw in URL path segments (`yfPath`) but percent-encoded in query string parameters (`yfEnc`) to avoid ambiguity. Commodities that fail on the initial fetch are automatically retried by the main commodity retry pass and a deferred background retry that staggers requests across proxies with generous delays (8–10 s) to let rate limits recover.

### Sorting & UI
- **Click any column header to sort** — ascending/descending toggle with a sort indicator arrow.
- **Sticky headers** — column headers stay visible while scrolling horizontally.
- **Keyboard shortcuts** — `Tab` moves between toolbar inputs (ticker → shares → cost → date); `Enter` adds a position; `Ctrl+Z` / `Ctrl+Y` undo/redo.
- **Dark theme** — terminal-style monospace UI with `color-scheme: dark` applied at the root so native browser widgets (date picker, scrollbars) match the theme.

### Mobile Responsive
- Toolbar stacks vertically on small screens with larger tap targets.
- Smooth horizontal table scrolling with `-webkit-overflow-scrolling: touch`.
- Spin buttons always visible on touch devices.
- Import dialog and settings panel fill the viewport on narrow screens.
- Extra-small breakpoint at 380px for iPhone SE.

---

## Data Sources

| Source | Key required | Rate limit | What it provides |
|--------|-------------|-----------|-----------------|
| Yahoo Finance | No | Via CORS proxies | Quotes (v7 batch → v8 chart → v6 fallback), quoteSummary fundamentals, after-hours/pre-market, historical performance (YTD/6M/1Y) |
| FinnHub | Free key (recommended) | 60 req/min REST + WebSocket | Real-time WebSocket streaming (stocks only), REST quotes, profiles, P/E, EPS, beta, dividends, earnings dates, 52-week performance |
| Alpaca Markets | Free key | 200 req/min | Real-time IEX snapshots, real bid/ask, avg volume, 52-week range from historical bars |
| Financial Modeling Prep | Free key | 250 req/day | Quotes with after-hours data, fundamentals |
| CoinGecko | No | ~30 req/min | Crypto prices, 24h high/low, market cap, volume; 1-year chart for 52-week range and YTD/6M/1Y performance |

### API Call Strategy

**Proxy efficiency** — Yahoo Finance requests go through CORS proxies. The code uses a single rotating proxy list (`lastWorkingProxy` cache) with HTML-page, rate-limit-string, and proxy-error-JSON detection to skip bad responses. Sequential processing with per-symbol delays prevents proxy saturation:
- Performance history (YTD/6M/1Y): processed one symbol at a time with 800 ms gaps
- Commodity retry: 3 s between symbols in the main pass; 8 s initial delay then per-proxy fallback in the background retry
- FinnHub free quotes: 200 ms between symbols, stops on HTTP 429

**Yahoo crumb** — fetched once and cached for 30 minutes (crumbs expire ~30 min). Automatically refreshed on expiry rather than failing silently with stale auth.

**Yahoo v7 batch** — tried first for all symbols in one proxy request. If it fails, a 3-minute cooldown prevents permanently falling back to the slower per-symbol v8 path. After the cooldown, v7 is retried automatically.

**`fundamentalsCache` skip** — `fillFundamentals` skips symbols whose FinnHub fundamentals cache already contains P/E, beta, and market cap, avoiding redundant quoteSummary proxy calls.

**FinnHub fundamentals** — fetched once per symbol per session (profile + metrics) and cached in `fundamentalsCache`. Per-refresh calls are only the lightweight `/quote` endpoint.

**CoinGecko** — 30 s minimum between calls with a local cache. The `/coins/markets` bulk endpoint is used for prices + 24h data; `/coins/{id}/market_chart?days=365` is used once per crypto symbol for 52-week range and performance metrics (with 1.5 s between requests).

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
4. Visit `https://<your-username>.github.io/<repo-name>/index.html`

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

Everything lives in your browser's `localStorage` — nothing is sent to any server other than the financial APIs listed above.

| Key | Contents |
|-----|----------|
| `stonks_portfolio` | Positions array (symbol, shares, costBasis, purchaseDate) |
| `stonks_notes` | Per-symbol notes |
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

## Author

Made by [Grant](https://github.com/gdy)

## License

MIT
