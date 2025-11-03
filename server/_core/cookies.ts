import { Request } from 'express';

export function getSessionCookieOptions(req: Request) {
  const isSecure = req.protocol === 'https' || req.header('x-forwarded-proto') === 'https';
  
  return {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };
}
