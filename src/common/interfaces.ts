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
    createdAt: Date;
    updatedAt: Date;
  }