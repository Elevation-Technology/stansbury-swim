import { Command } from '@nestjs/cqrs'
import { User } from 'user/user'

export class SendWaitlistAllowedEmailCommand extends Command<void> {
  constructor(public readonly user: User) {
    super()
  }
}
