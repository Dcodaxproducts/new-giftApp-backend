import json
import re
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from html import escape

ROOT = Path(__file__).resolve().parent
openapi = json.loads((ROOT / "openapi.json").read_text())
paths = openapi.get("paths", {})

HTTP_ORDER = {"get": 0, "post": 1, "patch": 2, "put": 3, "delete": 4}

def clean_purpose(op):
    text = op.get("summary") or op.get("description") or "API endpoint."
    text = re.sub(r"^Create\s+", "Create ", text)
    text = re.sub(r"^List\s+", "List ", text)
    text = re.sub(r"^Fetch\s+", "Fetch ", text)
    text = re.sub(r"\s+", " ", text).strip()
    text = re.sub(r"\.$", "", text)
    return text[:155] + ("…" if len(text) > 155 else "")

def clean_module(tag):
    return re.sub(r"^\d+\s+", "", tag).strip()

def access(op):
    explicit = op.get("x-allowed-roles") or op.get("x-access")
    if isinstance(explicit, list):
        return ", ".join(str(item) for item in explicit)
    if isinstance(explicit, str) and explicit.strip():
        return explicit.strip()
    desc = op.get("description") or ""
    m = re.search(r"Access:\s*([^\.]+)\.", desc)
    if m:
        return m.group(1).strip()
    m = re.search(r"(SUPER_ADMIN(?:\s+or\s+ADMIN\s+with\s+[A-Za-z0-9_.]+)?|PROVIDER|REGISTERED_USER|GUEST_USER)", desc)
    return m.group(1).strip() if m else ("PUBLIC" if not op.get("security") else "Authenticated")

def route_role(tag, method, path, op):
    desc = (op.get("description") or "").upper()
    tag_u = tag.upper()
    path_u = path.upper()
    if tag.startswith("02 Admin") or tag.startswith("04 Gifts - Management") or tag.startswith("04 Gifts - Moderation") or tag == "07 Plans & Coupons" or tag == "01 Auth - Login Attempts" or tag == "06 Broadcast Notifications":
        return ["admin"]
    if tag.startswith("03 Provider") or tag == "03 Provider - Inventory" or "/PROVIDER" in path_u:
        return ["provider"]
    if tag.startswith("05 Customer") or tag.startswith("05 Guest") or tag == "06 Payments" or "/CUSTOMER/" in path_u:
        return ["user"]
    if tag == "06 Notifications":
        return ["admin", "provider", "user"]
    if tag == "07 Storage":
        return ["admin", "provider", "user"]
    if tag == "04 Gifts - Categories":
        return ["user"] if "PUBLIC" in desc and method.lower() == "get" and path.endswith("/lookup") else ["admin"]
    if tag == "01 Auth":
        if "/providers/register" in path:
            return ["provider"]
        if "/users/register" in path or "/guest/" in path:
            return ["user"]
        return ["admin", "provider", "user"]
    return ["user"]

sections = {
    "admin": {"title": "Superadmin / Admin APIs", "modules": defaultdict(list)},
    "user": {"title": "Registered User APIs", "modules": defaultdict(list)},
    "provider": {"title": "Provider APIs", "modules": defaultdict(list)},
}

ops_count = 0
for path, methods in paths.items():
    for method, op in methods.items():
        if method.lower() not in HTTP_ORDER:
            continue
        tag = (op.get("tags") or ["Other"])[0]
        row = {
            "method": method.upper(),
            "path": path,
            "purpose": clean_purpose(op),
            "access": access(op),
            "sort": (tag, path, HTTP_ORDER[method.lower()]),
        }
        for role in route_role(tag, method, path, op):
            sections[role]["modules"][clean_module(tag)].append(row)
            ops_count += 1

for sec in sections.values():
    for rows in sec["modules"].values():
        rows.sort(key=lambda r: (r["path"], HTTP_ORDER.get(r["method"].lower(), 9)))

css = """
@page { size: A4; margin: 15mm 12mm; @bottom-right { content: counter(page); color: #64748b; font-size: 9px; } }
body { font-family: Inter, Arial, sans-serif; color: #111827; font-size: 10.2px; line-height: 1.32; }
h1 { font-size: 25px; margin: 0 0 6px; color: #0f172a; }
h2 { font-size: 18px; margin: 22px 0 8px; padding: 8px 10px; background: #0f172a; color: #fff; border-radius: 7px; page-break-after: avoid; }
h3 { font-size: 13px; margin: 15px 0 6px; color: #1e3a8a; page-break-after: avoid; }
p.meta { margin: 0 0 14px; color: #475569; font-size: 10px; }
.notice { background: #eff6ff; border: 1px solid #bfdbfe; padding: 9px 11px; border-radius: 8px; margin: 10px 0 14px; }
table { width: 100%; border-collapse: collapse; margin-bottom: 9px; page-break-inside: auto; }
tr { page-break-inside: avoid; }
th { text-align: left; background: #e2e8f0; color: #0f172a; font-size: 9.4px; padding: 5px 6px; }
td { border-bottom: 1px solid #e5e7eb; padding: 4px 6px; vertical-align: top; }
.method { font-weight: 700; font-size: 9px; white-space: nowrap; }
.GET { color: #0369a1; } .POST { color: #047857; } .PATCH,.PUT { color: #b45309; } .DELETE { color: #b91c1c; }
.path { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 8.7px; color: #334155; word-break: break-all; }
.access { color: #64748b; font-size: 8.6px; }
ul { margin: 4px 0 10px 18px; padding: 0; }
li { margin: 3px 0; }
.small { color:#64748b; font-size:9px; }
"""

html = ["<!doctype html><html><head><meta charset='utf-8'><title>Gift App Frontend Developer API Guide</title><style>", css, "</style></head><body>"]
html.append("<h1>Gift App Backend — Frontend Developer API Guide</h1>")
html.append(f"<p class='meta'>Generated from <code>docs/generated/openapi.json</code> ({len(paths)} paths / {sum(len(v) for v in paths.values())} operations) on {datetime.now().strftime('%Y-%m-%d %H:%M PKT')}.</p>")
html.append("<div class='notice'><b>How to use this guide:</b> Each section is grouped module-by-module. Purposes are intentionally one line for fast frontend planning. Use Swagger/OpenAPI for request/response schemas and examples.</div>")


html.append("<h2>Frontend Integration Flows</h2>")
html.append("""
<div class='notice'><b>Required app flows covered by this guide:</b>
<ul>
  <li><b>Auth flows:</b> login/register, token refresh, sessions, profile, password reset, and guest session creation.</li>
  <li><b>Guest flows:</b> use guest session + guest marketplace APIs under <code>05 Customer / Guest - Marketplace</code>; guest users can browse configured marketplace surfaces only.</li>
  <li><b>Registered customer flows:</b> marketplace, wishlist, addresses, contacts, events, cart, orders, provider chat, reviews, reports, recurring payments, transactions, referrals, subscriptions, wallet, and payment methods.</li>
  <li><b>Provider flows:</b> dashboard, business info, buyer chat, reviews, inventory, promotional offers, orders, payouts, payout methods, refunds, and analytics. Provider inventory visibility does not require gift moderation approval; approved active non-suspended providers remain the visibility gate.</li>
  <li><b>Super Admin/Admin flows:</b> staff, roles, users, providers, moderation, support chat, payments/payouts, disputes/refunds, settings, audit logs, notifications, and storage policy.</li>
  <li><b>Storage upload flow:</b> create/complete uploads using the storage endpoints before attaching media URLs to profile, chat, support, gift, review, or dispute payloads.</li>
  <li><b>Payment/order flow:</b> cart/order checkout, payment methods, payment records, transactions, recurring payments/subscriptions, and order history.</li>
  <li><b>Payout flow:</b> provider payout methods, earnings, payout requests, and admin payout approvals/settings.</li>
  <li><b>Dispute/refund flow:</b> customer disputes, provider disputes, evidence, decisions, financial adjustments, tracking logs, provider refund requests, and refund policy settings.</li>
</ul>
</div>
""")

for key in ["admin", "user", "provider"]:
    sec = sections[key]
    html.append(f"<h2>{escape(sec['title'])}</h2>")
    if key == "admin":
        html.append("<p class='small'>Use SUPER_ADMIN token, or ADMIN token with the RBAC permission shown in Swagger access notes.</p>")
    elif key == "user":
        html.append("<p class='small'>Use REGISTERED_USER token unless the endpoint is public (for example guest/session or category lookup).</p>")
    else:
        html.append("<p class='small'>Use PROVIDER token. Provider-facing data is scoped to the authenticated provider account/business.</p>")
    for module in sorted(sec["modules"].keys()):
        rows = sec["modules"][module]
        html.append(f"<h3>{escape(module)} <span class='small'>({len(rows)} APIs)</span></h3>")
        html.append("<table><thead><tr><th style='width:9%'>Method</th><th style='width:41%'>Endpoint</th><th style='width:35%'>Purpose</th><th style='width:15%'>Access</th></tr></thead><tbody>")
        for r in rows:
            html.append(f"<tr><td class='method {r['method']}'>{r['method']}</td><td class='path'>{escape(r['path'])}</td><td>{escape(r['purpose'])}</td><td class='access'>{escape(r['access'])}</td></tr>")
        html.append("</tbody></table>")
        if module == "Admin - Message Moderation":
            html.append("""
<div class='notice'><b>Message moderation frontend notes:</b>
<ul>
  <li>Use the conversation list for the moderation queue and conversation detail for the flagged message preview / AI moderation alert.</li>
  <li>Actions: block message, warn user, suspend account, dismiss flag, add internal private note, and reprocess. Use the next list item as the “Next Incident” source after an action.</li>
  <li>Permissions: SUPER_ADMIN can perform all actions. ADMIN needs messageModeration.read for queue/detail, export for export, block/warn/suspend/dismiss for those actions, notes.create for private notes, and moderate for reprocess.</li>
  <li>Redaction: flagged harmful content returns <code>body: null</code> by default and always includes <code>redactedBody</code>. Do not render raw harmful content unless a future explicit unmask permission is implemented.</li>
  <li>Internal notes are admin-only and must never be rendered in customer/provider chat screens.</li>
</ul>
</div>
""")

html.append("<h2>WebSocket / Real-Time Guide</h2>")
html.append("""
<h3>Notifications namespace</h3>
<ul>
  <li><b>Socket URL:</b> <code>{API_BASE_URL}/notifications</code> using Socket.IO client.</li>
  <li><b>Auth:</b> pass access token as <code>auth: { token: 'Bearer &lt;accessToken&gt;' }</code> or <code>Authorization: Bearer &lt;accessToken&gt;</code> header.</li>
  <li><b>Server rooms:</b> backend joins the socket to <code>user:&lt;userId&gt;</code> and <code>role:&lt;role&gt;</code> after JWT verification; frontend does not manually join rooms.</li>
  <li><b>Listen:</b> <code>notification.received</code>, <code>notification.read</code>, and admin broadcast events: <code>broadcast.created</code>, <code>broadcast.updated</code>, <code>broadcast.scheduled</code>, <code>broadcast.cancelled</code>, <code>broadcast.processing</code>, <code>broadcast.delivery.progress</code>, <code>broadcast.delivery.completed</code>, <code>broadcast.delivery.failed</code>.</li>
  <li><b><code>notification.received</code> payload:</b> <code>{ id, title, message, type, isRead, metadata, createdAt }</code>. Metadata is sanitized before emission; do not expect Stripe secrets, raw bank data, card numbers, or auth tokens.</li>
  <li><b>Emit:</b> <code>notification.read</code> with <code>{ notificationId: string }</code> after marking a notification as read, or receive <code>{ all: true }</code> when all notifications are marked read.</li>
  <li><b>Frontend handling:</b> append/upsert the notification into local notification state, increment unread count when <code>isRead=false</code>, and refresh REST list on reconnect to backfill missed messages.</li>
  <li><b>Reconnect:</b> on token refresh, disconnect and reconnect with the new access token; after reconnect call REST <code>GET /api/v1/notifications</code> for sync.</li>
</ul>
<h3>Dedicated chat namespace</h3>
<ul>
  <li><b>Socket URL:</b> <code>{API_BASE_URL}/chat</code> using the Socket.IO client.</li>
  <li><b>Auth:</b> JWT is required. Pass <code>auth: { token: 'Bearer &lt;accessToken&gt;' }</code> or an <code>Authorization: Bearer &lt;accessToken&gt;</code> header. Reconnect with a fresh token after access-token refresh.</li>
  <li><b>Connection rooms:</b> after JWT verification, the backend automatically joins <code>user:&lt;userId&gt;</code> and <code>role:&lt;role&gt;</code>.</li>
  <li><b>Thread rooms:</b> frontend must not join rooms directly. Emit join events; backend validates ownership/permission before joining <code>chat:&lt;threadId&gt;</code>, <code>order:&lt;orderId&gt;</code>, <code>provider-order:&lt;providerOrderId&gt;</code>, or <code>support-chat:&lt;supportChatId&gt;</code>.</li>
</ul>
<h4>Customer-provider / provider buyer chat events</h4>
<ul>
  <li><b>Emit:</b> <code>chat.join</code>, <code>chat.leave</code>, <code>chat.typing.start</code>, <code>chat.typing.stop</code>, <code>chat.message.send</code>, <code>chat.message.read</code>.</li>
  <li><b>Listen:</b> <code>chat.joined</code>, <code>chat.message.created</code>, <code>chat.message.read</code>, <code>chat.thread.updated</code>, <code>chat.typing.started</code>, <code>chat.typing.stopped</code>, <code>chat.error</code>.</li>
  <li><b>Join/read payload:</b> <code>{ threadId: 'thread_id' }</code>.</li>
  <li><b>Send payload:</b> <code>{ threadId: 'thread_id', messageType: 'TEXT', body: 'Can you confirm delivery time?', attachmentUrls: [] }</code>.</li>
  <li><b>Ownership:</b> REGISTERED_USER can join/send/read only their own customer-provider chat thread. PROVIDER can join/send/read only their own provider buyer thread.</li>
</ul>
<h4>Admin support chat events</h4>
<ul>
  <li><b>Emit:</b> <code>support.join</code>, <code>support.leave</code>, <code>support.typing.start</code>, <code>support.typing.stop</code>, <code>support.message.send</code>, <code>support.message.read</code>, <code>support.resolved</code>, <code>support.reopened</code>.</li>
  <li><b>Listen:</b> <code>support.message.created</code>, <code>support.message.read</code>, <code>support.thread.updated</code>, <code>support.typing.started</code>, <code>support.typing.stopped</code>, <code>support.resolved</code>, <code>support.reopened</code>, <code>support.error</code>.</li>
  <li><b>Join/read payload:</b> <code>{ supportChatId: 'support_chat_id' }</code>.</li>
  <li><b>Reply payload:</b> <code>{ supportChatId: 'support_chat_id', messageType: 'TEXT', body: 'I am checking this issue now.', attachmentUrls: [] }</code>.</li>
  <li><b>Permissions:</b> SUPER_ADMIN can join/reply. ADMIN needs <code>supportChats.read</code> to join/read and <code>supportChats.reply</code> to send replies. Assigned-chat scoping remains enforced.</li>
</ul>
<h4>Reconnect and REST fallback</h4>
<ul>
  <li>On reconnect, re-emit <code>chat.join</code> or <code>support.join</code> for each visible thread after the socket connects.</li>
  <li>Use REST list/detail endpoints to hydrate initial state and backfill missed messages after reconnect.</li>
  <li>Fallback REST endpoints: unified chat <code>GET/POST/PATCH /api/v1/chats...</code>.</li>
</ul>
""")
html.append("</body></html>")

html_path = ROOT / "gift-app-frontend-developer-api-guide.html"
pdf_path = ROOT / "gift-app-frontend-developer-api-guide.pdf"
md_path = ROOT / "gift-app-frontend-developer-api-guide.md"
html_text = "".join(html)
html_path.write_text(html_text)

# Markdown companion for quick text review.
md = ["# Gift App Backend — Frontend Developer API Guide\n\n"]
md.append(f"Generated from `docs/generated/openapi.json` on {datetime.now().strftime('%Y-%m-%d %H:%M PKT')}.\n\n")
md.append("## Frontend Integration Flows\n\n")
md.append("- **Auth flows:** login/register, token refresh, sessions, profile, password reset, and guest session creation.\n")
md.append("- **Guest flows:** use guest session + guest marketplace APIs under `05 Customer / Guest - Marketplace`; guest users can browse configured marketplace surfaces only.\n")
md.append("- **Registered customer flows:** marketplace, wishlist, addresses, contacts, events, cart, orders, provider chat, reviews, reports, recurring payments, transactions, referrals, subscriptions, wallet, and payment methods.\n")
md.append("- **Provider flows:** dashboard, business info, buyer chat, reviews, inventory, promotional offers, orders, payouts, payout methods, refunds, and analytics. Provider inventory visibility does not require gift moderation approval; approved active non-suspended providers remain the visibility gate.\n")
md.append("- **Super Admin/Admin flows:** staff, roles, users, providers, moderation, support chat, payments/payouts, disputes/refunds, settings, audit logs, notifications, and storage policy.\n")
md.append("- **Storage upload flow:** create/complete uploads using storage endpoints before attaching media URLs to profile, chat, support, gift, review, or dispute payloads.\n")
md.append("- **Payment/order flow:** cart/order checkout, payment methods, payment records, transactions, recurring payments/subscriptions, and order history.\n")
md.append("- **Payout flow:** provider payout methods, earnings, payout requests, and admin payout approvals/settings.\n")
md.append("- **Dispute/refund flow:** customer/provider disputes, evidence, decisions, financial adjustments, tracking logs, provider refund requests, and refund policy settings.\n\n")
for key in ["admin", "user", "provider"]:
    sec = sections[key]
    md.append(f"## {sec['title']}\n\n")
    for module in sorted(sec["modules"].keys()):
        rows = sec["modules"][module]
        md.append(f"### {module} ({len(rows)} APIs)\n\n")
        md.append("| Method | Endpoint | Purpose | Access |\n|---|---|---|---|\n")
        for r in rows:
            md.append(f"| {r['method']} | `{r['path']}` | {r['purpose']} | {r['access']} |\n")
        md.append("\n")
        if module == "Admin - Message Moderation":
            md.append("**Message moderation frontend notes**\n\n")
            md.append("- Use the conversation list for the moderation queue and conversation detail for the flagged message preview / AI moderation alert.\n")
            md.append("- Actions: block message, warn user, suspend account, dismiss flag, add internal private note, and reprocess. Use the next list item as the `Next Incident` source after an action.\n")
            md.append("- Permissions: SUPER_ADMIN can perform all actions. ADMIN needs `messageModeration.read` for queue/detail, `messageModeration.export` for export, `messageModeration.block`, `messageModeration.warn`, `messageModeration.suspend`, `messageModeration.dismiss`, `messageModeration.notes.create`, and `messageModeration.moderate` for reprocess.\n")
            md.append("- Redaction: flagged harmful content returns `body: null` by default and always includes `redactedBody`. Do not render raw harmful content unless a future explicit unmask permission is implemented.\n")
            md.append("- Internal notes are admin-only and must never be rendered in customer/provider chat screens.\n\n")
md.append("## WebSocket / Real-Time Guide\n\n")
md.append("### Notifications namespace\n\n")
md.append("- Socket URL: `{API_BASE_URL}/notifications`.\n")
md.append("- Auth: `auth: { token: 'Bearer <accessToken>' }` or `Authorization: Bearer <accessToken>`.\n")
md.append("- Backend joins `user:<userId>` and `role:<role>` after JWT verification.\n")
md.append("- Listen for `notification.received`, `notification.read`, and broadcast delivery events.\n")
md.append("- `notification.received` payload: `{ id, title, message, type, isRead, metadata, createdAt }`. Metadata is sanitized; Stripe secrets, raw bank data, card numbers, and auth tokens are not emitted.\n")
md.append("- Emit `notification.read` with `{ notificationId: string }`; listen for `{ all: true }` after mark-all-read.\n")
md.append("- Frontend handling: append/upsert received notifications, increment unread count when `isRead=false`, and call REST `GET /api/v1/notifications` after reconnect to backfill missed events.\n")
md.append("- Reconnect with a fresh token after access-token refresh.\n\n")
md.append("### Dedicated chat namespace\n\n")
md.append("- Socket URL: `{API_BASE_URL}/chat`.\n")
md.append("- Auth: JWT required via `auth: { token: 'Bearer <accessToken>' }` or `Authorization: Bearer <accessToken>`.\n")
md.append("- Connection rooms are automatic: `user:<userId>` and `role:<role>`.\n")
md.append("- Thread rooms require backend validation: `chat:<threadId>`, `order:<orderId>`, `provider-order:<providerOrderId>`, `support-chat:<supportChatId>`. Frontend must not manually join arbitrary rooms.\n\n")
md.append("#### Customer-provider / provider buyer chat\n\n")
md.append("- Emit: `chat.join`, `chat.leave`, `chat.typing.start`, `chat.typing.stop`, `chat.message.send`, `chat.message.read`.\n")
md.append("- Listen: `chat.joined`, `chat.message.created`, `chat.message.read`, `chat.thread.updated`, `chat.typing.started`, `chat.typing.stopped`, `chat.error`.\n")
md.append("- Join/read payload: `{ \"threadId\": \"thread_id\" }`.\n")
md.append("- Send payload: `{ \"threadId\": \"thread_id\", \"messageType\": \"TEXT\", \"body\": \"Can you confirm delivery time?\", \"attachmentUrls\": [] }`.\n")
md.append("- Ownership: REGISTERED_USER is scoped to own customer-provider threads; PROVIDER is scoped to own provider buyer threads.\n\n")
md.append("#### Admin support chat\n\n")
md.append("- Emit: `support.join`, `support.leave`, `support.typing.start`, `support.typing.stop`, `support.message.send`, `support.message.read`, `support.resolved`, `support.reopened`.\n")
md.append("- Listen: `support.message.created`, `support.message.read`, `support.thread.updated`, `support.typing.started`, `support.typing.stopped`, `support.resolved`, `support.reopened`, `support.error`.\n")
md.append("- Join/read payload: `{ \"supportChatId\": \"support_chat_id\" }`.\n")
md.append("- Reply payload: `{ \"supportChatId\": \"support_chat_id\", \"messageType\": \"TEXT\", \"body\": \"I am checking this issue now.\", \"attachmentUrls\": [] }`.\n")
md.append("- Permissions: SUPER_ADMIN can join/reply. ADMIN needs `supportChats.read` to join/read and `supportChats.reply` to send. Assigned-chat scoping remains enforced.\n\n")
md.append("#### Reconnect and REST fallback\n\n")
md.append("- On reconnect, re-emit `chat.join` or `support.join` for visible threads.\n")
md.append("- Use REST list/detail endpoints to hydrate initial state and backfill missed messages.\n")
md.append("- Fallback REST endpoints: unified `/api/v1/chats...`.\n")
md_path.write_text("".join(md))

from weasyprint import HTML
HTML(string=html_text, base_url=str(ROOT)).write_pdf(str(pdf_path))
print(pdf_path)
print(f"sections={sum(len(sec['modules']) for sec in sections.values())} modules_with_duplicates ops={ops_count}")
