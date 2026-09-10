import type { GuestSession } from '@prisma/client';

export {};

declare global {
  namespace Express {
    interface Request {
      guestSession: GuestSession;
    }
  }
}
