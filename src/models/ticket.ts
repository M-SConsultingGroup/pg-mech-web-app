import { Schema, model, Document } from 'mongoose';
import { ITicket } from '@/common/interfaces';

interface ITicketDocument extends Omit<ITicket, '_id'>, Document {}

const ticketSchema = new Schema<ITicketDocument>({
  ticketNumber: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  serviceAddress: { type: String, required: true },
  workOrderDescription: { type: String, required: true },
  timeAvailability: { type: String, required: true },
  status: { type: String, required: true, enum: ['open', 'in-progress', 'closed'], default: 'open' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Ticket = model<ITicketDocument>('Ticket', ticketSchema);

export default Ticket;