import { randomBytes } from 'node:crypto';
import type { RequestHandler } from 'express';
import { prisma } from '../lib/prisma.js';

export const GUEST_SESSION_COOKIE = 'guest_session';
const guestSessionLifetimeMs = 365 * 24 * 60 * 60 * 1000;

function cookieOptions(expires: Date) {
  return {
    expires,
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  };
}

export const guestSessionMiddleware: RequestHandler = async (request, response, next) => {
  try {
    const cookieToken = request.cookies?.[GUEST_SESSION_COOKIE];
    const now = new Date();
    let session = cookieToken
      ? await prisma.guestSession.findUnique({ where: { cookieToken } })
      : null;

    if (session?.expiresAt && session.expiresAt <= now) {
      session = null;
    }

    if (!session) {
      const expiresAt = new Date(now.getTime() + guestSessionLifetimeMs);
      const newCookieToken = randomBytes(32).toString('hex');

      session = await prisma.guestSession.create({
        data: {
          cookieToken: newCookieToken,
          expiresAt,
        },
      });

      response.cookie(GUEST_SESSION_COOKIE, newCookieToken, cookieOptions(expiresAt));
    } else {
      if (!session.expiresAt) {
        session = await prisma.guestSession.update({
          where: { id: session.id },
          data: { expiresAt: new Date(now.getTime() + guestSessionLifetimeMs) },
        });
      }

      response.cookie(GUEST_SESSION_COOKIE, session.cookieToken, cookieOptions(session.expiresAt!));
    }

    request.guestSession = session;
    next();
  } catch (error) {
    next(error);
  }
};
