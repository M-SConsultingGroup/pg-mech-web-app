import { NextRequest } from 'next/server';
import { getTickets, createTicket, updateTicket, deleteTicket } from '@/controllers/TicketController';
import connectToDatabase from '@/lib/mongodb';
import { Auth } from '@/utils/decorators';

class TicketHandler {
  @Auth()
  async GET(req: NextRequest) {
    await connectToDatabase();
    const res = await getTickets(req);
    return res;
  }

  async POST(req: NextRequest) {
    await connectToDatabase();
    const res = await createTicket(req);
    return res;
  }

  @Auth()
  async PUT(req: NextRequest) {
    await connectToDatabase();
    const res = await updateTicket(req);
    return res;
  }

  @Auth()
  async DELETE(req: NextRequest) {
    await connectToDatabase();
    const res = await deleteTicket(req);
    return res;
  }
}

const handler = new TicketHandler();

export const GET = handler.GET.bind(handler);
export const POST = handler.POST.bind(handler);
export const PUT = handler.PUT.bind(handler);
export const DELETE = handler.DELETE.bind(handler);