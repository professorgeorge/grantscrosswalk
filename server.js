const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8000;
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.txt': 'text/plain; charset=utf-8',
  '.pdf': 'application/pdf',
  '.ico': 'image/x-icon'
};

const https = require('https');

const ALLOWED_PROXY_PATHS = {
  '/v1/api/search2': 'api.grants.gov',
  '/v1/api/fetchOpportunity': 'api.grants.gov'
};

function withCors(res, status, headers, body) {
  res.writeHead(status, Object.assign({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  }, headers || {}));
  res.end(body);
}

function relayGrantsRequest(req, res, pathname, search) {
  const host = ALLOWED_PROXY_PATHS[pathname];
  if (req.method === 'OPTIONS') { withCors(res, 204, {}, ''); return true; }
  if (!host) { withCors(res, 404, { 'Content-Type': 'text/plain' }, 'Not a recognised Grants.gov path.'); return true; }
  if (req.method !== 'POST') { withCors(res, 405, { 'Content-Type': 'text/plain' }, 'Only POST is relayed.'); return true; }

  const chunks = [];
  req.on('data', (c) => chunks.push(c));
  req.on('end', () => {
    const body = Buffer.concat(chunks);
    const upstream = https.request({
      hostname: host,
      path: pathname + (search || ''),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': body.length,
        'User-Agent': 'GrantCrosswalk/2.0'
      }
    }, (upRes) => {
      const upChunks = [];
      upRes.on('data', (c) => upChunks.push(c));
      upRes.on('end', () => {
        withCors(res, upRes.statusCode || 502, {
          'Content-Type': upRes.headers['content-type'] || 'application/json'
        }, Buffer.concat(upChunks));
      });
    });
    upstream.on('error', (e) => {
      withCors(res, 502, { 'Content-Type': 'text/plain' }, 'Could not reach Grants.gov: ' + e.message);
    });
    upstream.write(body);
    upstream.end();
  });
  return true;
}

const server = http.createServer((req, res) => {
  const [rawPath, rawSearch] = req.url.split('?');
  const pathname = decodeURIComponent(rawPath);

  // Relay Grants.gov API requests to bypass browser CORS limitations seamlessly
  if (ALLOWED_PROXY_PATHS[pathname]) {
    relayGrantsRequest(req, res, pathname, rawSearch ? '?' + rawSearch : '');
    return;
  }

  let p = pathname;
  if (p === '/' || p === '') p = '/index.html';
  const fp = path.join(__dirname, p);
  if (!fp.startsWith(__dirname) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found');
    return;
  }
  res.writeHead(200, {
    'Content-Type': MIME[path.extname(fp).toLowerCase()] || 'application/octet-stream',
    'Service-Worker-Allowed': '/',
    'Cache-Control': 'no-cache'
  });
  fs.createReadStream(fp).pipe(res);
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`  Grants Crosswalk PWA Server running!`);
  console.log(`  Local URL: http://localhost:${PORT}`);
  console.log(`  Close this window to stop the server.`);
  console.log(`======================================================\n`);
});
