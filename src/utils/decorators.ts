import { NextRequest } from 'next/server';
import { withAuth } from './withAuth';

export function Auth() {
  return function (
    target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args: unknown[]) {
      const [req] = args as [NextRequest];
      const authResponse = await withAuth(originalMethod.bind(this))(req);
      if (authResponse) return authResponse;
      return originalMethod.apply(this, args);
    };
  };
}