export interface ScheduleNotificationPayload {
  customerEmail: string;
  customerName: string;
  doctorName: string;
  objective: string;
  scheduledAt: Date;
}
