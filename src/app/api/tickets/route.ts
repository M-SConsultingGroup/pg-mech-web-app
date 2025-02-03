import { NextRequest } from 'next/server';
import { TicketController } from '@/controllers/TicketController';
import connectToDatabase from '@/lib/mongodb';
import { Auth } from '@/utils/decorators';

class TicketHandler {
  @Auth()
  async GET(req: NextRequest) {
    await connectToDatabase();
    const res = await TicketController.getTickets(req);
    return res;
  }

  async POST(req: NextRequest) {
    await connectToDatabase();
    const res = await TicketController.createTicket(req);
    return res;
  }

  @Auth()
  async PUT(req: NextRequest) {
    await connectToDatabase();
    const res = await TicketController.updateTicket(req);
    return res;
  }

  @Auth()
  async DELETE(req: NextRequest) {
    await connectToDatabase();
    const res = await TicketController.deleteTicket(req);
    return res;
  }

  async PATCH(req: NextRequest) {
    await connectToDatabase();
    const res = await TicketController.rescheduleTicket(req);
    return res;
  }
}

const handler = new TicketHandler();

export const GET = handler.GET.bind(handler);
export const POST = handler.POST.bind(handler);
export const PUT = handler.PUT.bind(handler);
export const DELETE = handler.DELETE.bind(handler);
export const PATCH = handler.PATCH.bind(handler);