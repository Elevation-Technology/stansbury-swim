import { Command } from '@nestjs/cqrs'

export class SendReservationFailedEmailCommand extends Command<void> {
  constructor(
    public readonly userId: string,
    public readonly scheduleId: string,
    public readonly studentId: string,
    public readonly transactionId: string,
    public readonly reason: string,
    public readonly classFull: boolean,
  ) {
    super()
  }
}
