import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

export const healthRouter = Router();

healthRouter.get('/', async (_request, response) => {
  let database = 'unavailable';

  try {
    await prisma.$queryRaw`SELECT 1`;
    database = 'connected';
  } catch {
    // Health remains useful while the app is bootstrapped without a database.
  }

  response.json({ status: 'ok', database });
});
