import { NextRequest, NextResponse } from 'next/server';
import TimeEntry from '@/models/timeEntry';
import connectToDatabase from '@/lib/mongodb';

export async function POST(req: NextRequest) {
  await connectToDatabase();
  const { user, ticket, startTime, endTime } = await req.json();

  const timeEntry = new TimeEntry({ user, ticket, startTime, endTime });
  await timeEntry.save();

  return NextResponse.json({ message: 'Time entry logged successfully' }, { status: 201 });
}

export async function GET(req: NextRequest) {
  await connectToDatabase();
  const { searchParams } = new URL(req.url);
  const user = searchParams.get('user');

  const query = user ? { user } : {};
  const timeEntries = await TimeEntry.find(query).populate('ticket');

  return NextResponse.json(timeEntries, { status: 200 });
}