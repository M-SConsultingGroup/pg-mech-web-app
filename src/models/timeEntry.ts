import { Schema, model, Document } from 'mongoose';

interface ITimeEntry extends Document {
  user: string;
  ticket: string;
  startTime: Date;
  endTime: Date;
}

const timeEntrySchema = new Schema<ITimeEntry>({
  user: { type: String, required: true },
  ticket: { type: String, ref: 'Ticket', required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
});

const TimeEntry = model<ITimeEntry>('TimeEntry', timeEntrySchema);

export default TimeEntry;