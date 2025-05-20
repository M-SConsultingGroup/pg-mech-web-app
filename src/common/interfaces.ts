export interface Ticket {
  id: string;
  ticketNumber: string;
  name: string;
  email: string;
  phoneNumber: string;
  serviceAddress: string;
  workOrderDescription: string;
  timeAvailability: string;
  status: string;
  inProgress: boolean;
  createdAt: Date;
  updatedAt: Date;
  coordinates: { latitude: number; longitude: number };
  assignedTo?: string;
  invoiceNumber?: string;
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
  parts: string[];
}

export interface User {
  username: string;
  password: string;
  isAdmin: boolean;
}

export interface TimeRange {
  startTime: Date;
  endTime?: Date;
}

export interface TimeEntry {
  user: string;
  ticket: string;
  timeRanges: TimeRange[];
  week: number;
}

export interface UserHours {
  [user: string]: {
    total: number;
    weekly: {
      [week: number]: number;
    };
  };
}

export type Priority = 'Highest' | 'High' | 'Medium' | 'Low' | 'Lowest' | '';

export type ModalType = 'none' | 'priority' | 'notes' | 'popup' | 'confirmation';

export const priorityMap: { [key in Priority]: number | null } = {
  'Highest': 1,
  'High': 2,
  'Medium': 3,
  'Low': 4,
  'Lowest': 5,
  '': null,
};

export interface StatsData {
  total: number;
  [key: string]: number | UserStats;
}

export interface UserStats {
  total: number;
  [key: string]: number;
}