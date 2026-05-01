import { ScheduleService as GeneratedScheduleService } from '@/api/services/ScheduleService'
import type { CreateScheduleDto, UpdateScheduleDto } from '@/api'
import { BaseService, WithConfig } from './baseService'

@WithConfig()
export class ScheduleService extends BaseService {
  static async findAll(scheduleIds?: string) {
    return GeneratedScheduleService.scheduleControllerFindAll(scheduleIds)
  }

  static async findOne(id: string) {
    return GeneratedScheduleService.scheduleControllerFindOne(id)
  }

  static async create(data: CreateScheduleDto) {
    return GeneratedScheduleService.scheduleControllerCreate(data)
  }

  static async update(id: string, data: UpdateScheduleDto) {
    return GeneratedScheduleService.scheduleControllerUpdate(id, data)
  }

  static async remove(id: string) {
    return GeneratedScheduleService.scheduleControllerRemove(id)
  }

  static async findParentTot() {
    return GeneratedScheduleService.scheduleControllerFindAllParentTot()
  }

  static async findMySchedule() {
    return GeneratedScheduleService.scheduleControllerFindAllForLoggedInUser()
  }

  static async search({
    pools,
    instructors,
    daysOfWeek,
    date,
    timezone,
    includeReserved,
  }: {
    pools?: string[]
    instructors?: string[]
    daysOfWeek?: string[]
    date?: string
    timezone?: string
    includeReserved?: boolean
  } = {}) {
    return GeneratedScheduleService.scheduleControllerSearch(
      pools,
      instructors,
      daysOfWeek,
      date,
      timezone,
      includeReserved,
    )
  }

  static async findAvailableDates(timezone?: string) {
    return GeneratedScheduleService.scheduleControllerFindAvailableDates(timezone)
  }
}
