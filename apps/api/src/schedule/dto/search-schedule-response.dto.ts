import { ApiProperty } from '@nestjs/swagger'
import { Role } from '@lesson-scheduler/shared'
import { LessonTypesEnum } from 'shared/lesson-types.enum'

class SearchScheduleUserDto {
  @ApiProperty()
  id: string
  @ApiProperty()
  firstName: string
  @ApiProperty()
  lastName: string
  @ApiProperty()
  email: string
  @ApiProperty({ enum: Role })
  role: Role
}

class SearchScheduleStudentDto {
  @ApiProperty()
  id: string
  @ApiProperty()
  name: string
  @ApiProperty()
  birthDate: string
  @ApiProperty()
  notes: string
}

class SearchScheduleRegistrationDto {
  @ApiProperty()
  studentId: string
  @ApiProperty()
  userId: string
  @ApiProperty()
  createdAt: string
  @ApiProperty({ required: false, description: 'True when the seat is held pending payment.' })
  pending?: boolean
  @ApiProperty({ type: SearchScheduleStudentDto })
  student: SearchScheduleStudentDto
  @ApiProperty({ type: SearchScheduleUserDto })
  user: SearchScheduleUserDto
}

export class SearchScheduleResponseDto {
  @ApiProperty()
  id: string
  @ApiProperty()
  poolId: string
  @ApiProperty()
  instructorId: string
  @ApiProperty()
  classSize: number
  @ApiProperty({ enum: LessonTypesEnum })
  lessonType: string
  @ApiProperty()
  startDateTime: string
  @ApiProperty()
  endDateTime: string
  @ApiProperty({ type: [SearchScheduleRegistrationDto] })
  registrations: SearchScheduleRegistrationDto[]
}
