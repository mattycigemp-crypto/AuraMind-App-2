import handler from '../index.js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

let ipCounter = 0;

export function makeRes(): VercelResponse & { state: { status: number; body: any } } {
  const state = { status: 200, body: null as any };
  const res: any = {
    state,
    status(c: number) { state.status = c; return res; },
    setHeader() { return res; },
    send(b: any) { state.body = typeof b === 'string' ? JSON.parse(b) : b; return res; },
    json(b: any) { state.body = b; return res; },
    end() { return res; },
  };
  return res;
}

export interface CallOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  ip?: string;
}

export async function call(path: string, opts: CallOptions = {}) {
  const res = makeRes();
  const ip = opts.ip || `10.0.0.${++ipCounter}`;
  const req: any = {
    method: opts.method || 'POST',
    query: { path },
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': ip,
      ...opts.headers,
    },
    body: opts.body,
    socket: { remoteAddress: ip },
    url: `/api/${path}`,
  };
  await handler(req, res);
  return { status: res.state.status, body: res.state.body };
}
