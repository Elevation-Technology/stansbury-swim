import { BadRequestException } from '@nestjs/common'
import { EventBus } from '@nestjs/cqrs'
import { RegistrationService } from './registration.service'
import { RegistrationStatusEnum } from 'shared/registration-status-types.enum'
import { TransactionTypesEnum } from 'shared/transaction-types.enum'
import { LessonTypesEnum } from 'shared/lesson-types.enum'

// Valid 24-char hex so `new Types.ObjectId(...)` doesn't throw.
const SCHEDULE_ID = '507f1f77bcf86cd799439011'
const USER_ID = '507f1f77bcf86cd799439012'
const STUDENT_ID = '507f1f77bcf86cd799439013'

const scheduleEntity = () => ({
  _id: SCHEDULE_ID,
  poolId: '507f1f77bcf86cd799439014',
  instructorId: '507f1f77bcf86cd799439015',
  classSize: 4,
  lessonType: LessonTypesEnum.GROUP,
  startDateTime: new Date('2030-01-01T00:00:00Z'),
  endDateTime: new Date('2030-01-01T01:00:00Z'),
  registrations: [],
})

describe('RegistrationService hold/confirmHold', () => {
  let service: RegistrationService
  let model: { findOneAndUpdate: jest.Mock; updateOne: jest.Mock; findById: jest.Mock }
  let transactionService: { create: jest.Mock }
  let userService: { findOne: jest.Mock }
  let studentService: { findOne: jest.Mock }
  let eventBus: { publish: jest.Mock }

  beforeEach(() => {
    model = { findOneAndUpdate: jest.fn(), updateOne: jest.fn().mockResolvedValue({}), findById: jest.fn() }
    transactionService = { create: jest.fn().mockResolvedValue({ id: '507f1f77bcf86cd799439016' }) }
    userService = { findOne: jest.fn().mockResolvedValue({ id: USER_ID, signedWaiver: true }) }
    studentService = { findOne: jest.fn().mockResolvedValue({ id: STUDENT_ID, userId: USER_ID }) }
    eventBus = { publish: jest.fn() }

    service = new RegistrationService(
      model as any,
      transactionService as any,
      userService as any,
      eventBus as unknown as EventBus,
      studentService as any,
    )
  })

  describe('hold', () => {
    it('pulls expired holds then pushes a HELD seat guarded by capacity', async () => {
      model.findOneAndUpdate.mockResolvedValue(scheduleEntity())

      await service.hold(SCHEDULE_ID, { userId: USER_ID, studentId: STUDENT_ID })

      // expired-hold cleanup first
      expect(model.updateOne).toHaveBeenCalledTimes(1)
      // then the guarded push
      expect(model.findOneAndUpdate).toHaveBeenCalledTimes(1)
      const [, update] = model.findOneAndUpdate.mock.calls[0]
      const pushed = update.$push.registrations
      expect(pushed.status).toBe(RegistrationStatusEnum.HELD)
      expect(pushed.heldUntil).toBeInstanceOf(Date)
      expect(pushed.heldUntil.getTime()).toBeGreaterThan(Date.now())
      expect(pushed.transactionId).toBeUndefined()
      // no credit movement on hold
      expect(transactionService.create).not.toHaveBeenCalled()
    })

    it('throws when the class is full (guard returns null)', async () => {
      model.findOneAndUpdate.mockResolvedValue(null)

      await expect(service.hold(SCHEDULE_ID, { userId: USER_ID, studentId: STUDENT_ID })).rejects.toThrow(
        'Schedule is full',
      )
    })

    it('rejects when the user has not signed the waiver', async () => {
      userService.findOne.mockResolvedValue({ id: USER_ID, signedWaiver: false })

      await expect(service.hold(SCHEDULE_ID, { userId: USER_ID, studentId: STUDENT_ID })).rejects.toThrow(
        'User has not signed waiver',
      )
      expect(model.findOneAndUpdate).not.toHaveBeenCalled()
    })
  })

  describe('confirmHold', () => {
    beforeEach(() => {
      model.findById.mockResolvedValue(scheduleEntity())
    })

    it('confirms an existing hold and books a single -1 Register transaction', async () => {
      model.findOneAndUpdate.mockResolvedValueOnce(scheduleEntity()) // confirm succeeds

      await service.confirmHold(SCHEDULE_ID, { userId: USER_ID, studentId: STUDENT_ID })

      expect(transactionService.create).toHaveBeenCalledTimes(1)
      const txn = transactionService.create.mock.calls[0][0]
      expect(txn.credits).toBe(-1)
      expect(txn.transactionType).toBe(TransactionTypesEnum.Register)
      // confirm set status + transactionId, unset heldUntil
      const [, update] = model.findOneAndUpdate.mock.calls[0]
      expect(update.$set['registrations.$.status']).toBe(RegistrationStatusEnum.CONFIRMED)
      expect(update.$unset['registrations.$.heldUntil']).toBeDefined()
      expect(eventBus.publish).toHaveBeenCalledTimes(1)
    })

    it('reclaims an open seat when the hold expired before payment cleared', async () => {
      model.findOneAndUpdate
        .mockResolvedValueOnce(null) // confirm finds no live hold
        .mockResolvedValueOnce(scheduleEntity()) // reclaim push succeeds

      await service.confirmHold(SCHEDULE_ID, { userId: USER_ID, studentId: STUDENT_ID })

      expect(model.findOneAndUpdate).toHaveBeenCalledTimes(2)
      // only the -1 debit, no compensating +1
      expect(transactionService.create).toHaveBeenCalledTimes(1)
      expect(transactionService.create.mock.calls[0][0].credits).toBe(-1)
      expect(eventBus.publish).toHaveBeenCalledTimes(1)
    })

    it('refunds the credit and throws when the seat is gone and the class is full', async () => {
      model.findOneAndUpdate
        .mockResolvedValueOnce(null) // confirm fails
        .mockResolvedValueOnce(null) // reclaim fails

      await expect(service.confirmHold(SCHEDULE_ID, { userId: USER_ID, studentId: STUDENT_ID })).rejects.toThrow(
        'Class is full',
      )

      // -1 debit then compensating +1 so the ledger nets out
      expect(transactionService.create).toHaveBeenCalledTimes(2)
      expect(transactionService.create.mock.calls[0][0].credits).toBe(-1)
      expect(transactionService.create.mock.calls[1][0].credits).toBe(1)
      expect(transactionService.create.mock.calls[1][0].transactionType).toBe(TransactionTypesEnum.CancelRegistration)
      expect(eventBus.publish).not.toHaveBeenCalled()
    })
  })

  it('BadRequestException is the thrown type when full', async () => {
    model.findOneAndUpdate.mockResolvedValue(null)
    await expect(service.hold(SCHEDULE_ID, { userId: USER_ID, studentId: STUDENT_ID })).rejects.toBeInstanceOf(
      BadRequestException,
    )
  })
})
