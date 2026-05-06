import { ApiProperty } from '@nestjs/swagger'

export class WaitlistResponseDto {
  @ApiProperty()
  id: string

  @ApiProperty()
  userId: string

  @ApiProperty()
  firstName: string

  @ApiProperty()
  lastName: string

  @ApiProperty()
  email: string

  @ApiProperty()
  phone: string

  @ApiProperty()
  allowed: boolean

  @ApiProperty({ required: false })
  allowedOn?: string

  @ApiProperty({ required: false })
  archivedAt?: string

  @ApiProperty()
  createdAt: Date

  @ApiProperty()
  updatedAt: Date
}
