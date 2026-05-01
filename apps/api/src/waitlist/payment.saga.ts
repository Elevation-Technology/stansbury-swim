import { Injectable } from '@nestjs/common'
import { Saga, ICommand, ofType } from '@nestjs/cqrs'
import { Observable, filter, map, mergeMap } from 'rxjs'
import { RemoveUserFromWaitlistCommand } from './commands/remove-user-from-waitlist/remove-user-from-waitlist.command'
import { PaymentCreatedEvent } from 'payment/events/payment-created.event'
import { PaymentUpdatedEvent } from 'payment/events/payment-updated.event'
import { PaymentStatusTypesEnum } from '@lesson-scheduler/shared'

@Injectable()
export class PaymentSaga {
  @Saga()
  onPaymentCreatedEvent = (events$: Observable<any>): Observable<ICommand> => {
    return events$.pipe(
      ofType(PaymentCreatedEvent),
      filter(event => event.payment.status === PaymentStatusTypesEnum.SUCCESS),
      map(event => new RemoveUserFromWaitlistCommand(event.payment)),
    )
  }
  @Saga()
  onPaymentUpdatedEvent = (events$: Observable<any>): Observable<ICommand> => {
    return events$.pipe(
      ofType(PaymentUpdatedEvent),
      filter(event => event.payment.status === PaymentStatusTypesEnum.SUCCESS),
      map(event => new RemoveUserFromWaitlistCommand(event.payment)),
    )
  }
}
