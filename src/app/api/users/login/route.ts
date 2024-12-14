import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import User from '@/models/user';
import connectToDatabase from '@/lib/mongodb';

const JWT_SECRET = process.env.JWT_SECRET || '';

export async function POST(req: NextRequest) {
  await connectToDatabase();
  const { username, password } = await req.json();

  // Find the user
  const user = await User.findOne({ username });
  if (!user) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  // Check the password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  // Generate a token
  const token = jwt.sign({ id: user._id, username: user.username, isAdmin: user.username=='admin'? true : false }, JWT_SECRET, { expiresIn: '30m' });

  return NextResponse.json({ message: 'Login successful', token, username: user.username }, { status: 200 });
}