import { NextRequest, NextResponse } from 'next/server';
import * as jwt from 'jsonwebtoken';

interface ExtendedNextRequest extends NextRequest {
  user?: string | object;
};

export async function authMiddleware(req: ExtendedNextRequest) {

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'No token provided' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Attach the decoded user to the request object
    return null; // No error
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}