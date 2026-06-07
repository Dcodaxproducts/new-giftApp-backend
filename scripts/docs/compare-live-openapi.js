const fs = require('fs');
const http = require('http');
const https = require('https');
const path = require('path');

const liveUrl = process.env.LIVE_OPENAPI_URL;
if (!liveUrl) {
  console.error('LIVE_OPENAPI_URL is required. Example: LIVE_OPENAPI_URL=https://gift.dcodax.net/docs-json npm run docs:compare-live');
  process.exit(1);
}

const localPath = path.join(process.cwd(), 'docs', 'generated', 'openapi.json');
if (!fs.existsSync(localPath)) {
  console.error('Missing docs/generated/openapi.json. Run npm run docs:generate first.');
  process.exit(1);
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http;
    const request = client.get(url, (response) => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => {
        body += chunk;
      });
      response.on('end', () => {
        if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300) {
          reject(new Error(`Live OpenAPI request failed with HTTP ${response.statusCode ?? 'unknown'}`));
          return;
        }
        try {
          resolve(JSON.parse(body));
        } catch (error) {
          reject(error);
        }
      });
    });
    request.on('error', reject);
    request.setTimeout(15000, () => {
      request.destroy(new Error('Live OpenAPI request timed out after 15s'));
    });
  });
}

function stats(openapi) {
  const paths = openapi.paths && typeof openapi.paths === 'object' ? openapi.paths : {};
  let operations = 0;
  for (const pathItem of Object.values(paths)) {
    if (!pathItem || typeof pathItem !== 'object') continue;
    for (const method of Object.keys(pathItem)) {
      if (['get', 'post', 'put', 'patch', 'delete', 'options', 'head'].includes(method.toLowerCase())) operations += 1;
    }
  }
  return { pathCount: Object.keys(paths).length, operationCount: operations };
}

async function main() {
  const local = JSON.parse(fs.readFileSync(localPath, 'utf8'));
  const live = await fetchJson(liveUrl);
  const localStats = stats(local);
  const liveStats = stats(live);

  if (localStats.pathCount !== liveStats.pathCount || localStats.operationCount !== liveStats.operationCount) {
    console.error(`LIVE_OPENAPI_MISMATCH local=${localStats.pathCount} paths/${localStats.operationCount} operations live=${liveStats.pathCount} paths/${liveStats.operationCount} operations`);
    process.exit(1);
  }

  console.log(`LIVE_OPENAPI_MATCH ${liveStats.pathCount} paths / ${liveStats.operationCount} operations`);
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
