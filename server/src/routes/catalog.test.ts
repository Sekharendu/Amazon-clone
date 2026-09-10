import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { fakePrisma } = vi.hoisted(() => ({
  fakePrisma: {
    category: { findMany: vi.fn() },
    facet: { findMany: vi.fn() },
    product: {
      count: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('../lib/prisma.js', () => ({ prisma: fakePrisma }));

const { app } = await import('../app.js');

describe('catalog routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fakePrisma.facet.findMany.mockResolvedValue([
      { name: 'Color', options: ['Black', 'Blue'], categoryId: 'category-1' },
    ]);
    fakePrisma.product.count.mockResolvedValue(0);
    fakePrisma.product.findMany.mockResolvedValue([]);
  });

  it('filters products using query text, category, and facet options', async () => {
    fakePrisma.product.count.mockResolvedValue(1);
    fakePrisma.product.findMany.mockResolvedValue([{ id: 'product-1', title: 'Black shirt' }]);

    const response = await request(app)
      .get('/api/products')
      .query({
        queryText: 'shirt',
        categoryId: 'category-1',
        filters: JSON.stringify({ Color: ['Black'] }),
        page: 2,
        pageSize: 2,
      });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ page: 2, pageSize: 2, total: 1, totalPages: 1 });
    expect(response.body.items).toEqual([{ id: 'product-1', title: 'Black shirt' }]);

    const query = fakePrisma.product.findMany.mock.calls[0][0];
    expect(query.skip).toBe(2);
    expect(query.take).toBe(2);
    expect(query.where.categoryId).toBe('category-1');
    expect(JSON.stringify(query.where)).toContain('shirt');
    expect(JSON.stringify(query.where)).toContain('black');
  });

  it('paginates products with the default ordering', async () => {
    fakePrisma.product.count.mockResolvedValue(45);

    const response = await request(app)
      .get('/api/products')
      .query({ page: 3, pageSize: 10 });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ page: 3, pageSize: 10, total: 45, totalPages: 5 });

    const query = fakePrisma.product.findMany.mock.calls[0][0];
    expect(query.skip).toBe(20);
    expect(query.take).toBe(10);
  });

  it('rejects a facet value that is not present in the facet options', async () => {
    const response = await request(app)
      .get('/api/products')
      .query({ filters: JSON.stringify({ Color: ['Green'] }) });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Invalid option');
    expect(fakePrisma.product.findMany).not.toHaveBeenCalled();
  });

  it('returns product details with variants, media, and specifications', async () => {
    const product = {
      id: 'product-1',
      title: 'Black shirt',
      variants: [{ id: 'variant-1' }],
      media: [{ id: 'media-1' }],
      specifications: [{ id: 'spec-1' }],
    };
    fakePrisma.product.findUnique.mockResolvedValue(product);

    const response = await request(app).get('/api/products/product-1');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(product);
    expect(fakePrisma.product.findUnique).toHaveBeenCalledWith({
      where: { id: 'product-1' },
      include: {
        category: true,
        variants: true,
        media: true,
        specifications: true,
      },
    });
  });
});
