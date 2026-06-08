import { z } from 'zod';
import type { VercelRequest } from '@vercel/node';
import { BadRequestError } from './errors';

export function validateBody<T>(schema: z.ZodSchema<T>, req: VercelRequest): T {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const first = result.error.errors[0];
    throw new BadRequestError(
      first?.message || 'Invalid request body',
      'VALIDATION_ERROR',
    );
  }
  return result.data;
}

export function validateQuery<T>(schema: z.ZodSchema<T>, req: VercelRequest): T {
  const result = schema.safeParse(req.query);
  if (!result.success) {
    const first = result.error.errors[0];
    throw new BadRequestError(
      first?.message || 'Invalid query parameters',
      'VALIDATION_ERROR',
    );
  }
  return result.data;
}

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const userIdSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
});

export const emailSchema = z.object({
  email: z.string().email('Invalid email'),
});
