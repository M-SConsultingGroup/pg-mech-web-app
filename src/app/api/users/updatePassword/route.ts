import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import User from '@/models/user';
import connectToDatabase from '@/lib/mongodb';
import { Auth } from '@/utils/decorators';

class UpdatePasswordHandler {
  @Auth()
  async PUT(req: NextRequest) {
    await connectToDatabase();
    const { username, password } = await req.json();

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update the user's password
    const user = await User.findOneAndUpdate({ username }, { password: hashedPassword });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Password updated successfully' }, { status: 200 });
  }
}

const handler = new UpdatePasswordHandler();

export const PUT = handler.PUT.bind(handler);