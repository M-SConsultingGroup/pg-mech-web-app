import { Schema, model, Document } from 'mongoose';
import { TimeEntry } from '@/common/interfaces';

interface ITimeEntry extends TimeEntry, Document { }

const timeEntrySchema = new Schema<ITimeEntry>({
  user: { type: String, required: true },
  ticket: { type: String, required: true },
  timeRanges: [{
    startTime: { type: Date, required: true },
    endTime: { type: Date },
  }],
  week: { type: Number, required: true },
}, { collection: 'time_entry' });

const TimeEntryModel = model<TimeEntry>('TimeEntry', timeEntrySchema);

export default TimeEntryModel;