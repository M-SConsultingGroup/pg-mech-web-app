export interface ITicket {
  _id?: string;
  ticketNumber: string;
  name: string;
  email: string;
  phoneNumber: string;
  serviceAddress: string;
  workOrderDescription: string;
  timeAvailability: string;
  status: string;
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
  partsUsed?: string[];
  servicesDelivered?: string;
  additionalNotes?: string;
  amountBilled?: number;
  amountPaid?: string;
  images?: { type: string, default: [] }[];
}