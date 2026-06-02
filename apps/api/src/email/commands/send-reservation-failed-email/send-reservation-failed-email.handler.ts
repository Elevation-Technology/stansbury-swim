import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Logger } from '@nestjs/common'
import { EmailService } from 'email/email.service'
import { UserService } from 'user/user.service'
import { StudentService } from 'student/student.service'
import { ScheduleService } from 'schedule/schedule.service'
import { SendReservationFailedEmailCommand } from './send-reservation-failed-email.command'

@CommandHandler(SendReservationFailedEmailCommand)
export class SendReservationFailedEmailHandler implements ICommandHandler<SendReservationFailedEmailCommand> {
  constructor(
    private readonly emailService: EmailService,
    private readonly logger: Logger,
    private readonly userService: UserService,
    private readonly studentService: StudentService,
    private readonly scheduleService: ScheduleService,
  ) {}

  async execute(command: SendReservationFailedEmailCommand): Promise<void> {
    try {
      // Resolve names best-effort — a missing record must not stop the alert from
      // going out, since the whole point is to flag a broken post-payment state.
      const user = await this.userService.findOne(command.userId).catch(() => null)
      const student = await this.studentService.findOne(command.studentId).catch(() => null)
      const schedule = await this.scheduleService.findOne(command.scheduleId, true).catch(() => null)

      await this.emailService.sendReservationFailedAdminAlert({
        user,
        student,
        schedule,
        userId: command.userId,
        studentId: command.studentId,
        scheduleId: command.scheduleId,
        transactionId: command.transactionId,
        reason: command.reason,
        classFull: command.classFull,
      })
    } catch (error) {
      this.logger.error('Failed to send reservation-failed admin alert', error instanceof Error ? error.stack : undefined)
    }
  }
}
