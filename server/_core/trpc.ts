import { initTRPC, TRPCError } from '@trpc/server';
import { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { Request, Response } from 'express';
import { getUserByOpenId } from '../db';

export interface Context {
  user: { id: number; openId: string; role: 'user' | 'admin' } | null;
  req: Request;
  res: Response;
}

export async function createContext(opts: CreateExpressContextOptions): Promise<Context> {
  const user = (opts.req as any).user || null;
  return {
    user,
    req: opts.req,
    res: opts.res,
  };
}

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});
