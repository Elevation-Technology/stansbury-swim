import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  NotFoundException,
  HttpCode,
  Query,
  Logger,
} from '@nestjs/common'
import { ApiQuery, ApiOkResponse, ApiOperation, ApiResponse } from '@nestjs/swagger'

import { ScheduleService } from './schedule.service'
import { CreateScheduleDto } from './dto/create-schedule.dto'
import { UpdateScheduleDto } from './dto/update-schedule.dto'
import { ActiveUser } from 'iam/authentication/decorators/active-user.decorator'
import { ActiveUserData } from 'iam/authentication/interfaces/active-user-data.interface'
import { Auth } from 'iam/authentication/decorators/auth.decorator'
import { AuthType } from 'iam/authentication/enums/auth-type.enum'
import { Role } from '@lesson-scheduler/shared'
import { Roles } from 'iam/authentication/decorators/roles.decorator'
import { StudentService } from 'student/student.service'
import { UserService } from 'user/user.service'
import { FindAllSchedulesRequestDto } from './dto/find-all-schedules-request.dto'
import { SearchScheduleRequestDto } from './dto/search-schedule-request.dto'
import { SearchScheduleResponseDto } from './dto/search-schedule-response.dto'
import { ParentTotScheduleResponseDto } from './dto/parent-tot-schedule-response.dto'
import { ScheduleResponseDto } from './dto/schedules-response.dto'

@Controller('schedules')
export class ScheduleController {
  constructor(
    private readonly scheduleService: ScheduleService,
    private readonly studentService: StudentService,
    private readonly userService: UserService,
    private readonly logger: Logger,
  ) {}

  @Get('')
  @Roles(Role.Admin, Role.Instructor)
  @ApiOperation({
    summary: 'Get all schedules',
    description: 'Returns all schedules, optionally filtered by scheduleIds.',
  })
  @ApiQuery({ name: 'scheduleIds', required: false, description: 'Comma-separated list of schedule IDs to filter by' })
  @ApiOkResponse({ type: ScheduleResponseDto, isArray: true })
  async findAll(@Query() query: FindAllSchedulesRequestDto): Promise<ScheduleResponseDto[]> {
    const scheduleIds = query.scheduleIds?.split(',').filter(id => id.length > 0)
    if (query.scheduleIds && scheduleIds?.length === 0) {
      return []
    }
    const schedules = await this.scheduleService.findAll(scheduleIds)

    const studentIds = schedules.flatMap(schedule => schedule.registrations.map(registration => registration.studentId))
    const students = await this.studentService.findAllByIds(studentIds)

    const userIds = schedules.flatMap(schedule => schedule.registrations.map(registration => registration.userId))
    const users = await this.userService.findMany(userIds)

    // sort schedules by startDateTime
    schedules.sort((a, b) => a.startDateTime.getTime() - b.startDateTime.getTime())

    return schedules.map(schedule => {
      return {
        id: schedule.id,
        poolId: schedule.poolId,
        instructorId: schedule.instructorId,
        classSize: schedule.classSize,
        lessonType: schedule.lessonType,
        startDateTime: schedule.startDateTime.toISOString(),
        endDateTime: schedule.endDateTime.toISOString(),
        registrations: schedule.registrations.map(registration => {
          const student = students.find(student => student.id === registration.studentId)
          const user = users.find(user => user.id === registration.userId)
          return {
            studentId: registration.studentId,
            userId: registration.userId,
            createdAt: registration.createdAt.toISOString(),
            student: {
              id: student?.id ?? '',
              name: student?.name ?? '',
              birthDate: student?.birthday.toISOString() ?? '',
              notes: student?.notes ?? '',
            },
            user: {
              id: user?.id ?? '',
              firstName: user?.firstName ?? '',
              lastName: user?.lastName ?? '',
              email: user?.email ?? '',
              role: user?.role ?? Role.User,
            },
          }
        }),
      }
    })
  }

  @Get('parent-tot')
  @Auth(AuthType.None)
  @ApiOperation({ summary: 'Get all parent-tot schedules' })
  @ApiResponse({
    status: 200,
    description: 'List of parent-tot schedules',
    type: ParentTotScheduleResponseDto,
    isArray: true,
  })
  async findAllParentTot() {
    const schedules = await this.scheduleService.findAllParentTot()
    return schedules.map(schedule => ({
      ...schedule,
      registrations: undefined,
      spotsAvailable: schedule.classSize - schedule.registrations.length,
    }))
  }

  @Get('me')
  @ApiOperation({
    summary: 'Get all schedules for the logged-in user',
    description: 'Returns all upcoming schedules for the current user.',
  })
  @ApiOkResponse({ type: ScheduleResponseDto, isArray: true })
  async findAllForLoggedInUser(@ActiveUser() user: ActiveUserData) {
    const schedules = await this.scheduleService.findAllByUserId(user.sub)
    return schedules
  }

  @Get('search')
  @ApiOperation({
    summary: 'Search schedules',
    description: 'Search for schedules by pools, instructors, days of week, date, timezone, and includeReserved.',
  })
  @ApiOkResponse({ type: SearchScheduleResponseDto, isArray: true })
  async search(@Query() query: SearchScheduleRequestDto): Promise<SearchScheduleResponseDto[]> {
    const { pools, instructors, daysOfWeek, date, timezone, includeReserved } = query
    const daysOfWeekInt = daysOfWeek
      ?.map(day => {
        switch (day.toLowerCase()) {
          case 'sunday':
            return 1
          case 'monday':
            return 2
          case 'tuesday':
            return 3
          case 'wednesday':
            return 4
          case 'thursday':
            return 5
          case 'friday':
            return 6
          case 'saturday':
            return 7
          default:
            return null
        }
      })
      .filter(d => d != null)
    const schedules = await this.scheduleService.search(
      pools,
      instructors,
      daysOfWeekInt,
      date,
      timezone,
      includeReserved,
    )
    return schedules
      .filter(schedule => schedule.startDateTime > new Date())
      .map(schedule => ({
        id: schedule.id,
        poolId: schedule.poolId,
        instructorId: schedule.instructorId,
        classSize: schedule.classSize,
        lessonType: schedule.lessonType,
        startDateTime: schedule.startDateTime.toISOString(),
        endDateTime: schedule.endDateTime.toISOString(),
        registrations: schedule.registrations.map(registration => {
          const student = (registration as any).student || { id: '', name: '', birthDate: '', notes: '' }
          const user = (registration as any).user || { id: '', firstName: '', lastName: '', email: '', role: Role.User }
          return {
            studentId: registration.studentId,
            userId: registration.userId,
            createdAt: registration.createdAt.toISOString(),
            student: {
              id: student.id ?? '',
              name: student.name ?? '',
              birthDate: student.birthDate ?? '',
              notes: student.notes ?? '',
            },
            user: {
              id: user.id ?? '',
              firstName: user.firstName ?? '',
              lastName: user.lastName ?? '',
              email: user.email ?? '',
              role: user.role ?? Role.User,
            },
          }
        }),
      }))
  }

  @Get('available-dates')
  @ApiQuery({ name: 'timezone', required: false, description: 'IANA timezone (e.g., America/Denver)' })
  async findAvailableDates(@Query() query: { timezone?: string }) {
    const { timezone } = query
    return this.scheduleService.findAvailableDates(timezone)
  }

  @Post()
  @Roles(Role.Admin)
  create(@Body() createScheduleDto: CreateScheduleDto) {
    return this.scheduleService.create(createScheduleDto)
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const schedule = await this.scheduleService.findOne(id)
    if (!schedule) {
      throw new NotFoundException()
    }
    return schedule
  }

  @Patch(':id')
  @Roles(Role.Admin)
  async update(@Param('id') id: string, @Body() updateScheduleDto: UpdateScheduleDto) {
    const schedule = await this.scheduleService.findOne(id)
    if (!schedule) {
      throw new NotFoundException()
    }
    if (schedule.registrations.length > 0) {
      throw new Error('Cannot update a schedule that has registrations')
    }
    return this.scheduleService.update({
      ...updateScheduleDto,
      id,
    })
  }

  @Delete(':id')
  @HttpCode(204)
  @Roles(Role.Admin)
  async remove(@Param('id') id: string) {
    const schedule = await this.scheduleService.findOne(id)
    if (!schedule) {
      throw new NotFoundException()
    }
    if (schedule.registrations.length > 0) {
      await this.scheduleService.cancel(id)
    } else {
      await this.scheduleService.remove(id)
    }
  }

  @Post('send-pending-reminders')
  @Auth(AuthType.None)
  async sendPendingReminders(@Query() query: { corrected: string }) {
    this.logger.log('Sending pending reminders')
    const corrected = query.corrected === 'true'
    return this.scheduleService.sendPendingReminders(corrected)
  }
}
