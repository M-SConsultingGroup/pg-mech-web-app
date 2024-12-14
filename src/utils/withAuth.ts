import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/auth';

export function withAuth(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    const authResponse = await authMiddleware(req);
    if (authResponse) return authResponse;
    return handler(req);
  };
}