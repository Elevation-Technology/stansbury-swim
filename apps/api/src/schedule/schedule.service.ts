import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { Model, Types } from 'mongoose'
import { InjectModel } from '@nestjs/mongoose'
import { ScheduleEntity, ScheduleStatusEnum } from './entities/schedule.entity'
import { Schedule } from './schedule'
import { CreateScheduleDto } from './dto/create-schedule.dto'
import { UpdateScheduleDto } from './dto/update-schedule.dto'
import { LessonTypesEnum } from 'shared/lesson-types.enum'
import { fromZonedTime, toZonedTime } from 'date-fns-tz'
import { addDays, addHours } from 'date-fns'
import { RegistrationService } from './registration.service'
import { RegistrationReminderEvent } from './events/registration-reminder.event'
import { EventBus } from '@nestjs/cqrs'
import { RegistrationStatusEnum } from 'shared/registration-status-types.enum'
import { activeRegistrationsExpr, isActiveRegistration } from './registration.util'

const mapper = (entity: ScheduleEntity): Schedule => {
  return {
    id: entity._id.toString(),
    poolId: entity.poolId.toString(),
    instructorId: entity.instructorId.toString(),
    classSize: entity.classSize,
    lessonType: entity.lessonType,
    startDateTime: entity.startDateTime,
    endDateTime: entity.endDateTime,
    registrations: (entity.registrations ?? []).map(registration => ({
      userId: registration.userId.toString(),
      studentId: registration.studentId.toString(),
      createdAt: registration.createdAt,
      transactionId: registration.transactionId?.toString(),
      status: registration.status ?? RegistrationStatusEnum.CONFIRMED,
      heldUntil: registration.heldUntil,
    })),
  }
}

@Injectable()
export class ScheduleService {
  constructor(
    @InjectModel(ScheduleEntity.name)
    private readonly model: Model<ScheduleEntity>,
    private readonly registrationService: RegistrationService,
    private readonly eventBus: EventBus,
    private readonly logger: Logger,
  ) {}
  async create(createScheduleDto: CreateScheduleDto): Promise<Schedule> {
    const _id = new Types.ObjectId()

    const startDateTime = new Date(createScheduleDto.startDateTime)
    const endDateTime = new Date(createScheduleDto.endDateTime)

    const result = await this.model.create({
      _id,
      poolId: new Types.ObjectId(createScheduleDto.poolId),
      instructorId: new Types.ObjectId(createScheduleDto.instructorId),
      classSize: createScheduleDto.classSize,
      lessonType: createScheduleDto.lessonType,
      startDateTime,
      endDateTime,
    })
    const entity = await this.model.findById(result._id)
    if (!entity) {
      throw new Error('Schedule not found')
    }
    return mapper(entity)
  }

  async findAll(scheduleIds?: string[]): Promise<Schedule[]> {
    const filter: any = {
      status: ScheduleStatusEnum.ACTIVE,
    }
    if (scheduleIds) {
      filter['_id'] = { $in: scheduleIds.map(id => new Types.ObjectId(id)) }
    }
    const entities = await this.model.find(filter)
    return entities.map(mapper)
  }

  async findAllByUserId(userId: string): Promise<Schedule[]> {
    return (
      await this.model.find({
        'registrations.userId': new Types.ObjectId(userId),
        status: ScheduleStatusEnum.ACTIVE,
      })
    ).map(mapper)
  }

  async search(
    poolIds?: string[],
    instructorIds?: string[],
    daysOfWeek?: number[],
    date?: string,
    timezone?: string,
    includeReserved?: boolean,
  ): Promise<Schedule[]> {
    const filter: {
      status: ScheduleStatusEnum
      $and: any[]
    } = {
      status: ScheduleStatusEnum.ACTIVE,
      $and: [],
    }

    if (poolIds && poolIds.length > 0) {
      filter.$and.push({ poolId: { $in: poolIds.map(id => new Types.ObjectId(id)) } })
    }

    if (instructorIds && instructorIds.length > 0) {
      filter.$and.push({ instructorId: { $in: instructorIds.map(id => new Types.ObjectId(id)) } })
    }

    if (daysOfWeek && daysOfWeek.length > 0) {
      filter.$and.push({
        $or: daysOfWeek.map(dayOfWeek => ({ $expr: { $eq: [{ $dayOfWeek: '$startDateTime' }, dayOfWeek] } })),
      })
    }

    if (date) {
      if (timezone) {
        // Convert local dates to UTC for database query
        const startOfDayOffset = fromZonedTime(date, timezone)
        const endOfDayOffset = addDays(startOfDayOffset, 1)

        filter.$and.push({
          startDateTime: {
            $gte: startOfDayOffset,
            $lt: endOfDayOffset,
          },
        })
      } else {
        // If no timezone provided, use UTC dates
        const [year, month, day] = date.split('-').map(Number)
        const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0))
        const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59))

        filter.$and.push({
          startDateTime: {
            $gte: startOfDay,
            $lt: endOfDay,
          },
        })
      }
    }

    const entities = await this.model.find(filter).sort({ startDateTime: 1 })
    const results = entities.map(mapper)
    if (includeReserved) {
      return results
    }
    return results.filter(
      schedule => schedule.registrations.filter(r => isActiveRegistration(r)).length < schedule.classSize,
    )
  }

  async findOne(id: string, includeCancelled?: boolean): Promise<Schedule> {
    const filter: any = {
      _id: new Types.ObjectId(id),
    }

    if (!includeCancelled) {
      filter.status = { $ne: ScheduleStatusEnum.CANCELED }
    }

    const entity = await this.model.findOne(filter)
    if (!entity) {
      throw new Error('Schedule not found')
    }
    return mapper(entity)
  }

  async update(updateScheduleDto: UpdateScheduleDto): Promise<Schedule> {
    const updates: any = {}

    if (updateScheduleDto.poolId) {
      updates['poolId'] = new Types.ObjectId(updateScheduleDto.poolId)
    }

    if (updateScheduleDto.instructorId) {
      updates['instructorId'] = new Types.ObjectId(updateScheduleDto.instructorId)
    }

    if (updateScheduleDto.classSize) {
      updates['classSize'] = updateScheduleDto.classSize
    }

    if (updateScheduleDto.lessonType) {
      updates['lessonType'] = updateScheduleDto.lessonType
    }

    if (updateScheduleDto.startDateTime) {
      updates['startDateTime'] = updateScheduleDto.startDateTime
    }

    if (updateScheduleDto.endDateTime) {
      updates['endDateTime'] = updateScheduleDto.endDateTime
    }

    await this.model.updateOne(
      { _id: new Types.ObjectId(updateScheduleDto.id) },
      {
        $set: {
          ...updates,
        },
      },
    )
    const entity = await this.model.findById(new Types.ObjectId(updateScheduleDto.id))
    if (!entity) {
      throw new Error('Product not found')
    }
    return mapper(entity)
  }

  async remove(id: string): Promise<void> {
    await this.model.updateOne({ _id: new Types.ObjectId(id) }, { $set: { status: ScheduleStatusEnum.CANCELED } })
  }

  async findAllParentTot() {
    const result = await this.model.find({
      lessonType: LessonTypesEnum.GROUP,
      status: ScheduleStatusEnum.ACTIVE,
      startDateTime: { $gte: new Date() },
    })

    return result.map(mapper)
  }

  async findAvailableDates(timezone?: string): Promise<string[]> {
    // Find all private lessons that have available spots
    const availableLessons = await this.model
      .find({
        lessonType: LessonTypesEnum.PRIVATE,
        status: ScheduleStatusEnum.ACTIVE,
        $expr: { $lt: [{ $size: activeRegistrationsExpr }, '$classSize'] },
      })
      .sort({ startDateTime: 1 })

    // Extract unique dates from the available lessons
    const uniqueDates = new Set<string>()

    availableLessons.forEach(lesson => {
      const date = lesson.startDateTime
      if (timezone) {
        // Convert UTC to local timezone
        const localDate = toZonedTime(date, timezone)
        uniqueDates.add(localDate.toISOString().split('T')[0])
      } else {
        // Use UTC date
        uniqueDates.add(date.toISOString().split('T')[0])
      }
    })

    return Array.from(uniqueDates)
  }

  async cancel(id: string) {
    const schedule = await this.findOne(id)
    if (!schedule) {
      throw new NotFoundException('Schedule not found')
    }

    for (const registration of schedule.registrations) {
      await this.registrationService.remove(id, registration.studentId, true)
    }

    await this.model.updateOne({ _id: new Types.ObjectId(id) }, { $set: { status: ScheduleStatusEnum.CANCELED } })
  }

  async countAvailablePrivateLessons(range?: { from?: Date; to?: Date }): Promise<number> {
    const startDateTime: any = { $gt: new Date() }
    if (range?.from) startDateTime.$gte = range.from
    if (range?.to) startDateTime.$lt = range.to
    return await this.model.countDocuments({
      lessonType: LessonTypesEnum.PRIVATE,
      status: ScheduleStatusEnum.ACTIVE,
      $expr: { $lt: [{ $size: activeRegistrationsExpr }, '$classSize'] },
      startDateTime,
    })
  }

  async countAvailableGroupLessons(range?: { from?: Date; to?: Date }): Promise<number> {
    const startDateTime: any = { $gt: new Date() }
    if (range?.from) startDateTime.$gte = range.from
    if (range?.to) startDateTime.$lt = range.to
    return await this.model.countDocuments({
      lessonType: LessonTypesEnum.GROUP,
      status: ScheduleStatusEnum.ACTIVE,
      $expr: { $lt: [{ $size: activeRegistrationsExpr }, '$classSize'] },
      startDateTime,
    })
  }

  async sendPendingReminders(corrected: boolean = false) {
    // Find schedules that are less than 48 hours from now and in the future.
    const fourtyEightHoursFromNow = addHours(new Date(), 48)

    const schedules = await this.model.find({
      startDateTime: { $gte: new Date(), $lte: fourtyEightHoursFromNow },
      'registrations.reminderSentAt': { $exists: false },
    })

    for (const schedule of schedules) {
      for (const registration of schedule.registrations) {
        // Only confirmed (paid) seats get reminders — never a transient hold.
        if (registration.status === RegistrationStatusEnum.HELD) {
          continue
        }
        this.logger.log(`Sending reminder for schedule ${schedule._id} and student ${registration.studentId}`)
        this.eventBus.publish(
          new RegistrationReminderEvent(
            registration.userId.toString(),
            schedule._id.toString(),
            registration.studentId.toString(),
            corrected,
          ),
        )
      }
    }
  }

  async updateRegistrationReminderSentAt(scheduleId: string, studentId: string) {
    const schedule = await this.findOne(scheduleId)
    if (!schedule) {
      throw new NotFoundException('Schedule not found')
    }
    const registration = schedule.registrations.find(r => r.studentId.toString() === studentId)
    if (!registration) {
      throw new NotFoundException('Registration not found')
    }
    await this.model.updateOne(
      { _id: new Types.ObjectId(scheduleId), 'registrations.studentId': new Types.ObjectId(studentId) },
      { $set: { 'registrations.$.reminderSentAt': new Date() } },
    )
  }
}
