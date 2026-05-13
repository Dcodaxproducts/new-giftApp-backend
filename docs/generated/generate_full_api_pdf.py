import json
import html
from pathlib import Path
from datetime import datetime
from weasyprint import HTML

ROOT = Path('/opt/projects/new-giftApp-backend-clean')
openapi_path = ROOT / 'docs/generated/openapi.json'
out_dir = ROOT / 'docs/generated'
md_path = out_dir / 'gift-app-full-api-reference.md'
html_path = out_dir / 'gift-app-full-api-reference.html'
pdf_path = out_dir / 'gift-app-full-api-reference.pdf'

spec = json.loads(openapi_path.read_text())
components = spec.get('components', {}).get('schemas', {})

RESPONSE_OVERRIDES = {
    ('GET', '/api/v1/auth/me'): {'success': True, 'data': {'uid': 'user_id', 'role': 'REGISTERED_USER', 'email': 'jane@example.com', 'firstName': 'Jane', 'lastName': 'Doe', 'phone': '+923001234567', 'avatarUrl': 'https://cdn.yourdomain.com/user-avatars/jane.png', 'permissions': None}, 'message': 'Profile fetched successfully.'},
    ('GET', '/api/v1/auth/sessions'): {'success': True, 'data': [{'id': 'session_id', 'deviceName': 'Chrome on Mac', 'location': 'Lahore, PK', 'ipAddress': '203.0.113.10', 'isCurrent': True, 'lastActiveAt': '2026-04-08T11:45:00.000Z'}], 'message': 'Active sessions fetched successfully.'},
    ('GET', '/api/v1/admin/disputes'): {'success': True, 'data': [{'id': 'dispute_id', 'caseId': 'DIS-9842', 'customer': {'id': 'customer_id', 'name': 'Eleanor Pena', 'email': 'eleanor.p@gmail.com'}, 'transactionId': 'TRX-78229410', 'orderId': 'order_id', 'orderNumber': 'ORD-88421', 'amount': 492, 'currency': 'PKR', 'priority': 'HIGH', 'status': 'ESCALATED', 'daysOpen': 8, 'reason': 'PRODUCT_NOT_RECEIVED', 'createdAt': '2026-04-01T10:00:00.000Z'}], 'meta': {'page': 1, 'limit': 20, 'total': 1, 'totalPages': 1}, 'message': 'Disputes fetched successfully.'},
    ('GET', '/api/v1/admin/disputes/{id}/timeline'): {'success': True, 'data': [{'id': 'timeline_id', 'type': 'DISPUTE_CREATED', 'title': 'Dispute Created', 'description': 'Customer created dispute for product not received.', 'actor': {'type': 'CUSTOMER', 'name': 'Jane Doe'}, 'createdAt': '2026-04-05T09:15:00.000Z'}], 'message': 'Dispute timeline fetched successfully.'},
    ('GET', '/api/v1/admin/disputes/{id}/tracking-log'): {'success': True, 'data': {'caseId': 'DSP-1024', 'customer': {'name': 'Jane Doe'}, 'finalStatus': 'APPROVED', 'lastUpdatedAt': '2026-04-08T11:45:00.000Z', 'secureAuditActive': True, 'timeline': [{'id': 'timeline_id', 'type': 'REFUND_PROCESSED', 'title': 'System Automated Action', 'description': 'Refund processed successfully.', 'amount': 129.99, 'refundId': 'RF-45678', 'createdAt': '2026-04-08T11:45:00.000Z'}], 'customerNotifications': [{'type': 'REFUND_CONFIRMATION_EMAIL', 'status': 'DELIVERED', 'deliveredAt': '2026-04-08T11:46:00.000Z'}], 'internalNotes': [{'id': 'note_id', 'author': 'Alex Morgan', 'note': 'Customer tracking shows pending status for over 14 days.', 'createdAt': '2026-04-08T10:00:00.000Z'}]}, 'message': 'Case tracking log fetched successfully.'},
    ('GET', '/api/v1/admin/provider-disputes'): {'success': True, 'data': [{'id': 'provider_dispute_id', 'caseId': 'PRV-101', 'provider': {'id': 'provider_id', 'businessName': 'Acme Corp', 'contactName': 'John Smith', 'tier': 'Gold Partner'}, 'customer': {'id': 'customer_id', 'name': 'Michael Chen'}, 'transaction': {'id': 'transaction_id', 'transactionId': 'TXN-998', 'status': 'VERIFIED'}, 'category': 'NON_DELIVERY', 'amount': 650, 'currency': 'PKR', 'status': 'RULING_PENDING', 'priority': 'HIGH', 'riskAssessment': 'HIGH', 'daysOpen': 5, 'createdAt': '2026-04-05T10:00:00.000Z'}], 'meta': {'page': 1, 'limit': 20, 'total': 1, 'totalPages': 1}, 'message': 'Provider disputes fetched successfully.'},
    ('GET', '/api/v1/admin/provider-disputes/{id}/evidence'): {'success': True, 'data': {'caseId': 'PD-2047', 'reviewStatus': {'startedBy': 'A. Marcus', 'startedAt': '2026-04-08T09:00:00.000Z', 'isComplete': False}, 'customerEvidence': {'submittedAt': '2026-04-05T10:00:00.000Z', 'status': 'RECEIVED', 'narrative': 'The package was never delivered to my doorstep despite tracking saying otherwise.', 'files': [{'id': 'evidence_file_id', 'fileName': 'Order confirmation screenshot.pdf', 'fileUrl': 'https://cdn.yourdomain.com/provider-dispute-evidence/order-confirmation.pdf', 'contentType': 'application/pdf', 'sizeText': '1.2 MB', 'category': 'PDF Document'}]}, 'providerEvidence': {'submittedAt': '2026-04-07T10:00:00.000Z', 'status': 'RECEIVED_LATE', 'lateText': '+2 days past deadline', 'narrative': 'Delivery was completed at 2:14 PM. GPS coordinates and driver logs confirm arrival.', 'files': [{'id': 'evidence_file_id_4', 'fileName': 'GPS coordinates at delivery.json', 'fileUrl': 'https://cdn.yourdomain.com/provider-dispute-evidence/gps.json', 'contentType': 'application/json', 'sizeText': '4 KB', 'category': 'Metadata File'}]}, 'internalReviewerNotes': 'Document your findings here. These notes are only visible to internal staff.'}, 'message': 'Provider dispute evidence fetched successfully.'},
    ('GET', '/api/v1/admin/provider-disputes/{id}/financial-impact'): {'success': True, 'data': {'caseId': 'PD-2047', 'ruling': 'CUSTOMER_WINS_FULL_REFUND', 'providerAccountPreview': {'currentBalance': 340.5, 'pendingPayout': 210.0, 'newBalance': 225.51, 'currency': 'PKR'}, 'breakdown': [{'lineItem': 'Order Total', 'adjustment': 89.99, 'runningTotal': 89.99}, {'lineItem': 'Customer Refund', 'adjustment': -89.99, 'runningTotal': 0}, {'lineItem': 'Provider Lost Earnings', 'adjustment': -67.49, 'runningTotal': -67.49}, {'lineItem': 'Platform Fee Reversal', 'adjustment': -22.5, 'runningTotal': -89.99}, {'lineItem': 'Penalty Fee', 'adjustment': -25.0, 'runningTotal': -114.99}], 'totalProviderDeduction': 114.99}, 'message': 'Financial impact fetched successfully.'},
    ('GET', '/api/v1/admin/provider-disputes/{id}/resolution-log'): {'success': True, 'data': {'caseId': 'PD-2047', 'finalRuling': 'CUSTOMER_WINS', 'closedAt': '2026-10-24T00:00:00.000Z', 'description': 'Complete audit trail of provider dispute, financial adjustments, and communications.', 'lifecycleTimeline': [{'type': 'PENALTY_APPLIED', 'title': 'Penalty Applied', 'description': 'System-generated penalty of 500.00 applied to provider.', 'createdAt': '2026-10-24T14:22:00.000Z'}], 'financialAuditLog': [{'transactionId': 'TXN_29048-REV', 'action': 'Reversal Execution', 'amount': -1240.0, 'currency': 'PKR', 'status': 'SUCCESS'}], 'communicationLog': [{'type': 'EMAIL', 'title': 'Resolution Decision Sent', 'to': 'claims@provider.com', 'bodyPreview': 'The evidence provided failed to meet...', 'createdAt': '2026-10-24T10:00:00.000Z'}], 'providerPerformanceImpact': {'winRateBefore': 50, 'winRateAfter': 40, 'penaltyPoints': 15, 'tierStatus': 'Silver At Risk'}}, 'message': 'Provider dispute resolution log fetched successfully.'},
    ('GET', '/api/v1/provider/chats/{threadId}'): {'success': True, 'data': {'thread': {'id': 'thread_id', 'orderNumber': 'ORD-45678', 'customer': {'id': 'customer_id', 'name': 'Michael Chen', 'avatarUrl': None}}, 'messages': [{'id': 'msg_1', 'messageType': 'TEXT', 'body': 'Please share delivery ETA.', 'attachmentUrls': [], 'createdAt': '2026-04-08T10:00:00.000Z', 'isReadByCustomer': True, 'isReadByProvider': True, 'senderType': 'CUSTOMER'}]}, 'message': 'Chat fetched successfully.'},
    ('GET', '/api/v1/provider/reviews'): {'success': True, 'data': [{'id': 'review_id', 'orderId': 'order_id', 'orderNumber': 'ORD-45678', 'customer': {'id': 'customer_id', 'name': 'Michael Chen', 'avatarUrl': None}, 'rating': 5, 'comment': 'Great packaging and timely delivery.', 'createdAt': '2026-04-08T10:00:00.000Z', 'isNew': True, 'likesCount': 3, 'response': {'id': 'response_id', 'body': 'Thank you for your feedback!', 'createdAt': '2026-04-08T11:00:00.000Z'}}], 'meta': {'page': 1, 'limit': 20, 'total': 1, 'totalPages': 1}, 'message': 'Reviews fetched successfully.'},
    ('GET', '/api/v1/provider/reviews/{id}'): {'success': True, 'data': {'id': 'review_id', 'rating': 5, 'comment': 'Great packaging and timely delivery.', 'customer': {'id': 'customer_id', 'name': 'Michael Chen', 'avatarUrl': None}, 'order': {'id': 'order_id', 'orderNumber': 'ORD-45678', 'createdAt': '2026-04-08T09:00:00.000Z'}, 'response': {'id': 'response_id', 'body': 'Thank you for your feedback!', 'createdAt': '2026-04-08T11:00:00.000Z'}}, 'message': 'Review fetched successfully.'},
    ('GET', '/api/v1/customer/subscription/current'): {'success': True, 'data': {'tier': 'PREMIUM', 'subscription': {'id': 'sub_id', 'planId': 'plan_premium', 'planName': 'Premium', 'billingCycle': 'MONTHLY', 'status': 'ACTIVE', 'isPremium': True, 'cancelAtPeriodEnd': False, 'currentPeriodStart': '2026-04-01T00:00:00.000Z', 'currentPeriodEnd': '2026-05-01T00:00:00.000Z'}}, 'message': 'Current subscription fetched successfully.'},
    ('POST', '/api/v1/customer/subscription/checkout'): {'success': True, 'data': {'subscriptionId': 'sub_local_id', 'stripeSubscriptionId': 'sub_stripe_123', 'clientSecret': 'seti_client_secret', 'status': 'INCOMPLETE', 'amountDue': 4.99, 'currency': 'USD'}, 'message': 'Subscription checkout created successfully.'},
    ('GET', '/api/v1/customer/subscription/invoices'): {'success': True, 'data': [{'id': 'invoice_id', 'stripeInvoiceId': 'in_123', 'amountDue': 4.99, 'amountPaid': 4.99, 'currency': 'USD', 'status': 'PAID', 'invoicePdfUrl': 'https://cdn.yourdomain.com/invoices/invoice.pdf', 'periodStart': '2026-04-01T00:00:00.000Z', 'periodEnd': '2026-05-01T00:00:00.000Z', 'createdAt': '2026-04-01T00:00:00.000Z'}], 'meta': {'page': 1, 'limit': 20, 'total': 1, 'totalPages': 1}, 'message': 'Subscription invoices fetched successfully.'},
    ('GET', '/api/v1/uploads'): {'success': True, 'data': [{'id': 'upload_id', 'ownerId': 'user_id', 'ownerRole': 'REGISTERED_USER', 'targetAccountId': None, 'folder': 'user-avatars', 'fileName': 'avatar.png', 'contentType': 'image/png', 'sizeBytes': 1048576, 'fileUrl': 'https://cdn.yourdomain.com/user-avatars/avatar.png', 'storageKey': 'user-avatars/user_id/uuid-avatar.png', 'status': 'COMPLETED', 'giftId': None, 'createdAt': '2026-04-08T09:00:00.000Z', 'updatedAt': '2026-04-08T09:01:00.000Z', 'completedAt': '2026-04-08T09:01:00.000Z'}], 'meta': {'page': 1, 'limit': 20, 'total': 1, 'totalPages': 1}, 'message': 'Uploads fetched successfully.'},
}
REQUEST_OVERRIDES = {
    ('POST', '/api/v1/customer/subscription/checkout'): [('payload', {'planId': 'plan_premium', 'billingCycle': 'MONTHLY', 'paymentMethodId': 'pm_123', 'couponCode': 'SUMMER25'})],
}

def resolve_ref(ref):
    if not ref.startswith('#/components/schemas/'):
        return {}
    return components.get(ref.split('/')[-1], {})


def example_for_schema(schema, depth=0, seen=None):
    if seen is None:
        seen = set()
    if depth > 6:
        return '...'
    if not schema:
        return '<standard success envelope>'
    if '$ref' in schema:
        ref = schema['$ref']
        if ref in seen:
            return '<recursive>'
        seen.add(ref)
        return example_for_schema(resolve_ref(ref), depth + 1, seen)
    if 'example' in schema:
        return schema['example']
    if 'examples' in schema and isinstance(schema['examples'], dict):
        first = next(iter(schema['examples'].values()), None)
        if isinstance(first, dict) and 'value' in first:
            return first['value']
    if 'allOf' in schema:
        merged = {}
        for part in schema['allOf']:
            ex = example_for_schema(part, depth + 1, seen.copy())
            if isinstance(ex, dict):
                merged.update(ex)
        return merged or '<object>'
    if 'oneOf' in schema:
        return example_for_schema(schema['oneOf'][0], depth + 1, seen.copy())
    if 'anyOf' in schema:
        return example_for_schema(schema['anyOf'][0], depth + 1, seen.copy())
    if 'enum' in schema:
        return schema['enum'][0] if schema['enum'] else '<enum>'
    t = schema.get('type')
    if t == 'object' or 'properties' in schema:
        props = schema.get('properties', {})
        result = {}
        for k, v in props.items():
            result[k] = example_for_schema(v, depth + 1, seen.copy())
        if not result and 'additionalProperties' in schema:
            return {'key': example_for_schema(schema['additionalProperties'], depth + 1, seen.copy())}
        return result or {}
    if t == 'array':
        return [example_for_schema(schema.get('items', {}), depth + 1, seen.copy())]
    if t == 'integer':
        return 1
    if t == 'number':
        return 1.0
    if t == 'boolean':
        return True
    if t == 'string':
        fmt = schema.get('format')
        if fmt == 'date-time':
            return '2026-04-08T11:45:00.000Z'
        if fmt == 'date':
            return '2026-04-08'
        if fmt == 'email':
            return 'user@example.com'
        if fmt == 'uuid':
            return 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
        if schema.get('pattern'):
            return '<pattern-matched-string>'
        return '<string>'
    return '<value>'


def request_examples(op):
    override = REQUEST_OVERRIDES.get((op.get('_method', ''), op.get('_path', '')))
    if override is not None:
        return override
    rb = op.get('requestBody') or {}
    content = rb.get('content') or {}
    app_json = content.get('application/json') or next(iter(content.values()), None) or {}
    examples = []
    if isinstance(app_json, dict):
        exs = app_json.get('examples') or {}
        for name, data in exs.items():
            if isinstance(data, dict) and 'value' in data:
                examples.append((name, data['value']))
        if not examples:
            schema = app_json.get('schema') or {}
            examples.append(('payload', example_for_schema(schema)))
    return examples


def response_example(op):
    override = RESPONSE_OVERRIDES.get((op.get('_method', ''), op.get('_path', '')))
    if override is not None:
        return override
    responses = op.get('responses') or {}
    preferred = None
    for code in ['200', '201', '202', '204']:
        if code in responses:
            preferred = responses[code]
            break
    if preferred is None and responses:
        preferred = next(iter(responses.values()))
    if not preferred:
        return {'success': True, 'data': None, 'message': 'Request completed successfully.'}
    content = preferred.get('content') or {}
    app_json = content.get('application/json') or next(iter(content.values()), None)
    if app_json:
        schema = app_json.get('schema') or {}
        return example_for_schema(schema)
    return {'success': True, 'data': '<response returned by endpoint>', 'message': 'Request completed successfully.'}


def allowed_roles(op):
    roles = op.get('x-allowed-roles') or op.get('x-access') or 'Not explicitly declared'
    if isinstance(roles, list):
        return ', '.join(roles)
    return str(roles)


def pretty_json(obj):
    return json.dumps(obj, indent=2, ensure_ascii=False)

sections = []
for tag in spec.get('tags', []):
    tag_name = tag['name']
    ops = []
    for path, path_item in spec.get('paths', {}).items():
        for method in ['get', 'post', 'put', 'patch', 'delete']:
            op = path_item.get(method)
            if op and tag_name in (op.get('tags') or []):
                op['_method'] = method.upper()
                op['_path'] = path
                ops.append((path, method.upper(), op))
    if ops:
        sections.append((tag_name, ops))

generated_at = datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')

md = []
md.append('# Gift App Backend — Full API Reference')
md.append('')
md.append(f'Generated: {generated_at}')
md.append('')
md.append('This document is generated from the current OpenAPI for the Gift App backend. For each API, it includes allowed role/access, request payloads for write endpoints, and response bodies for read/write endpoints.')
md.append('')
md.append('## Contents')
for tag_name, ops in sections:
    md.append(f'- {tag_name} ({len(ops)} APIs)')
md.append('')

html_parts = []
html_parts.append('<html><head><meta charset="utf-8"><style>')
html_parts.append('body{font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.45;color:#111;padding:24px;} h1,h2,h3{color:#0f172a;} h1{font-size:24px;} h2{font-size:18px;border-bottom:1px solid #ccc;padding-bottom:4px;margin-top:28px;} h3{font-size:14px;margin-top:20px;} .meta{color:#555;margin-bottom:16px;} .endpoint{background:#f8fafc;border:1px solid #cbd5e1;padding:10px;border-radius:6px;margin:12px 0;} .method{font-weight:bold;color:#fff;padding:2px 6px;border-radius:4px;font-size:10px;} .GET{background:#0ea5e9;} .POST{background:#22c55e;} .PUT{background:#f59e0b;} .PATCH{background:#8b5cf6;} .DELETE{background:#ef4444;} pre{white-space:pre-wrap;word-break:break-word;background:#0b1020;color:#e5eefc;padding:10px;border-radius:6px;border:1px solid #1f2a44;} .small{font-size:10px;color:#555;} ul{padding-left:18px;} .label{font-weight:bold;} @page { size: A4; margin: 12mm; }')
html_parts.append('</style></head><body>')
html_parts.append(f'<h1>Gift App Backend — Full API Reference</h1><div class="meta">Generated: {html.escape(generated_at)}</div>')
html_parts.append('<p>This document is generated from the current OpenAPI for the Gift App backend. For each API, it includes allowed role/access, request payloads for write endpoints, and response bodies for read/write endpoints.</p>')

for tag_name, ops in sections:
    md.append(f'## {tag_name}')
    md.append('')
    html_parts.append(f'<h2>{html.escape(tag_name)}</h2>')
    for path, method, op in ops:
        summary = op.get('summary') or f'{method} {path}'
        description = op.get('description') or ''
        access = allowed_roles(op)
        md.append(f'### {method} `{path}`')
        md.append('')
        md.append(f'- Summary: {summary}')
        md.append(f'- Allowed role/access: {access}')
        if description:
            md.append(f'- Notes: {description}')
        params = op.get('parameters') or []
        if params:
            md.append('- Parameters:')
            for prm in params:
                loc = prm.get('in', 'param')
                name = prm.get('name', 'unknown')
                req = prm.get('required', False)
                desc = prm.get('description', '')
                schema = prm.get('schema', {})
                schema_desc = schema.get('type') or ('$ref:' + schema['$ref'].split('/')[-1] if '$ref' in schema else 'value')
                md.append(f'  - `{name}` ({loc}, {"required" if req else "optional"}, {schema_desc}) {desc}'.rstrip())
        req_exs = request_examples(op)
        if req_exs and method in ('POST', 'PUT', 'PATCH', 'DELETE'):
            md.append('- Request payload(s):')
            for name, ex in req_exs:
                md.append(f'  - {name}:')
                md.append('```json')
                md.append(pretty_json(ex))
                md.append('```')
        resp = response_example(op)
        md.append('- Response body:')
        md.append('```json')
        md.append(pretty_json(resp))
        md.append('```')
        md.append('')

        html_parts.append(f'<div class="endpoint"><div><span class="method {method}">{method}</span> <code>{html.escape(path)}</code></div>')
        html_parts.append(f'<div><span class="label">Summary:</span> {html.escape(summary)}</div>')
        html_parts.append(f'<div><span class="label">Allowed role/access:</span> {html.escape(access)}</div>')
        if description:
            html_parts.append(f'<div><span class="label">Notes:</span> {html.escape(description)}</div>')
        if params:
            html_parts.append('<div class="label">Parameters:</div><ul>')
            for prm in params:
                loc = prm.get('in', 'param')
                name = prm.get('name', 'unknown')
                req = prm.get('required', False)
                desc = prm.get('description', '')
                schema = prm.get('schema', {})
                schema_desc = schema.get('type') or ('$ref:' + schema['$ref'].split('/')[-1] if '$ref' in schema else 'value')
                html_parts.append(f'<li><code>{html.escape(name)}</code> ({html.escape(loc)}, {"required" if req else "optional"}, {html.escape(schema_desc)}) {html.escape(desc)}</li>')
            html_parts.append('</ul>')
        if req_exs and method in ('POST', 'PUT', 'PATCH', 'DELETE'):
            html_parts.append('<div class="label">Request payload(s):</div>')
            for name, ex in req_exs:
                html_parts.append(f'<div class="small">{html.escape(name)}</div><pre>{html.escape(pretty_json(ex))}</pre>')
        html_parts.append('<div class="label">Response body:</div>')
        html_parts.append(f'<pre>{html.escape(pretty_json(resp))}</pre></div>')

md_path.write_text('\n'.join(md))
html_parts.append('</body></html>')
html_path.write_text(''.join(html_parts))
HTML(string=''.join(html_parts), base_url=str(ROOT)).write_pdf(str(pdf_path))
print(pdf_path)
