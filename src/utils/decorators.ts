import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from './withAuth';

export function Auth() {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      const [req] = args;
      const authResponse = await withAuth(originalMethod.bind(this))(req);
      if (authResponse) return authResponse;
      return originalMethod.apply(this, args);
    };
  };
}