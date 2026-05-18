# Real-Time Chat Events

Namespace: `/chat` (Socket.IO). REST chat APIs remain the source of truth for history and pagination.

## Auth
Pass JWT as `auth.token = "Bearer <accessToken>"` or `Authorization: Bearer <accessToken>`.

## Client → Server
- `chat.join` `{ threadId }`
- `chat.leave` `{ threadId }`
- `chat.message.send` `{ clientMessageId, threadId, messageType, body, attachmentUrls }`
- `chat.message.read` `{ threadId }`
- `chat.typing.start` `{ threadId }`
- `chat.typing.stop` `{ threadId }`
- `support.join` `{ supportChatId }`
- `support.leave` `{ supportChatId }`
- `support.message.send` `{ clientMessageId, supportChatId, messageType, body, attachmentUrls }`
- `support.message.read` `{ supportChatId }`
- `support.typing.start` `{ supportChatId }`
- `support.typing.stop` `{ supportChatId }`
- `presence.ping` `{}`

## Server → Client
- `chat.joined`
- `chat.thread.updated`
- `chat.message.created`
- `chat.message.delivered`
- `chat.message.read`
- `chat.typing.started`
- `chat.typing.stopped`
- `chat.participant.online`
- `chat.participant.offline`
- `chat.error`
- `support.thread.updated`
- `support.message.created`
- `support.message.delivered`
- `support.message.read`
- `support.status.updated`
- `support.error`
- `presence.pong`

## Send payload
```json
{
  "clientMessageId": "mobile-generated-uuid",
  "threadId": "thread_id",
  "messageType": "TEXT",
  "body": "Your order is ready for shipping.",
  "attachmentUrls": []
}
```

## Message created payload
```json
{
  "threadId": "thread_id",
  "message": {
    "id": "message_id",
    "clientMessageId": "mobile-generated-uuid",
    "senderType": "CUSTOMER",
    "messageType": "TEXT",
    "body": "Your order is ready for shipping.",
    "attachmentUrls": [],
    "createdAt": "2026-05-18T10:00:00.000Z",
    "readState": {
      "isReadByCustomer": true,
      "isReadByProvider": false
    }
  }
}
```

## Rules
- `clientMessageId` is idempotent per sender/thread.
- Customer can join only own customer-provider chat threads.
- Provider can join only own provider-order chat threads.
- Admin support chat access follows support chat assignment / `supportChats.read.all` rules.
- Attachments must be completed uploads in `chat-attachments`; support attachments must be completed uploads in `support-chat-attachments`.
- Typing events are ephemeral and are not persisted.
- Read events persist read state, then emit read receipts.
- Offline recipients receive fallback notifications through the central notification dispatch service.
