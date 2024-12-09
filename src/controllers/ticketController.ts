import { NextRequest, NextResponse } from 'next/server';
import Ticket from '@/models/ticket';
import Sequence from '@/models/sequence';
import moment from 'moment-timezone';

const generateTicketNumber = async () => {
  const date = moment().tz('America/Chicago'); // Central Time
  const currentDate = date.format('YYYY-MM-DD');

  let sequenceDoc = await Sequence.findOne({ date: currentDate });

  if (!sequenceDoc) {
    sequenceDoc = new Sequence({ date: currentDate, sequence: 0 });
  }

  sequenceDoc.sequence += 1;
  await sequenceDoc.save();

  const year = date.year();
  const month = date.format('MM');
  const day = date.format('DD');

  return `${year}${month}${day}-${sequenceDoc.sequence.toString().padStart(4, '0')}`;
};

export const createTicket = async (req: NextRequest) => {
  try {
    const body = await req.json();
    const ticketNumber = await generateTicketNumber();
    const ticket = new Ticket({ ...body, ticketNumber });
    await ticket.save();
    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
};

export const updateTicket = async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const body = await req.json();
    body.updatedAt = new Date();
    const ticket = await Ticket.findByIdAndUpdate(id, body, { new: true, runValidators: true });
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }
    return NextResponse.json(ticket);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
};

export const getTickets = async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    let tickets;

    if (id) {
      tickets = await Ticket.findById(id);
      if (!tickets) {
        return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
      }
    } else {
      tickets = await Ticket.find();      
    }

    return NextResponse.json(tickets, { status: 200 });
  } catch (err) {
    const error = err as Error;
    return NextResponse.json({ name: error.name, error: 'Error fetching tickets' }, { status: 500 });
  }
}

  export const deleteTicket = async (req: NextRequest) => {
    try {
      const { searchParams } = new URL(req.url);
      const id = searchParams.get('id');
      const ticket = await Ticket.findByIdAndDelete(id);
      if (!ticket) {
        return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
      }
      return NextResponse.json(ticket);
    } catch (error) {
      return NextResponse.json({ error: (error as Error).message }, { status: 400 });
    }
};