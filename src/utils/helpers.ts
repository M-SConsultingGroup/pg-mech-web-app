import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export const getCorrelationId = (req? : NextRequest) => {
    let correlationId = (req && req?.headers?.get('x-correlation-id')) || localStorage.getItem('correlationId');
    if (!correlationId) {
      correlationId = uuidv4();
      localStorage.setItem('correlationId', correlationId);
    }
    return correlationId;
};
