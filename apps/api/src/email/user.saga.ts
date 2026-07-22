import { Injectable } from '@nestjs/common'
import { Saga, ICommand, ofType } from '@nestjs/cqrs'
import { Observable, map } from 'rxjs'
import { UserRegisterEvent } from 'user/events/user-register.event'
import { EmailVerificationRequestedEvent } from 'user/events/email-verification-requested.event'
import { SendWelcomeEmailCommand } from './commands/send-welcome-email/send-welcome-email.command'
import { SendEmailVerificationCommand } from './commands/send-email-verification/send-email-verification.command'
@Injectable()
export class UserSaga {
  @Saga()
  onUserRegisterEvent = (events$: Observable<any>): Observable<ICommand> => {
    return events$.pipe(
      ofType(UserRegisterEvent),
      map(event => new SendWelcomeEmailCommand(event.user)),
    )
  }

  @Saga()
  onEmailVerificationRequestedEvent = (events$: Observable<any>): Observable<ICommand> => {
    return events$.pipe(
      ofType(EmailVerificationRequestedEvent),
      map(event => new SendEmailVerificationCommand(event.user, event.address)),
    )
  }
}
