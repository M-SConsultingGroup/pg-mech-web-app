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
  priority?: Priority;
}

export interface Parts {
  category: string;
  parts:    string[];
}

export interface User {
  username: string;
  password: string;
  is_admin: boolean;
}

export interface TimeEntry {
  user: string;
  ticket: { ticketNumber: string };
  startTime: string;
  endTime: string;
}

export interface UserHours {
  [user: string]: number;
}

export type Priority = 'Highest' | 'High' | 'Medium' | 'Low' | 'Lowest' | '';