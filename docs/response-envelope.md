# API Response Envelope

All JSON API responses are normalized by the global `ResponseInterceptor` into this success envelope: `{ success, data, message, meta? }`.

```json
{
  "success": true,
  "data": {},
  "message": "OK",
  "meta": {}
}
```

- `success` is always present for JSON responses.
- `data` is always present; empty successful responses use `null`.
- `message` is always present; handlers may provide a specific message, otherwise it defaults to `OK`.
- `meta` is optional and used for pagination or response metadata.

Errors are normalized by the global `HttpExceptionFilter`:

```json
{
  "success": false,
  "data": null,
  "message": "Validation failed",
  "error": {
    "code": "BadRequestException",
    "message": "Validation failed"
  },
  "meta": {
    "statusCode": 400,
    "timestamp": "2026-05-20T00:00:00.000Z"
  }
}
```

## Explicit exception: downloads/exports

File download/export endpoints return raw `StreamableFile` responses so browsers and clients can download CSV/PDF/text files directly with the correct `Content-Disposition` and `Content-Type` headers. These endpoints intentionally do **not** use the JSON envelope.

Examples include transaction receipts, audit exports, dispute exports, user/provider/gift exports, and other endpoints typed as `StreamableFile`.
