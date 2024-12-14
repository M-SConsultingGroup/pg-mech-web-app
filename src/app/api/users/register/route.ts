import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import User from '@/models/user';
import connectToDatabase from '@/lib/mongodb';
import { Auth } from '@/utils/decorators';

class RegistrationHandler {
  @Auth()
  async POST(req: NextRequest) {
    await connectToDatabase();
    const { username, password, isAdmin } = await req.json();

    // Check if the user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const user = new User({ username, password: hashedPassword, isAdmin });
    await user.save();

    return NextResponse.json({ message: 'User created successfully' }, { status: 201 });
  }

  @Auth()
  async GET(req: NextRequest) {
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

    return NextResponse.json({ message: 'Login successful' }, { status: 200 });
  }
}

const handler = new RegistrationHandler();

export const POST = handler.POST.bind(handler);
export const GET = handler.GET.bind(handler);