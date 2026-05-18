import { HttpException, HttpStatus } from '@nestjs/common';

export class EmailNotVerifiedException extends HttpException {
  constructor(userVerified: 0 | 1 = 0) {
    super({
      code: 'EMAIL_NOT_VERIFIED',
      message: 'Please verify your email before login',
      user_verified: userVerified,
    }, HttpStatus.FORBIDDEN);
  }
}
