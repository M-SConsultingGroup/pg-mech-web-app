import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/user';
import connectToDatabase from '@/lib/mongodb';
import { Auth } from '@/utils/decorators';

class UserHandler {
  @Auth()
  async GET(req: NextRequest) {
    await connectToDatabase();
    const users = await User.find({}, 'username');
    return NextResponse.json(users);
  }
}

const handler = new UserHandler();
export const GET = handler.GET.bind(handler);