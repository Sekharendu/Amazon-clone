import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

export const categoriesRouter = Router();

categoriesRouter.get('/', async (_request, response, next) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { displayOrder: 'asc' },
      include: {
        facets: {
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    response.json(categories);
  } catch (error) {
    next(error);
  }
});
