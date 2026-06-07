# Swagger Deployment Check

Use `GET /api/v1/system/build-info` to confirm the deployed backend build and OpenAPI generation timestamp.

The endpoint is public and returns only safe metadata: app name, package version, commit SHA when provided by CI/deploy, build time when provided by CI/deploy, and the committed OpenAPI generation timestamp.

To compare a deployed Swagger document with the committed generated OpenAPI:

```bash
LIVE_OPENAPI_URL=https://gift.dcodax.net/docs-json npm run docs:compare-live
```

Default CI should run `npm run docs:generate` and `npm run docs:assert`. PDF generation remains optional through `npm run docs:pdf`.
