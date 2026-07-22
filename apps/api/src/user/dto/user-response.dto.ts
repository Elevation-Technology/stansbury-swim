import { ApiProperty } from '@nestjs/swagger'
import { Role } from '@lesson-scheduler/shared'

export class UserResponseDto {
  @ApiProperty()
  id: string

  @ApiProperty()
  email: string

  @ApiProperty({ required: false })
  emailVerified?: boolean

  @ApiProperty({ required: false })
  pendingEmail?: string

  @ApiProperty()
  firstName: string

  @ApiProperty()
  lastName: string

  @ApiProperty()
  address1: string

  @ApiProperty()
  address2: string

  @ApiProperty()
  city: string

  @ApiProperty()
  state: string

  @ApiProperty()
  zip: string

  @ApiProperty()
  phone: string

  @ApiProperty()
  privateRegistration: boolean

  @ApiProperty({ enum: Role })
  role: Role

  @ApiProperty()
  failedLoginAttempts: number

  @ApiProperty({ required: false })
  lastFailedLogin?: Date

  @ApiProperty({ required: false })
  signedWaiver?: boolean

  @ApiProperty({ required: false })
  waiverSignature?: string

  @ApiProperty({ required: false })
  waiverSignatureDate?: Date

  @ApiProperty({ required: false })
  instructorId?: string

  @ApiProperty({ required: false })
  createdAt?: Date

  @ApiProperty({ required: false })
  updatedAt?: Date
}
