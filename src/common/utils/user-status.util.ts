import { UserStatus } from '@prisma/client';

export function isUserActiveStatus(status: UserStatus): boolean {
  return status === UserStatus.APPROVED || status === UserStatus.PENDING;
}

export function isUserApprovedStatus(status: UserStatus): boolean {
  return status === UserStatus.APPROVED;
}

export function isUserVerifiedStatus(status: UserStatus): boolean {
  return status !== UserStatus.PENDING;
}

export function isUserSuspendedStatus(status: UserStatus): boolean {
  return status === UserStatus.SUSPENDED;
}

export function legacyUserFlags(status: UserStatus) {
  return {
    isActive: isUserActiveStatus(status),
    isVerified: isUserVerifiedStatus(status),
    isApproved: isUserApprovedStatus(status),
  };
}
