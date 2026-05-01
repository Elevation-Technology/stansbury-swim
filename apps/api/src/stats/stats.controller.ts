import { Controller, Get, Param, Query } from '@nestjs/common'

import { Role } from '@lesson-scheduler/shared'
import { Roles } from 'iam/authentication/decorators/roles.decorator'
import { StatsService } from './stats.service'
import { StatsResponseDto } from './dto/stats-response.dto'
import { ApiQuery, ApiResponse } from '@nestjs/swagger'

@Controller('stats')
@Roles(Role.Admin, Role.Instructor)
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('instructor/:instructorId')
  @ApiResponse({
    status: 200,
    description: 'The stats for the instructor',
    type: StatsResponseDto,
  })
  async findInstructorStats(@Param('instructorId') instructorId: string): Promise<StatsResponseDto> {
    const stats = await this.statsService.getInstructorStats(instructorId)
    return {
      privateLessons: stats.purchaseCounts.privateLessons,
      groupLessons: stats.purchaseCounts.groupLessons,
      availableLessons: stats.lessonCounts.available,
      scheduledLessons: stats.lessonCounts.scheduled,
      unscheduledPrivateLessons: stats.lessonCounts.unscheduledPrivate,
      unscheduledGroupLessons: stats.lessonCounts.unscheduledGroup,
      activeUsers: stats.userCounts.active,
    }
  }

  @Get('')
  @ApiQuery({ name: 'year', required: false, type: Number, description: 'Season year (defaults to current year)' })
  @ApiResponse({
    status: 200,
    description: 'The stats for the site',
    type: StatsResponseDto,
  })
  async findAll(@Query('year') year?: string): Promise<StatsResponseDto> {
    const parsedYear = year ? parseInt(year, 10) : undefined
    const stats = await this.statsService.getStats(parsedYear)
    return {
      privateLessons: stats.purchaseCounts.privateLessons,
      groupLessons: stats.purchaseCounts.groupLessons,
      availableLessons: stats.lessonCounts.available,
      scheduledLessons: stats.lessonCounts.scheduled,
      unscheduledPrivateLessons: stats.lessonCounts.unscheduledPrivate,
      unscheduledGroupLessons: stats.lessonCounts.unscheduledGroup,
      activeUsers: stats.userCounts.active,
    }
  }
}
