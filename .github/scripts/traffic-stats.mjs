// Keeps a permanent record of this repo's GitHub traffic.
//
// GitHub only retains traffic (views, clones, referrers, popular pages) for a
// rolling 14 days, so anything not copied out before then is gone. This script
// fetches the current window, merges it into history.json, and rewrites
// README.md as a human-readable report. The workflow in
// .github/workflows/traffic-stats.yml runs it daily and commits both files to
// the traffic-stats branch, which keeps them out of main and out of the
// GitHub Pages deploy.
//
// Usage: node traffic-stats.mjs <output dir>
// Env:   TRAFFIC_TOKEN - a token that can read traffic (see the workflow file)
//        REPO          - owner/name, defaults to gdy/PortfolioTracker
//
// No dependencies: Node 18+ has fetch built in.
import fs from 'node:fs';
import path from 'node:path';

const REPO = process.env.REPO || 'gdy/PortfolioTracker';
const TOKEN = process.env.TRAFFIC_TOKEN;
const OUT = process.argv[2] || '.';
if (!TOKEN) { console.error('TRAFFIC_TOKEN is not set'); process.exit(1); }

async function gh(p) {
  const r = await fetch('https://api.github.com/repos/' + REPO + p, {
    headers: {
      Authorization: 'Bearer ' + TOKEN,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'traffic-stats',
    },
    signal: AbortSignal.timeout(20000),
  });
  if (!r.ok) {
    // A 403 here almost always means the token lacks the traffic permission,
    // which is worth saying plainly instead of failing on a JSON parse later.
    const hint = r.status === 403 || r.status === 404
      ? ' - the token needs read access to this repo\'s Administration (traffic) data' : '';
    throw new Error('GET ' + p + ' -> HTTP ' + r.status + hint);
  }
  return r.json();
}

const day = ts => ts.slice(0, 10);   // GitHub buckets traffic by UTC day
const today = new Date().toISOString().slice(0, 10);

const [views, clones, referrers, paths, repo] = await Promise.all([
  gh('/traffic/views?per=day'),
  gh('/traffic/clones?per=day'),
  gh('/traffic/popular/referrers'),
  gh('/traffic/popular/paths'),
  gh(''),
]);

const file = path.join(OUT, 'history.json');
const hist = fs.existsSync(file)
  ? JSON.parse(fs.readFileSync(file, 'utf8'))
  : { days: {}, repo: {}, referrers: {}, paths: {}, referrersEver: {} };

// Daily counts: GitHub's figure for a day is authoritative, and today's bucket
// is partial, so overwrite rather than add - tomorrow's run replaces today's
// partial count with the full one. Days that have aged out of the 14-day
// window aren't returned and are left exactly as recorded.
for (const v of views.views || []) {
  const d = hist.days[day(v.timestamp)] ||= {};
  d.views = v.count; d.viewers = v.uniques;
}
for (const c of clones.clones || []) {
  const d = hist.days[day(c.timestamp)] ||= {};
  d.clones = c.count; d.cloners = c.uniques;
}

// Referrers and popular pages only exist as a 14-day total, so keep one
// snapshot per day, plus a running record of every referrer ever seen.
hist.referrers[today] = referrers;
hist.paths[today] = paths;
for (const r of referrers) {
  const e = hist.referrersEver[r.referrer] ||= { firstSeen: today, peak14d: 0 };
  e.peak14d = Math.max(e.peak14d, r.count);
  e.lastSeen = today;
}
hist.repo[today] = { stars: repo.stargazers_count, forks: repo.forks_count, watchers: repo.subscribers_count };
hist.updated = new Date().toISOString();

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(file, JSON.stringify(hist, null, 2) + '\n');
fs.writeFileSync(path.join(OUT, 'README.md'), report(hist));
console.log('Recorded ' + Object.keys(hist.days).length + ' days; latest ' + today);

function report(h) {
  const dates = Object.keys(h.days).sort();
  const sum = k => dates.reduce((n, d) => n + (h.days[d][k] || 0), 0);
  const latestRepo = h.repo[Object.keys(h.repo).sort().pop()] || {};
  const last30 = dates.slice(-30);
  const n = v => (v == null ? 0 : v);
  const latestRefs = h.referrers[Object.keys(h.referrers).sort().pop()] || [];
  const latestPaths = h.paths[Object.keys(h.paths).sort().pop()] || [];
  const ever = Object.entries(h.referrersEver).sort((a, b) => b[1].peak14d - a[1].peak14d);
  const lines = [];
  lines.push('# Traffic for ' + REPO, '');
  lines.push('Updated ' + h.updated.replace('T', ' ').slice(0, 16) + ' UTC, tracking since ' + (dates[0] || today) +
             '. Written daily by `.github/workflows/traffic-stats.yml` on `main`; the raw data is [`history.json`](history.json).', '');
  lines.push('| Since tracking began | |', '|---|---|');
  lines.push('| Repo page views | **' + sum('views') + '** |');
  lines.push('| Clones | **' + sum('clones') + '** |');
  lines.push('| Stars / forks / watchers now | ' + n(latestRepo.stars) + ' / ' + n(latestRepo.forks) + ' / ' + n(latestRepo.watchers) + ' |', '');
  lines.push('These count the GitHub repository, not visits to the live app on GitHub Pages, which GitHub does not measure. ' +
             'Unique counts are per day, so they are not added up across days.', '');
  if (last30.length > 1) {
    lines.push('## Last 30 days', '');
    lines.push('```mermaid', 'xychart-beta', '  title "Views (bar) and clones (line) per day"');
    lines.push('  x-axis [' + last30.map(d => '"' + d.slice(5) + '"').join(', ') + ']');
    lines.push('  y-axis "count"');
    lines.push('  bar [' + last30.map(d => n(h.days[d].views)).join(', ') + ']');
    lines.push('  line [' + last30.map(d => n(h.days[d].clones)).join(', ') + ']');
    lines.push('```', '');
  }
  lines.push('| Day (UTC) | Views | Unique viewers | Clones | Unique cloners |', '|---|---:|---:|---:|---:|');
  for (const d of [...last30].reverse()) {
    const x = h.days[d];
    lines.push('| ' + d + ' | ' + n(x.views) + ' | ' + n(x.viewers) + ' | ' + n(x.clones) + ' | ' + n(x.cloners) + ' |');
  }
  lines.push('', '## Referrers, last 14 days', '');
  if (latestRefs.length) {
    lines.push('| Site | Views | Unique |', '|---|---:|---:|');
    for (const r of latestRefs) lines.push('| ' + r.referrer + ' | ' + r.count + ' | ' + r.uniques + ' |');
  } else lines.push('None yet.');
  lines.push('', '## Every referrer seen', '');
  if (ever.length) {
    lines.push('| Site | First seen | Last seen | Best 14-day count |', '|---|---|---|---:|');
    for (const [k, v] of ever) lines.push('| ' + k + ' | ' + v.firstSeen + ' | ' + v.lastSeen + ' | ' + v.peak14d + ' |');
  } else lines.push('None yet.');
  lines.push('', '## Most viewed pages, last 14 days', '');
  if (latestPaths.length) {
    lines.push('| Page | Views | Unique |', '|---|---:|---:|');
    for (const p of latestPaths) lines.push('| ' + p.path.replace(/\|/g, '\\|') + ' | ' + p.count + ' | ' + p.uniques + ' |');
  } else lines.push('None yet.');
  return lines.join('\n') + '\n';
}
