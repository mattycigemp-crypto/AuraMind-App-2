import type { VercelResponse } from '@vercel/node';

export function sendSuccess<T>(res: VercelResponse, data: T, status = 200) {
  return res.status(status).json({ success: true, data });
}

export function sendError(res: VercelResponse, status: number, message: string, code?: string) {
  return res.status(status).json({
    success: false,
    error: { message, code: code || 'ERROR' },
  });
}

export function sendPaginated<T>(
  res: VercelResponse,
  data: T[],
  total: number,
  page: number,
  limit: number,
) {
  return res.status(200).json({
    success: true,
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    },
  });
}
