import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs'
import { Logger } from '@nestjs/common'
import { ProductService } from 'product/product.service'
import { LessonTypesEnum } from 'shared/lesson-types.enum'
import { RegistrationService } from 'schedule/registration.service'
import { CreateReservationFromTransactionCommand } from './create-reservation-from-transaction.command'
import { ScheduleService } from 'schedule/schedule.service'
import { ReservationFailedEvent } from 'schedule/events'

@CommandHandler(CreateReservationFromTransactionCommand)
export class CreateReservationFromTransactionHandler
  implements ICommandHandler<CreateReservationFromTransactionCommand>
{
  constructor(
    private readonly registrationService: RegistrationService,
    private readonly productService: ProductService,
    private readonly scheduleService: ScheduleService,
    private readonly eventBus: EventBus,
    private readonly logger: Logger,
  ) {}

  async execute(command: CreateReservationFromTransactionCommand): Promise<void> {
    try {
      await this.handleCommand(command)
    } catch (e) {
      // This runs AFTER the customer has already paid. A swallowed error here means
      // money taken with no seat assigned and no spot decremented — log loudly and
      // alert an admin so the client can be manually seated or refunded.
      const t = command.transaction
      const reason = e instanceof Error ? e.message : String(e)
      const classFull = reason.toLowerCase().includes('full')
      this.logger.error(
        `Reservation failed after payment — transaction ${t.id}, user ${t.userId}, ` +
          `schedule ${t.scheduleId}, student ${t.studentId}: ${reason}`,
        e instanceof Error ? e.stack : undefined,
      )
      this.eventBus.publish(
        new ReservationFailedEvent(t.userId, t.scheduleId ?? '', t.studentId ?? '', t.id, reason, classFull),
      )
    }
  }
  async handleCommand(command: CreateReservationFromTransactionCommand): Promise<void> {
    if (command.transaction.productId == null) {
      return
    }

    if (command.transaction.scheduleId == null) {
      return
    }

    if (command.transaction.studentId == null) {
      return
    }

    const product = await this.productService.findOne(command.transaction.productId)

    if (product.lessonType != LessonTypesEnum.GROUP) {
      return
    }

    const schedule = await this.scheduleService.findOne(command.transaction.scheduleId)

    if (schedule.registrations.length >= schedule.classSize) {
      throw new Error('Class is full')
    }

    await this.registrationService.create(command.transaction.scheduleId, {
      userId: command.transaction.userId,
      studentId: command.transaction.studentId,
    })
  }
}
