import { MessageModerationFlagType } from '@prisma/client';
import { MessageModerationScanner } from '../services/message-moderation-scanner.service';

describe('MessageModerationScanner', () => {
  const scanner = new MessageModerationScanner();

  it('detects suspicious link', () => {
    const result = scanner.scanMessage({ body: 'Click here https://bit.ly/free-money now' });
    expect(result.isFlagged).toBe(true);
    expect(result.flagTypes).toContain(MessageModerationFlagType.SUSPICIOUS_LINK);
  });

  it('detects profanity and hostility placeholder keywords', () => {
    const result = scanner.scanMessage({ body: 'Listen you total idiot, I will hurt you' });
    expect(result.isFlagged).toBe(true);
    expect(result.flagTypes).toContain(MessageModerationFlagType.PROFANITY);
    expect(result.flagTypes).toContain(MessageModerationFlagType.HOSTILITY);
    expect(result.redactedBody).toContain('[REDACTED]');
  });

  it('does not flag normal message', () => {
    const result = scanner.scanMessage({ body: 'Hello, can you please share the order update?' });
    expect(result.isFlagged).toBe(false);
  });
});
