import { ApiProperty } from '@nestjs/swagger'
import { LessonTypesEnum, Role } from '@lesson-scheduler/shared'

class ScheduleUserDto {
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

class ScheduleStudentDto {
  @ApiProperty()
  id: string
  @ApiProperty()
  name: string
  @ApiProperty()
  birthDate: string
  @ApiProperty()
  notes: string
}

class ScheduleRegistrationDto {
  @ApiProperty()
  studentId: string
  @ApiProperty()
  userId: string
  @ApiProperty()
  createdAt: string
  @ApiProperty({ required: false, description: 'True when the seat is held pending payment.' })
  pending?: boolean
  @ApiProperty({ type: ScheduleStudentDto })
  student: ScheduleStudentDto
  @ApiProperty({ type: ScheduleUserDto })
  user: ScheduleUserDto
}

export class ScheduleResponseDto {
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
  @ApiProperty({ type: [ScheduleRegistrationDto] })
  registrations: ScheduleRegistrationDto[]
}
