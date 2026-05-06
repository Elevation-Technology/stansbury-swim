import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  Query,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common'
import { WaitlistService } from './waitlist.service'
import { ActiveUser } from 'iam/authentication/decorators/active-user.decorator'
import { ActiveUserData } from 'iam/authentication/interfaces/active-user-data.interface'
import { Roles } from 'iam/authentication/decorators/roles.decorator'
import { ApiTags, ApiOperation, ApiOkResponse, ApiParam, ApiQuery } from '@nestjs/swagger'
import { WaitlistResponseDto } from './dto/waitlist-response.dto'
import { BulkArchiveWaitlistDto, BulkArchiveWaitlistResponseDto } from './dto/bulk-archive-waitlist.dto'
import { Role } from 'iam/role.enum'

@ApiTags('waitlist')
@Controller('waitlist')
export class WaitlistController {
  constructor(private readonly waitlistService: WaitlistService) {}

  @Get('')
  @ApiOperation({ summary: 'Get all waitlist entries' })
  @ApiQuery({ name: 'includeArchived', type: Boolean, required: false })
  @ApiOkResponse({ type: WaitlistResponseDto, isArray: true })
  async findAll(@Query('includeArchived') includeArchived?: string) {
    const waitlist = await this.waitlistService.findAll({
      includeArchived: includeArchived === 'true',
    })
    return waitlist
  }

  @Get('me')
  @ApiOperation({ summary: 'Get waitlist entry for current user' })
  @ApiOkResponse({ type: WaitlistResponseDto })
  async me(@ActiveUser() user: ActiveUserData) {
    const waitlist = await this.waitlistService.findByUserId(user.sub)
    return waitlist
  }

  @Post('join')
  @ApiOperation({ summary: 'Join the waitlist as the current user' })
  @ApiOkResponse({ type: WaitlistResponseDto })
  join(@ActiveUser() user: ActiveUserData) {
    return this.waitlistService.join(user.sub)
  }

  @Roles(Role.Admin)
  @Patch(':userId/allow-purchase')
  @ApiOperation({ summary: 'Allow a user to purchase from the waitlist' })
  @ApiParam({ name: 'userId', type: String })
  @ApiOkResponse({ type: WaitlistResponseDto })
  async update(@Param('userId') userId: string) {
    const waitlist = await this.waitlistService.allowPurchase(userId)
    if (!waitlist) {
      throw new NotFoundException()
    }
    return waitlist
  }

  @Roles(Role.Admin)
  @Patch(':id/archive')
  @ApiOperation({ summary: 'Archive a waitlist entry' })
  @ApiParam({ name: 'id', type: String, description: 'Waitlist entry id' })
  @ApiOkResponse({ type: WaitlistResponseDto })
  async archive(@Param('id') id: string) {
    return this.waitlistService.archive(id)
  }

  @Roles(Role.Admin)
  @Patch(':id/unarchive')
  @ApiOperation({ summary: 'Restore an archived waitlist entry' })
  @ApiParam({ name: 'id', type: String, description: 'Waitlist entry id' })
  @ApiOkResponse({ type: WaitlistResponseDto })
  async unarchive(@Param('id') id: string) {
    return this.waitlistService.unarchive(id)
  }

  @Roles(Role.Admin)
  @Post('bulk-archive')
  @ApiOperation({ summary: 'Archive all waitlist entries created before a given date' })
  @ApiOkResponse({ type: BulkArchiveWaitlistResponseDto })
  async bulkArchive(@Body() dto: BulkArchiveWaitlistDto) {
    const before = new Date(dto.before)
    if (isNaN(before.getTime())) {
      throw new BadRequestException('Invalid `before` date')
    }
    return this.waitlistService.bulkArchiveBefore(before)
  }
}
