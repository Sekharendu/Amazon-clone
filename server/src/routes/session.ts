import { Router } from 'express';

export const sessionRouter = Router();

sessionRouter.get('/', (request, response) => {
  response.json({
    guestSessionId: request.guestSession.id,
    expiresAt: request.guestSession.expiresAt,
  });
});
