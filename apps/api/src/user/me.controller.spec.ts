import { MeController } from './me.controller'
import { ActiveUserData } from '../iam/authentication/interfaces/active-user-data.interface'

const USER_ID = '507f1f77bcf86cd799439021'
const ADMIN_ID = '507f1f77bcf86cd799439099'

const activeUser = (overrides: Partial<ActiveUserData> = {}): ActiveUserData =>
  ({ sub: USER_ID, email: 'old@example.com', ...overrides }) as ActiveUserData

describe('MeController email changes', () => {
  let controller: MeController
  let userService: { update: jest.Mock }

  beforeEach(() => {
    userService = { update: jest.fn().mockResolvedValue({}) }
    controller = new MeController(userService as any)
  })

  const optionsPassed = () => userService.update.mock.calls[0][2]

  it('requires confirmation for an ordinary self-service edit', async () => {
    await controller.update(activeUser(), { email: 'new@example.com' } as any)

    expect(optionsPassed()).toEqual({ requireEmailConfirmation: true })
  })

  it('skips confirmation when an admin is driving the session through impersonation', async () => {
    // The repair path. Impersonation tokens carry the impersonated user's role, so this
    // cannot be distinguished by role alone. Staging here would mail the confirmation to an
    // address the user already cannot read.
    await controller.update(activeUser({ impersonatorId: ADMIN_ID }), { email: 'new@example.com' } as any)

    expect(optionsPassed()).toEqual({ requireEmailConfirmation: false })
  })

  it('updates the signed-in account rather than any id from the payload', async () => {
    await controller.update(activeUser(), { email: 'new@example.com', id: 'someone-else' } as any)

    expect(userService.update.mock.calls[0][0]).toBe(USER_ID)
  })
})
