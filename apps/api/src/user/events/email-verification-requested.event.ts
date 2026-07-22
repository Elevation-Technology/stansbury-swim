import { User } from '../user'

/**
 * Raised when an address needs to prove it belongs to the account: a new sign-up, or a
 * profile email change that is staged in `pendingEmail` and waiting to be confirmed.
 * `address` is where the link goes, which is the pending address during a change.
 */
export class EmailVerificationRequestedEvent {
  constructor(
    public readonly user: User,
    public readonly address: string,
  ) {}
}
