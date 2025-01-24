import { NextRequest } from 'next/server';
import { TimeEntryController } from '@/controllers/TimeEntryController';
import connectToDatabase from '@/lib/mongodb';
import { Auth } from '@/utils/decorators';

class TimeEntryHandler {
  @Auth()
  async GET(req: NextRequest) {
    await connectToDatabase();
    const res = await TimeEntryController.getTimeEntries(req);
    return res;
  }

  @Auth()
  async POST(req: NextRequest) {
    await connectToDatabase();
    const res = await TimeEntryController.createTimeEntry(req);
    return res;
  }

  @Auth()
  async PUT(req: NextRequest) {
    await connectToDatabase();
    const res = await TimeEntryController.updateTimeEntry(req);
    return res;
  }
}

const handler = new TimeEntryHandler();

export const GET = handler.GET.bind(handler);
export const POST = handler.POST.bind(handler);
export const PUT = handler.PUT.bind(handler);