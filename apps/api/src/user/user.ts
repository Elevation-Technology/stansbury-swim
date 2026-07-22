import { Role } from '@lesson-scheduler/shared'

export class User {
  id: string
  firstName: string
  lastName: string
  email: string
  emailVerified: boolean
  pendingEmail: string | null
  address1: string
  address2: string
  city: string
  state: string
  zip: string
  phone: string
  privateRegistration: boolean
  role: Role
  failedLoginAttempts: number
  lastFailedLogin: Date | null
  signedWaiver: boolean
  waiverSignature: string | null
  waiverSignatureDate: Date | null
  instructorId: string | null
}
