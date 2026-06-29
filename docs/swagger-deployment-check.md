# Swagger Deployment Check

To compare a deployed Swagger document with the committed generated OpenAPI:

```bash
LIVE_OPENAPI_URL=https://gift.dcodax.net/docs-json npm run docs:compare-live
```

Default CI should run `npm run docs:generate` and `npm run docs:assert`. PDF generation remains optional through `npm run docs:pdf`.
