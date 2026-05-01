import { User } from 'user/user'

export class WaitlistAllowedEvent {
  constructor(public readonly user: User) {}
}
