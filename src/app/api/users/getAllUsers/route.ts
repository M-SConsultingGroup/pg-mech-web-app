
import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/user';
import connectToDatabase from '@/lib/mongodb';

export async function GET(req: NextRequest) {
  await connectToDatabase();
  const users = await User.find({}, 'username');
  return NextResponse.json(users);
}