import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { EmailService } from 'email/email.service'
import { Logger } from '@nestjs/common'
import { UserService } from 'user/user.service'
import { StudentService } from 'student/student.service'
import { ScheduleService } from 'schedule/schedule.service'
import { SendScheduleReminderEmailCommand } from './send-schedule-reminder-email.command'

@CommandHandler(SendScheduleReminderEmailCommand)
export class SendScheduleReminderEmailHandler implements ICommandHandler<SendScheduleReminderEmailCommand> {
  constructor(
    private readonly emailService: EmailService,
    private readonly logger: Logger,
    private readonly userService: UserService,
    private readonly studentService: StudentService,
    private readonly scheduleService: ScheduleService,
  ) {}

  async execute(command: SendScheduleReminderEmailCommand): Promise<void> {
    try {
      await this.handle(command)
    } catch (error) {
      this.logger.error(error)
    }
  }
  async handle(command: SendScheduleReminderEmailCommand): Promise<void> {
    // Get user, get student, get schedule
    const user = await this.userService.findOne(command.userId)
    const student = await this.studentService.findOne(command.studentId)
    const schedule = await this.scheduleService.findOne(command.scheduleId, true)

    const registration = schedule.registrations.find(r => r.studentId.toString() === command.studentId)
    if (!registration) {
      this.logger.error(`Registration not found for schedule ${command.scheduleId} and student ${command.studentId}`)
      return
    }
    if (registration.reminderSentAt) {
      this.logger.log(`Reminder already sent for schedule ${command.scheduleId} and student ${command.studentId}`)
      return
    }
    if (schedule.startDateTime < new Date()) {
      this.logger.log(`Schedule already started for schedule ${command.scheduleId} and student ${command.studentId}`)
      return
    }
    this.logger.log(`Sending reminder for schedule ${command.scheduleId} and student ${command.studentId}`)

    // Send first, record second. Marking before the send meant any Resend failure was written
    // down as a successful reminder and never retried, so the client silently got nothing.
    const sent = await this.emailService.sendScheduleReminderEmail(user, student, schedule, command.corrected)

    if (!sent) {
      this.logger.error(
        `Reminder email failed for schedule ${command.scheduleId} and student ${command.studentId} ` +
          `(${user.email}) — leaving unmarked so the next run retries`,
      )
      return
    }

    await this.scheduleService.updateRegistrationReminderSentAt(command.scheduleId, student.id)
  }
}
