import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import path from 'path';
const [,, page = 'cast.html', out = 'stills/cast.png', w = '2400', h = '1000'] = process.argv;
const root = path.resolve('web');
const srv = http.createServer((q, s) => { const p = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (!fs.existsSync(p)) { s.writeHead(404); return s.end(); } s.writeHead(200, { 'Content-Type': p.endsWith('.js') ? 'text/javascript' : 'text/html' }); fs.createReadStream(p).pipe(s); }).listen(0);
await new Promise(r => srv.on('listening', r));
const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: +w, height: +h } });
pg.on('console', m => console.log('PAGE', m.text())); pg.on('pageerror', e => console.log('ERR', e.message));
await pg.goto(`http://localhost:${srv.address().port}/${page}`); await pg.waitForFunction(() => window.ready || window.err, null, { timeout: 60000 });
await pg.locator('canvas').screenshot({ path: out }); await b.close(); srv.close(); console.log(out);
