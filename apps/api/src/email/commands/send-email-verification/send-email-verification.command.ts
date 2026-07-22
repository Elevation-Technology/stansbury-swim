import { Command } from '@nestjs/cqrs'
import { User } from 'user/user'

export class SendEmailVerificationCommand extends Command<void> {
  constructor(
    public readonly user: User,
    public readonly address: string,
  ) {
    super()
  }
}
