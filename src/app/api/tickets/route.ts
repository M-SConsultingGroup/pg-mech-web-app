import { NextRequest} from 'next/server';
import { getTickets, createTicket, updateTicket, deleteTicket } from '@/controllers/TicketController';
import connectToDatabase from '@/lib/mongodb';

export async function GET(req: NextRequest) {
  await connectToDatabase();
  const res = await getTickets(req);
  return res;
}

export async function POST(req: NextRequest) {
  await connectToDatabase();
  const res = await createTicket(req);
  return res;
}

export async function PUT(req: NextRequest) {
  await connectToDatabase();
  const res = await updateTicket(req);
  return res;
}

export async function DELETEf(req: NextRequest) {
  await connectToDatabase();
  const res = await deleteTicket(req);
  return res;
}