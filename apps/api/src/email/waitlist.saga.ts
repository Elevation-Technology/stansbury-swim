import { Injectable } from '@nestjs/common'
import { Saga, ICommand, ofType } from '@nestjs/cqrs'
import { Observable, map } from 'rxjs'
import { WaitlistAllowedEvent } from 'waitlist/events/waitlist-allowed.event'
import { SendWaitlistAllowedEmailCommand } from './commands/send-waitlist-allowed-email/send-waitlist-allowed-email.command'

@Injectable()
export class WaitlistSaga {
  @Saga()
  onWaitlistAllowedEvent = (events$: Observable<any>): Observable<ICommand> => {
    return events$.pipe(
      ofType(WaitlistAllowedEvent),
      map(event => new SendWaitlistAllowedEmailCommand(event.user)),
    )
  }
}
