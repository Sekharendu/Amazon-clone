import { Prisma } from '@prisma/client';
import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

export const productsRouter = Router();

const defaultPage = 1;
const defaultPageSize = 20;
const maxPageSize = 100;

type QueryValue = string | string[] | undefined;
type FilterValue = string | string[];
type FacetOption = string | { label?: string; value?: string; min?: number; max?: number };

function asSingleQueryValue(value: unknown) {
  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value) && typeof value[0] === 'string') {
    return value[0];
  }

  return undefined;
}

function parsePositiveInteger(value: unknown, fallback: number, name: string, maximum?: number) {
  const parsed = asSingleQueryValue(value);

  if (parsed === undefined) {
    return fallback;
  }

  const number = Number(parsed);
  if (!Number.isInteger(number) || number < 1 || (maximum !== undefined && number > maximum)) {
    throw new Error(`${name} must be an integer between 1 and ${maximum ?? 'infinity'}`);
  }

  return number;
}

function parseFilters(value: unknown) {
  const raw = asSingleQueryValue(value);

  if (!raw) {
    return {} as Record<string, FilterValue>;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('filters must be valid URL-encoded JSON');
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('filters must be a JSON object');
  }

  const filters: Record<string, FilterValue> = {};
  for (const [name, filterValue] of Object.entries(parsed)) {
    if (typeof filterValue === 'string' || (Array.isArray(filterValue) && filterValue.every((item) => typeof item === 'string'))) {
      filters[name] = filterValue as FilterValue;
    } else {
      throw new Error(`filter ${name} must be a string or string array`);
    }
  }

  return filters;
}

function normalizeValues(value: FilterValue) {
  return (Array.isArray(value) ? value : [value]).map((item) => item.trim().toLowerCase());
}

function optionMatches(option: FacetOption, value: string) {
  if (typeof option === 'string') {
    return option.toLowerCase() === value;
  }

  return [option.label, option.value].some((candidate) => candidate?.toLowerCase() === value);
}

function optionForValue(options: FacetOption[], value: string) {
  return options.find((option) => optionMatches(option, value));
}

function buildFacetCondition(facetName: string, values: string[], options: FacetOption[]): Prisma.ProductWhereInput {
  const normalizedName = facetName.toLowerCase();
  const matchedOptions = values.map((value) => optionForValue(options, value)!);

  if (normalizedName === 'brand') {
    return { brand: { in: values, mode: 'insensitive' } };
  }

  if (normalizedName === 'color' || normalizedName === 'size' || normalizedName === 'style') {
    return {
      variants: {
        some: {
          [normalizedName]: { in: values, mode: 'insensitive' },
        },
      },
    };
  }

  if (normalizedName === 'price') {
    const priceConditions = matchedOptions
      .filter((option): option is Exclude<FacetOption, string> => typeof option !== 'string')
      .map((option) => ({
        ...(option.min !== undefined ? { gte: option.min } : {}),
        ...(option.max !== undefined ? { lte: option.max } : {}),
      }));

    return { variants: { some: { OR: priceConditions.map((condition) => ({ price: condition })) } } };
  }

  const specificationConditions: Prisma.ProductSpecificationWhereInput[] = values.flatMap((value) => [
    { label: { contains: value, mode: 'insensitive' } },
    { value: { contains: value, mode: 'insensitive' } },
  ]);

  return {
    OR: [
      { department: { in: values, mode: 'insensitive' } },
      { specifications: { some: { OR: specificationConditions } } },
    ],
  };
}

async function buildWhere(query: Record<string, unknown>) {
  const categoryId = asSingleQueryValue(query.categoryId);
  const queryText = asSingleQueryValue(query.queryText)?.trim();
  const filters = parseFilters(query.filters);
  const where: Prisma.ProductWhereInput = {};
  const conditions: Prisma.ProductWhereInput[] = [];

  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (queryText) {
    conditions.push({
      OR: [
        { title: { contains: queryText, mode: 'insensitive' } },
        { brand: { contains: queryText, mode: 'insensitive' } },
        { description: { contains: queryText, mode: 'insensitive' } },
      ],
    });
  }

  const facets = await prisma.facet.findMany({
    where: categoryId ? { categoryId } : undefined,
  });
  const facetMap = new Map(facets.map((facet) => [facet.name.toLowerCase(), facet]));

  for (const [name, filterValue] of Object.entries(filters)) {
    const facet = facetMap.get(name.toLowerCase());
    if (!facet) {
      throw new Error(`Unknown facet: ${name}`);
    }

    const values = normalizeValues(filterValue);
    const options = Array.isArray(facet.options) ? facet.options as FacetOption[] : [];
    if (values.some((value) => !options.some((option) => optionMatches(option, value)))) {
      throw new Error(`Invalid option for facet: ${name}`);
    }

    conditions.push(buildFacetCondition(facet.name, values, options));
  }

  if (conditions.length > 0) {
    where.AND = conditions;
  }

  return where;
}

function getOrderBy(sort: unknown): Prisma.ProductOrderByWithRelationInput {
  switch (asSingleQueryValue(sort)) {
    case 'newest':
      return { createdAt: 'desc' };
    case 'price_asc':
    case 'price_desc':
      return { title: 'asc' };
    case 'title_desc':
      return { title: 'desc' };
    case 'title_asc':
    case 'featured':
    case undefined:
      return { title: 'asc' };
    default:
      throw new Error('sort must be one of featured, newest, price_asc, price_desc, title_asc, or title_desc');
  }
}

productsRouter.get('/', async (request, response, next) => {
  try {
    const page = parsePositiveInteger(request.query.page, defaultPage, 'page');
    const pageSize = parsePositiveInteger(request.query.pageSize, defaultPageSize, 'pageSize', maxPageSize);
    const where = await buildWhere(request.query);
    const sort = asSingleQueryValue(request.query.sort);
    const orderBy = getOrderBy(sort);
    const [total, allProducts] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        ...(sort === 'price_asc' || sort === 'price_desc' ? {} : { orderBy, skip: (page - 1) * pageSize, take: pageSize }),
        include: {
          category: true,
          variants: true,
        },
      }),
    ]);
    const products = sort === 'price_asc' || sort === 'price_desc'
      ? allProducts
        .sort((left, right) => {
          const leftPrice = Number(left.variants[0]?.price ?? 0);
          const rightPrice = Number(right.variants[0]?.price ?? 0);
          return sort === 'price_asc' ? leftPrice - rightPrice : rightPrice - leftPrice;
        })
        .slice((page - 1) * pageSize, page * pageSize)
      : allProducts;

    response.json({
      items: products,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    if (error instanceof Error && (error.message.startsWith('filters') || error.message.startsWith('Unknown facet') || error.message.startsWith('Invalid option') || error.message.startsWith('page') || error.message.startsWith('pageSize') || error.message.startsWith('sort'))) {
      response.status(400).json({ error: error.message });
      return;
    }

    next(error);
  }
});

productsRouter.get('/:id', async (request, response, next) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: request.params.id },
      include: {
        category: true,
        variants: true,
        media: true,
        specifications: true,
      },
    });

    if (!product) {
      response.status(404).json({ error: 'Product not found' });
      return;
    }

    response.json(product);
  } catch (error) {
    next(error);
  }
});
