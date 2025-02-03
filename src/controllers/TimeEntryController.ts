import { NextRequest, NextResponse } from 'next/server';
import TimeEntryModel from '@/models/timeEntry';
import connectToDatabase from '@/lib/mongodb';
import { getWeekNumber } from '@/common/helperFunctions';
import { TimeEntry } from '@/common/interfaces';

export class TimeEntryController {
    static async createTimeEntry(req: NextRequest) {
        await connectToDatabase();
        const { user, ticket, startTime } = await req.json();

        const week = getWeekNumber(new Date(startTime));

        let timeEntry = await TimeEntryModel.findOne({ user, ticket });

        if (!timeEntry) {
            timeEntry = new TimeEntryModel({ user, ticket, timeRanges: [{ startTime }], week });
        } else {
            const existingOpenRange = timeEntry.timeRanges.find(range => !range.endTime);
            if (existingOpenRange) {
                return NextResponse.json({ message: 'There is already an open start time' }, { status: 400 });
            }
            timeEntry.timeRanges.push({ startTime });
            timeEntry.week = week;
        }

        await timeEntry.save();

        return NextResponse.json({ message: 'Time entry logged successfully' }, { status: 201 });
    }

    static async updateTimeEntry(req: NextRequest) {
        await connectToDatabase();
        const { user, ticket, endTime } = await req.json();

        const timeEntry = await TimeEntryModel.findOne({ user, ticket });

        if (!timeEntry) {
            return NextResponse.json({ message: 'No matching time entry found' }, { status: 404 });
        }

        const openRange = timeEntry.timeRanges.find(range => !range.endTime);

        if (!openRange) {
            return NextResponse.json({ message: 'No matching open range found' }, { status: 404 });
        }

        openRange.endTime = endTime;

        await timeEntry.save();

        return NextResponse.json({ message: 'Time entry updated successfully' }, { status: 200 });
    }

    static async getTimeEntries(req: NextRequest) {
        await connectToDatabase();
        const { searchParams } = new URL(req.url);
        const week = searchParams.get('week');
    
        const query: Partial<TimeEntry> = {};
        if (week) {
            query.week = parseInt(week, 10);
        }
    
        try {
            const timeEntries = await TimeEntryModel.find(query).populate('ticket');
    
            return NextResponse.json(timeEntries, { status: 200 });
        } catch (error) {
            if (error instanceof Error) {
                return NextResponse.json({ message: error.message }, { status: 500 });
            } else {
                return NextResponse.json({ message: 'An unknown error occurred' }, { status: 500 });
            }
        }
    }
}