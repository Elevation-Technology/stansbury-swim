import { EventBus } from '@nestjs/cqrs'
import { Logger } from '@nestjs/common'
import { LessonTypesEnum } from 'shared/lesson-types.enum'
import { CreateReservationFromTransactionHandler } from './create-reservation-from-transaction.handler'
import { CreateReservationFromTransactionCommand } from './create-reservation-from-transaction.command'
import { ReservationFailedEvent } from 'schedule/events'

describe('CreateReservationFromTransactionHandler', () => {
  let handler: CreateReservationFromTransactionHandler
  let registrationService: { confirmHold: jest.Mock }
  let productService: { findOne: jest.Mock }
  let scheduleService: { findOne: jest.Mock }
  let eventBus: { publish: jest.Mock }
  let logger: { error: jest.Mock }

  const groupTransaction = {
    id: 'tx-1',
    userId: 'user-1',
    productId: 'prod-1',
    scheduleId: 'sched-1',
    studentId: 'student-1',
  } as any

  beforeEach(() => {
    registrationService = { confirmHold: jest.fn() }
    productService = { findOne: jest.fn().mockResolvedValue({ lessonType: LessonTypesEnum.GROUP }) }
    scheduleService = { findOne: jest.fn() }
    eventBus = { publish: jest.fn() }
    logger = { error: jest.fn() }

    handler = new CreateReservationFromTransactionHandler(
      registrationService as any,
      productService as any,
      scheduleService as any,
      eventBus as unknown as EventBus,
      logger as unknown as Logger,
    )
  })

  it('confirms the held seat and does not alert on the happy path', async () => {
    registrationService.confirmHold.mockResolvedValue(undefined)

    await handler.execute(new CreateReservationFromTransactionCommand(groupTransaction))

    expect(registrationService.confirmHold).toHaveBeenCalledWith('sched-1', {
      userId: 'user-1',
      studentId: 'student-1',
    })
    expect(eventBus.publish).not.toHaveBeenCalled()
    expect(logger.error).not.toHaveBeenCalled()
  })

  it('logs and publishes ReservationFailedEvent when confirmHold throws (e.g. waiver)', async () => {
    registrationService.confirmHold.mockRejectedValue(new Error('User has not signed waiver'))

    await handler.execute(new CreateReservationFromTransactionCommand(groupTransaction))

    expect(logger.error).toHaveBeenCalledTimes(1)
    expect(eventBus.publish).toHaveBeenCalledTimes(1)
    const event = eventBus.publish.mock.calls[0][0] as ReservationFailedEvent
    expect(event).toBeInstanceOf(ReservationFailedEvent)
    expect(event.transactionId).toBe('tx-1')
    expect(event.userId).toBe('user-1')
    expect(event.scheduleId).toBe('sched-1')
    expect(event.studentId).toBe('student-1')
    expect(event.reason).toBe('User has not signed waiver')
    expect(event.classFull).toBe(false)
  })

  it('flags classFull when confirmHold reports the class full after payment', async () => {
    registrationService.confirmHold.mockRejectedValue(new Error('Class is full'))

    await handler.execute(new CreateReservationFromTransactionCommand(groupTransaction))

    const event = eventBus.publish.mock.calls[0][0] as ReservationFailedEvent
    expect(event.classFull).toBe(true)
  })

  it('does not alert for non-applicable transactions (missing scheduleId)', async () => {
    await handler.execute(
      new CreateReservationFromTransactionCommand({ ...groupTransaction, scheduleId: null } as any),
    )

    expect(registrationService.confirmHold).not.toHaveBeenCalled()
    expect(eventBus.publish).not.toHaveBeenCalled()
    expect(logger.error).not.toHaveBeenCalled()
  })

  it('does not confirm or alert for private (non-group) products', async () => {
    productService.findOne.mockResolvedValue({ lessonType: LessonTypesEnum.PRIVATE })

    await handler.execute(new CreateReservationFromTransactionCommand(groupTransaction))

    expect(registrationService.confirmHold).not.toHaveBeenCalled()
    expect(eventBus.publish).not.toHaveBeenCalled()
  })
})
