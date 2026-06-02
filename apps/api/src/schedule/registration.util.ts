import { RegistrationStatusEnum } from 'shared/registration-status-types.enum'

// How long a seat stays reserved during checkout before the hold auto-releases.
export const HOLD_TTL_MS = 10 * 60 * 1000

interface RegistrationLike {
  status?: RegistrationStatusEnum | string
  heldUntil?: Date | null
}

// A registration occupies a seat when it is CONFIRMED, or HELD but not yet expired.
// Legacy rows have no `status` and are treated as CONFIRMED.
export const isActiveRegistration = (registration: RegistrationLike, now: Date = new Date()): boolean => {
  if (registration.status !== RegistrationStatusEnum.HELD) {
    return true
  }
  return registration.heldUntil != null && new Date(registration.heldUntil) > now
}

// Mongo aggregation expression yielding only the registrations that occupy a seat — drop-in
// replacement for `'$registrations'` inside a `$size`. Uses server time (`$$NOW`).
export const activeRegistrationsExpr = {
  $filter: {
    input: { $ifNull: ['$registrations', []] },
    as: 'r',
    cond: {
      $or: [
        { $ne: ['$$r.status', RegistrationStatusEnum.HELD] },
        { $gt: ['$$r.heldUntil', '$$NOW'] },
      ],
    },
  },
}

// `$expr` guard that is true while the class still has room (counting only active seats).
export const hasAvailableSeatExpr = {
  $lt: [{ $size: activeRegistrationsExpr }, '$classSize'],
}
