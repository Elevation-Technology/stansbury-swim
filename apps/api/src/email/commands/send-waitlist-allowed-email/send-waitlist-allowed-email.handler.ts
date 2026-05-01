import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { SendWaitlistAllowedEmailCommand } from './send-waitlist-allowed-email.command'
import { EmailService } from 'email/email.service'
import { Logger } from '@nestjs/common'

@CommandHandler(SendWaitlistAllowedEmailCommand)
export class SendWaitlistAllowedEmailHandler implements ICommandHandler<SendWaitlistAllowedEmailCommand> {
  constructor(
    private readonly emailService: EmailService,
    private readonly logger: Logger,
  ) {}

  async execute(command: SendWaitlistAllowedEmailCommand): Promise<void> {
    try {
      await this.handle(command)
    } catch (error) {
      this.logger.error(error)
    }
  }
  async handle(command: SendWaitlistAllowedEmailCommand): Promise<void> {
    await this.emailService.sendWaitlistAllowedEmail(command.user)
  }
}
