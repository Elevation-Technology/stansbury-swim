import { Injectable } from '@nestjs/common'
import { Saga, ICommand, ofType } from '@nestjs/cqrs'
import { Observable, filter, map, mergeMap } from 'rxjs'
import { RegistrationCanceledEvent, RegistrationCreatedEvent, ReservationFailedEvent } from 'schedule/events'
import { SendCancellationEmailCommand } from './commands/send-cancellation-email/send-cancellation-email.command'
import { SendReservationEmailCommand } from './commands/send-reservation-email/send-reservation-email.command'
import { SendReservationFailedEmailCommand } from './commands/send-reservation-failed-email/send-reservation-failed-email.command'
import { SendScheduleReminderEmailCommand } from './commands/send-schedule-reminder-email/send-schedule-reminder-email.command'
import { RegistrationReminderEvent } from 'schedule/events/registration-reminder.event'

@Injectable()
export class ScheduleSaga {
  @Saga()
  onRegistrationCanceledEvent = (events$: Observable<any>): Observable<ICommand> => {
    return events$.pipe(
      ofType(RegistrationCanceledEvent),
      map(event => new SendCancellationEmailCommand(event.userId, event.scheduleId, event.studentId)),
    )
  }

  @Saga()
  onRegistrationCreatedEvent = (events$: Observable<any>): Observable<ICommand> => {
    return events$.pipe(
      ofType(RegistrationCreatedEvent),
      map(event => new SendReservationEmailCommand(event.userId, event.scheduleId, event.studentId)),
    )
  }

  @Saga()
  onReservationFailedEvent = (events$: Observable<any>): Observable<ICommand> => {
    return events$.pipe(
      ofType(ReservationFailedEvent),
      map(
        event =>
          new SendReservationFailedEmailCommand(
            event.userId,
            event.scheduleId,
            event.studentId,
            event.transactionId,
            event.reason,
            event.classFull,
          ),
      ),
    )
  }

  @Saga()
  onRegistrationReminderEvent = (events$: Observable<any>): Observable<ICommand> => {
    return events$.pipe(
      ofType(RegistrationReminderEvent),
      map(
        event => new SendScheduleReminderEmailCommand(event.userId, event.scheduleId, event.studentId, event.corrected),
      ),
    )
  }
}
