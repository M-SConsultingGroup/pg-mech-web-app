import { v4 as uuidv4 } from 'uuid';
import type { NextRequest } from 'next/server';

export const getCorrelationId = (req?: NextRequest): string => {
  if (typeof window !== 'undefined') {
    // Client-side
    let correlationId = localStorage.getItem('correlationId');
    if (!correlationId) {
      correlationId = uuidv4();
      localStorage.setItem('correlationId', correlationId);
    }
    return correlationId;
  } else {
    // Server-side
    let correlationId = req?.headers?.get('x-correlation-id') || uuidv4();
    return correlationId;
  }
};