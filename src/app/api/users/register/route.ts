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
}

const handler = new RegistrationHandler();

export const POST = handler.POST.bind(handler);