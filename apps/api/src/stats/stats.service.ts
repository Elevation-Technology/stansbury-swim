import { Injectable, NotFoundException } from '@nestjs/common'
import { TransactionService } from 'payment/transaction.service'
import { Stats } from './stats'
import { TransactionTypesEnum } from 'shared/transaction-types.enum'
import { CreditTypesEnum } from 'shared/credit-types.enum'
import { UserService } from 'user/user.service'
import { ScheduleService } from 'schedule/schedule.service'
import { fromZonedTime, formatInTimeZone } from 'date-fns-tz'
import { ORG_TIMEZONE } from 'shared/timezone'

@Injectable()
export class StatsService {
  constructor(
    private readonly transactionService: TransactionService,
    private readonly userService: UserService,
    private readonly scheduleService: ScheduleService,
  ) {}

  async getStats(year?: number): Promise<Stats> {
    // Reporting years run on the pool's calendar. In UTC the year would roll over
    // at 5pm local on December 31 and misfile that evening's activity.
    const targetYear = year ?? Number(formatInTimeZone(new Date(), ORG_TIMEZONE, 'yyyy'))
    const range = {
      from: fromZonedTime(`${targetYear}-01-01`, ORG_TIMEZONE),
      to: fromZonedTime(`${targetYear + 1}-01-01`, ORG_TIMEZONE),
    }

    const privateLessons = await this.transactionService.countCredits({
      transactionType: TransactionTypesEnum.PurchaseCredits,
      creditType: CreditTypesEnum.PRIVATE,
      ...range,
    })
    const groupLessons = await this.transactionService.countCredits({
      transactionType: TransactionTypesEnum.PurchaseCredits,
      creditType: CreditTypesEnum.GROUP,
      ...range,
    })

    const scheduledPrivateLessons = await this.transactionService.countCredits({
      transactionType: TransactionTypesEnum.Register,
      creditType: CreditTypesEnum.PRIVATE,
      ...range,
    })

    const unusedCredits = await this.transactionService.aggregateUserCreditBalances(range)
    const totalUnusedCredits = Object.values(unusedCredits).reduce((acc, value) => acc + value, 0)

    const scheduledGroupLessons = await this.transactionService.countCredits({
      transactionType: TransactionTypesEnum.Register,
      creditType: CreditTypesEnum.GROUP,
      ...range,
    })

    const availablePrivateLessons = await this.scheduleService.countAvailablePrivateLessons(range)
    const availableGroupLessons = await this.scheduleService.countAvailableGroupLessons(range)

    return {
      purchaseCounts: {
        privateLessons,
        groupLessons,
      },
      lessonCounts: {
        available: availablePrivateLessons + availableGroupLessons,
        scheduled: scheduledPrivateLessons + scheduledGroupLessons,
        unscheduledPrivate: totalUnusedCredits,
        unscheduledGroup: groupLessons - Math.abs(scheduledGroupLessons),
      },
      userCounts: {
        active: await this.userService.countActiveUsers(range),
      },
    }
  }

  async getInstructorStats(instructorId: string): Promise<Stats> {
    return {
      purchaseCounts: {
        privateLessons: 0,
        groupLessons: 0,
      },
      lessonCounts: {
        available: 0,
        scheduled: 0,
        unscheduledPrivate: 0,
        unscheduledGroup: 0,
      },
      userCounts: {
        active: 0,
      },
    }
  }
}
