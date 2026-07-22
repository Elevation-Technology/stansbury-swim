import { Logger } from '@nestjs/common'
import { SendScheduleReminderEmailHandler } from './send-schedule-reminder-email.handler'
import { SendScheduleReminderEmailCommand } from './send-schedule-reminder-email.command'

describe('SendScheduleReminderEmailHandler', () => {
  let handler: SendScheduleReminderEmailHandler
  let emailService: { sendScheduleReminderEmail: jest.Mock }
  let userService: { findOne: jest.Mock }
  let studentService: { findOne: jest.Mock }
  let scheduleService: { findOne: jest.Mock; updateRegistrationReminderSentAt: jest.Mock }
  let logger: { log: jest.Mock; error: jest.Mock }

  const command = new SendScheduleReminderEmailCommand('user-1', 'sched-1', 'student-1')

  const scheduleWithRegistration = (overrides: Record<string, unknown> = {}) => ({
    startDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
    registrations: [{ studentId: { toString: () => 'student-1' }, ...overrides }],
  })

  beforeEach(() => {
    emailService = { sendScheduleReminderEmail: jest.fn().mockResolvedValue(true) }
    userService = { findOne: jest.fn().mockResolvedValue({ email: 'parent@example.com' }) }
    studentService = { findOne: jest.fn().mockResolvedValue({ id: 'student-1' }) }
    scheduleService = {
      findOne: jest.fn().mockResolvedValue(scheduleWithRegistration()),
      updateRegistrationReminderSentAt: jest.fn().mockResolvedValue(undefined),
    }
    logger = { log: jest.fn(), error: jest.fn() }

    handler = new SendScheduleReminderEmailHandler(
      emailService as any,
      logger as unknown as Logger,
      userService as any,
      studentService as any,
      scheduleService as any,
    )
  })

  it('records the reminder only after Resend accepts the send', async () => {
    await handler.execute(command)

    expect(emailService.sendScheduleReminderEmail).toHaveBeenCalledTimes(1)
    expect(scheduleService.updateRegistrationReminderSentAt).toHaveBeenCalledWith('sched-1', 'student-1')
  })

  it('leaves the registration unmarked when the send fails so the next run retries', async () => {
    emailService.sendScheduleReminderEmail.mockResolvedValue(false)

    await handler.execute(command)

    expect(scheduleService.updateRegistrationReminderSentAt).not.toHaveBeenCalled()
    expect(logger.error).toHaveBeenCalledTimes(1)
  })

  it('does not send twice for a registration already reminded', async () => {
    scheduleService.findOne.mockResolvedValue(scheduleWithRegistration({ reminderSentAt: new Date() }))

    await handler.execute(command)

    expect(emailService.sendScheduleReminderEmail).not.toHaveBeenCalled()
    expect(scheduleService.updateRegistrationReminderSentAt).not.toHaveBeenCalled()
  })
})
