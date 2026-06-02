import { RegistrationStatusEnum } from 'shared/registration-status-types.enum'

export class Registration {
  userId: string
  studentId: string
  transactionId?: string
  status: RegistrationStatusEnum
  heldUntil?: Date
  createdAt: Date
  reminderSentAt?: Date
}
