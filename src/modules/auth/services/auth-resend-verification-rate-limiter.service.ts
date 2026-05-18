import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

@Injectable()
export class AuthResendVerificationRateLimiterService {
  private readonly attempts = new Map<string, number[]>();
  private readonly maxAttempts = 5;
  private readonly windowMs = 15 * 60 * 1000;

  assertAllowed(email: string, ipAddress?: string): void {
    const key = `${this.normalizeEmail(email)}:${ipAddress ?? 'unknown'}`;
    const windowStart = Date.now() - this.windowMs;
    const recentAttempts = (this.attempts.get(key) ?? []).filter((createdAt) => createdAt >= windowStart);

    if (recentAttempts.length >= this.maxAttempts) {
      this.attempts.set(key, recentAttempts);
      throw new HttpException('Too many resend verification requests. Please try again later', HttpStatus.TOO_MANY_REQUESTS);
    }

    recentAttempts.push(Date.now());
    this.attempts.set(key, recentAttempts);
  }

  private normalizeEmail(email: string): string { return email.trim().toLowerCase(); }
}
