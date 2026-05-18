import { SetMetadata } from '@nestjs/common';

export const GUEST_CAPABILITIES_KEY = 'guestCapabilities';
export const GuestCapabilities = (...capabilities: string[]) => SetMetadata(GUEST_CAPABILITIES_KEY, capabilities);
