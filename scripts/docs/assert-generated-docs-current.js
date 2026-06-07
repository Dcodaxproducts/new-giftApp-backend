const fs = require('fs');
const path = require('path');

const root = process.cwd();
const generatedDir = path.join(root, 'docs', 'generated');
const requirePdf = process.env.DOCS_REQUIRE_PDF === 'true';
const baseRequiredFiles = [
  'openapi.json',
  'api-reference.md',
  'api-reference.html',
  'frontend-api-guide.md',
  'frontend-api-guide.html',
];
const pdfFiles = [
  'api-reference.pdf',
  'frontend-api-guide.pdf',
];
const requiredFiles = requirePdf ? [...baseRequiredFiles, ...pdfFiles] : baseRequiredFiles;
const staleFiles = [
  'gift-app-api-record.html',
  'gift-app-api-record.md',
  'gift-app-api-record.pdf',
  'gift-app-detailed-api-record.html',
  'gift-app-detailed-api-record.md',
  'gift-app-detailed-api-record.pdf',
  'generate_openapi.js',
  'generate_full_api_pdf.py',
  'frontend_guide_pdf.py',
];
const removedChatGroups = [
  '05 Customer - Provider Chat',
  '03 Provider - Buyer Chat',
  '02 Admin - Support Chat',
];
const removedRoutes = [
  'POST /api/v1/broadcasts/estimate-reach',
  'PATCH /api/v1/broadcasts/{id}/targeting',
  'PATCH /api/v1/broadcasts/{id}/schedule',
  'POST /api/v1/broadcasts/{id}/cancel',
  'POST /api/v1/provider/payouts/{id}/cancel',
  'PATCH /api/v1/provider/offers/{id}/status',
  'PATCH /api/v1/provider/inventory/{id}/status',
  'PATCH /api/v1/coupons/{id}/status',
  'PATCH /api/v1/admin/social-reporting-rules/{id}/status',
  'PATCH /api/v1/admins/{id}/active-status',
  'PATCH /api/v1/referral-settings/status',
];
const allowedMultiTagOperations = new Set();

function fail(message) {
  console.error(message);
  process.exit(1);
}

if (!fs.existsSync(generatedDir)) fail('docs/generated is missing');
for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(generatedDir, file))) fail(`Missing required generated file: docs/generated/${file}`);
}
for (const file of staleFiles) {
  if (fs.existsSync(path.join(generatedDir, file))) fail(`Stale/generated-script file must not exist: docs/generated/${file}`);
}
if (fs.existsSync(path.join(root, 'gift-app-api-record.pdf'))) fail('Root gift-app-api-record.pdf must not exist');

const actualFiles = fs.readdirSync(generatedDir).filter((file) => fs.statSync(path.join(generatedDir, file)).isFile()).sort();
const allowedFiles = [...baseRequiredFiles, ...pdfFiles].sort();
const unexpectedFiles = actualFiles.filter((file) => !allowedFiles.includes(file));
if (unexpectedFiles.length) {
  fail(`docs/generated must contain only canonical outputs. Found unexpected: ${unexpectedFiles.join(', ')}. All files: ${actualFiles.join(', ')}`);
}

const openapiPath = path.join(generatedDir, 'openapi.json');
const openapi = JSON.parse(fs.readFileSync(openapiPath, 'utf8'));
const seen = new Set();
for (const [routePath, pathItem] of Object.entries(openapi.paths || {})) {
  for (const [method, operation] of Object.entries(pathItem || {})) {
    const lower = method.toLowerCase();
    if (!['get', 'post', 'put', 'patch', 'delete', 'options', 'head'].includes(lower)) continue;
    const key = `${lower} ${routePath}`;
    if (seen.has(key)) fail(`Duplicate OpenAPI operation detected: ${key}`);
    seen.add(key);
    const tags = operation.tags || [];
    if (tags.length > 1 && !allowedMultiTagOperations.has(key)) fail(`Operation has multiple Swagger tags: ${key} -> ${tags.join(', ')}`);
  }
}
for (const route of removedRoutes) {
  const [method, routePath] = route.split(' ');
  if (openapi.paths?.[routePath]?.[method.toLowerCase()]) fail(`Removed route still present in OpenAPI: ${route}`);
}
if (!openapi.paths?.['/api/v1/system/build-info']?.get) fail('Expected build info endpoint missing: GET /api/v1/system/build-info');
if (typeof openapi.info?.['x-openapi-generated-at'] !== 'string') fail('OpenAPI generated timestamp missing: info.x-openapi-generated-at');

const tagNames = new Set((openapi.tags || []).map((tag) => tag.name));
for (const removed of removedChatGroups) {
  if (tagNames.has(removed)) fail(`Removed old chat Swagger group still present: ${removed}`);
}
if (!tagNames.has('08 Chat - Threads')) fail('Expected chat group missing: 08 Chat - Threads');
if (!tagNames.has('02 Admin - Notification Delivery Monitoring')) fail('Expected chat/notification group missing: 02 Admin - Notification Delivery Monitoring');

const headerChecks = ['api-reference.md', 'frontend-api-guide.md', 'api-reference.html', 'frontend-api-guide.html'];
for (const file of headerChecks) {
  const content = fs.readFileSync(path.join(generatedDir, file), 'utf8');
  for (const token of ['Generated from docs/generated/openapi.json', 'Generated at:', 'Do not edit manually.', 'Run: npm run docs:generate']) {
    if (!content.includes(token)) fail(`Generated header missing in docs/generated/${file}: ${token}`);
  }
}

console.log('DOCS_ASSERT_OK');
