import { ApiProperty } from '@nestjs/swagger'
import { IsISO8601 } from 'class-validator'

export class BulkArchiveWaitlistDto {
  @ApiProperty({
    description: 'Archive entries created strictly before this ISO date.',
    example: '2026-01-01T00:00:00.000Z',
  })
  @IsISO8601()
  before: string
}

export class BulkArchiveWaitlistResponseDto {
  @ApiProperty()
  archivedCount: number
}
