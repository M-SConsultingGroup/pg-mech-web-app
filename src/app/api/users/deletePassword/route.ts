import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/user';
import connectToDatabase from '@/lib/mongodb';
import { Auth } from '@/utils/decorators';

class DeleteUserHandler {
  @Auth()
  async DELETE(req: NextRequest) {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');

    // Delete the user
    const user = await User.findOneAndDelete({ username });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'User deleted successfully' }, { status: 200 });
  }
}

const handler = new DeleteUserHandler();

export const DELETE = handler.DELETE.bind(handler);