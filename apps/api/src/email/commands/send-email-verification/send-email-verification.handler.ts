import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { SendEmailVerificationCommand } from './send-email-verification.command'
import { EmailService } from 'email/email.service'
import { Logger } from '@nestjs/common'

@CommandHandler(SendEmailVerificationCommand)
export class SendEmailVerificationHandler implements ICommandHandler<SendEmailVerificationCommand> {
  constructor(
    private readonly emailService: EmailService,
    private readonly logger: Logger,
  ) {}

  async execute(command: SendEmailVerificationCommand): Promise<void> {
    try {
      await this.handle(command)
    } catch (error) {
      this.logger.error(error)
    }
  }

  async handle(command: SendEmailVerificationCommand): Promise<void> {
    await this.emailService.sendVerifyEmailLink(command.user, command.address)
  }
}
